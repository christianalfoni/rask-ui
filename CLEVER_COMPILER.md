# Clever Compiler Transformation Plan

## Current State

The RASK UI compiler currently transforms component functions in two different ways:

### Stateful Components
Components that return a function (render function):
```tsx
export function TodoItem(props) {
  const state = createState({ ... });

  return () => <div>...</div>; // Returns arrow function
}
```
Transformed into: `RaskStatefulComponent` with a `setup` property

### Stateless Components
Components that directly return JSX:
```tsx
export function Header() {
  return <div>...</div>; // Direct JSX return
}
```
Transformed into: `RaskStatelessComponent` with a `renderFn` property

## Problem with Current Approach

Users must explicitly return a function from stateful components, which is not a standard React/JSX pattern. This creates cognitive overhead and breaks familiarity with common React patterns.

## New Approach: Unified Stateful Components

**Goal**: Allow all components to return JSX directly (like React), but treat them all as stateful components by intelligently wrapping their return statements.

### Key Transformation Strategy

1. **Identify all component functions** that return VNode calls (JSX after Inferno transformation)
2. **Find return statement boundaries**:
   - Find the **first body return statement** (earliest return that would exit the function body)
   - Find the **last body return statement** (final return from the function body)
   - In most cases, these are the same return statement
3. **Wrap the code between these boundaries** into an arrow function
4. **Transform to RaskStatefulComponent** (eliminate RaskStatelessComponent entirely)

### Transformation Examples

#### Example 1: Single Return (Most Common)
**Before:**
```tsx
export function Header() {
  return <div>Header</div>;
}
```

**After:**
```tsx
export class Header extends RaskStatefulComponent {
  setup = function Header() {
    return () => <div>Header</div>;
  }
}
```

#### Example 2: Multiple Returns (Early Exit Patterns)
**Before:**
```tsx
export function TodoItem(props) {
  const state = createState({ ... });

  if (!props.todo) {
    return <div>No todo</div>;  // First return
  }

  const handleClick = () => { ... };

  return (
    <div>{props.todo.text}</div>  // Last return
  );
}
```

**After:**
```tsx
export class TodoItem extends RaskStatefulComponent {
  setup = function TodoItem(props) {
    const state = createState({ ... });

    return () => {
      if (!props.todo) {
        return <div>No todo</div>;  // Wrapped in render function
      }

      const handleClick = () => { ... };

      return (
        <div>{props.todo.text}</div>
      );
    };
  }
}
```

#### Example 3: Switch/Conditional Returns
**Before:**
```tsx
export function StatusBadge({ status }) {
  switch (status) {
    case 'active':
      return <span>Active</span>;
    case 'pending':
      return <span>Pending</span>;
    default:
      return <span>Unknown</span>;
  }
}
```

**After:**
```tsx
export class StatusBadge extends RaskStatefulComponent {
  setup = function StatusBadge({ status }) {
    return () => {
      switch (status) {
        case 'active':
          return <span>Active</span>;
        case 'pending':
          return <span>Pending</span>;
        default:
          return <span>Unknown</span>;
      }
    };
  }
}
```

## Implementation Plan

### Phase 1: Analyze Function Body Structure
1. **Traverse function body** to identify all return statements
2. **Classify returns** into:
   - Body-level returns (directly in function body)
   - Nested returns (inside callbacks, inner functions)
3. **Identify boundaries**:
   - First body-level return statement
   - Last body-level return statement

### Phase 2: Code Extraction & Wrapping
1. **Extract code segments**:
   - **Before first return**: Code that runs during setup (stays outside wrapper)
   - **Between first and last return**: Code that needs to be in render function
   - For single return: This is just the return expression
2. **Wrap in arrow function**:
   - Create: `return () => { [extracted code] }`
   - Preserve all return statements within the wrapper

### Phase 3: Handle Edge Cases
1. **Single return statement**: Most straightforward case
   ```rust
   // Just wrap: return <div/> → return () => <div/>
   ```

2. **Multiple returns in sequence**:
   ```rust
   // Wrap all returns: if (x) return A; return B;
   // → return () => { if (x) return A; return B; }
   ```

3. **Returns inside nested blocks** (if, switch, loops):
   ```rust
   // Keep structure, wrap the entire block containing returns
   ```

4. **Mixed setup and render code**:
   ```rust
   // Code before first return: stays outside wrapper (setup)
   // Code with returns: goes inside wrapper (render)
   ```

### Phase 4: AST Transformation Details (Rust/SWC)

In `lib.rs`, modify these functions:

#### 1. Remove `is_stateless_component` check
No longer needed - everything becomes stateful

#### 2. Enhance `is_rask_component` → `is_component`
```rust
fn is_component(&self, func: &Function) -> bool {
    // Just check if it has VNode calls anywhere
    // Don't distinguish between stateful/stateless
}
```

#### 3. Create new function: `find_return_boundaries`
```rust
fn find_return_boundaries(&self, func: &Function) -> Option<(usize, usize)> {
    // Returns (first_return_index, last_return_index)
    // None if no returns found
    // Traverse body statements, identify body-level returns only
}
```

#### 4. Create new function: `extract_render_code`
```rust
fn extract_render_code(&self, func: &Function, boundaries: (usize, usize)) -> Vec<Stmt> {
    // Extract statements that should be in render function
    // Handle the slicing/extraction logic
}
```

#### 5. Create new function: `wrap_in_render_function`
```rust
fn wrap_in_render_function(&self, render_stmts: Vec<Stmt>) -> Expr {
    // Creates: () => { [render_stmts] }
    // Returns an arrow function expression
}
```

#### 6. Modify `transform_to_stateful_class`
```rust
fn transform_to_stateful_class(&mut self, name: Ident, func: Function) -> Decl {
    // 1. Find return boundaries
    let boundaries = self.find_return_boundaries(&func);

    // 2. Split function into setup and render parts
    let (setup_stmts, render_stmts) = self.split_function_body(&func, boundaries);

    // 3. Wrap render code in arrow function
    let render_fn = self.wrap_in_render_function(render_stmts);

    // 4. Create new function body: setup_stmts + return render_fn
    let new_func = self.create_setup_function(setup_stmts, render_fn);

    // 5. Create class as before
    // ... existing class creation logic
}
```

#### 7. Remove `transform_to_stateless_class`
No longer needed

#### 8. Update `visit_mut_module_item`
```rust
fn visit_mut_module_item(&mut self, item: &mut ModuleItem) {
    match item {
        ModuleItem::Stmt(Stmt::Decl(Decl::Fn(fn_decl))) => {
            if self.is_component(&fn_decl.function) {  // Single check
                let name = fn_decl.ident.clone();
                let func = (*fn_decl.function).clone();
                let class_decl = self.transform_to_stateful_class(name, func);
                *item = ModuleItem::Stmt(Stmt::Decl(class_decl));
                return;
            }
        }
        // Similar for export patterns...
    }
}
```

## Algorithm: Finding Return Boundaries

```rust
fn find_return_boundaries(&self, body: &BlockStmt) -> Option<(usize, usize)> {
    let mut first_return: Option<usize> = None;
    let mut last_return: Option<usize> = None;

    for (index, stmt) in body.stmts.iter().enumerate() {
        match stmt {
            // Direct return in body
            Stmt::Return(_) => {
                if first_return.is_none() {
                    first_return = Some(index);
                }
                last_return = Some(index);
            }

            // Returns inside if/else/switch blocks (body-level control flow)
            Stmt::If(if_stmt) => {
                if self.has_body_level_return(if_stmt) {
                    if first_return.is_none() {
                        first_return = Some(index);
                    }
                    last_return = Some(index);
                }
            }

            Stmt::Switch(switch_stmt) => {
                if self.has_body_level_return(switch_stmt) {
                    if first_return.is_none() {
                        first_return = Some(index);
                    }
                    last_return = Some(index);
                }
            }

            _ => {}
        }
    }

    match (first_return, last_return) {
        (Some(first), Some(last)) => Some((first, last)),
        _ => None
    }
}
```

## Benefits

1. **Familiar React-like API**: Components can return JSX directly
2. **Unified transformation**: Single code path (RaskStatefulComponent only)
3. **Performance**: Same reactive benefits, just better DX
4. **Backward compatible**: Existing components with `return () => JSX` still work
5. **Simpler mental model**: One way to write components

## Migration Path

### Automatic for Users
The transformation happens at compile time, so existing code continues to work:

```tsx
// Old style (still works)
function App() {
  return () => <div>App</div>;
}

// New style (also works)
function App() {
  return <div>App</div>;
}
```

Both compile to the same `RaskStatefulComponent` class.

## Testing Strategy

1. **Test single return transformations**
2. **Test multiple return transformations** (early exits)
3. **Test conditional returns** (if/switch)
4. **Test mixed setup/render code**
5. **Test nested callbacks** (ensure they're not wrapped)
6. **Test backward compatibility** (existing `return () => JSX` pattern)

## Files to Modify

1. **`packages/core/swc-plugin/src/lib.rs`**: Main transformation logic
   - Line 106-123: Remove `is_stateless_component`
   - Line 126-158: Modify `is_rask_component` → `is_component`
   - Add new functions: `find_return_boundaries`, `extract_render_code`, `wrap_in_render_function`
   - Line 161-204: Modify `transform_to_stateful_class`
   - Line 206-250: Remove `transform_to_stateless_class`
   - Line 388-446: Simplify `visit_mut_module_item`

2. **`packages/core/src/component.ts`**: Runtime changes (if needed)
   - RaskStatelessComponent can be deprecated (not removed for backward compat)

## Open Questions

1. **Should we keep RaskStatelessComponent for backward compatibility?**
   - Recommendation: Yes, but deprecated. Users can opt-in to remove it later.

2. **What about components that already return functions?**
   - They should work as-is (detect the pattern and skip wrapping)

3. **Performance implications?**
   - Should be identical - same reactive tracking, just different syntax

4. **Should we add warnings for deprecated patterns?**
   - Could add compiler warnings when detecting old `return () => JSX` pattern

## Success Criteria

✅ Components can return JSX directly
✅ All existing tests pass
✅ Demo app works without changes
✅ Performance characteristics unchanged
✅ Backward compatible with existing code
✅ Proper handling of edge cases (multiple returns, conditionals)
