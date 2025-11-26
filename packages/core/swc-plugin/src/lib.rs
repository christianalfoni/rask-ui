use swc_core::ecma::{
    ast::*,
    atoms::Wtf8Atom,
    utils::{private_ident, quote_ident},
    visit::{noop_visit_mut_type, VisitMut, VisitMutWith},
};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

#[derive(Default, Clone, serde::Deserialize)]
#[serde(crate = "serde")]
pub struct Config {
    #[serde(default, rename = "importSource")]
    pub import_source: Option<String>,
}

pub struct RaskComponentTransform {
    config: Config,
    import_rask_stateful_component: Option<Ident>,
    import_rask_stateless_component: Option<Ident>,
}

impl RaskComponentTransform {
    fn new(config: Config) -> Self {
        RaskComponentTransform {
            config,
            import_rask_stateful_component: None,
            import_rask_stateless_component: None,
        }
    }

    /// Check if an expression contains a VNode-related call (recursive deep search)
    fn has_vnode_call(&self, expr: &Expr) -> bool {
        match expr {
            // Direct VNode call - this is what we're looking for
            Expr::Call(call) => {
                if let Callee::Expr(callee_expr) = &call.callee {
                    if let Expr::Ident(ident) = &**callee_expr {
                        if ident.sym.as_ref() == "createVNode"
                            || ident.sym.as_ref() == "createComponentVNode"
                            || ident.sym.as_ref() == "createFragment"
                            || ident.sym.as_ref() == "createTextVNode"
                        {
                            return true;
                        }
                    }
                }
                // Check arguments - important for .map(...), .filter(...), etc.
                for arg in &call.args {
                    if self.has_vnode_call(&arg.expr) {
                        return true;
                    }
                }
                false
            }
            // Parenthesized expressions
            Expr::Paren(paren) => self.has_vnode_call(&paren.expr),

            // Conditional (ternary): condition ? consequent : alternate
            Expr::Cond(cond) => {
                self.has_vnode_call(&cond.cons) || self.has_vnode_call(&cond.alt)
            }

            // Logical: expr1 && expr2, expr1 || expr2
            Expr::Bin(bin) => {
                self.has_vnode_call(&bin.left) || self.has_vnode_call(&bin.right)
            }

            // Arrays: [expr1, expr2, ...]
            Expr::Array(arr) => {
                arr.elems.iter().any(|elem| {
                    elem.as_ref()
                        .map(|e| self.has_vnode_call(&e.expr))
                        .unwrap_or(false)
                })
            }

            // Arrow functions: (args) => body
            Expr::Arrow(arrow) => match &*arrow.body {
                BlockStmtOrExpr::Expr(expr) => self.has_vnode_call(expr),
                BlockStmtOrExpr::BlockStmt(block) => {
                    for stmt in &block.stmts {
                        if let Stmt::Return(ret) = stmt {
                            if let Some(arg) = &ret.arg {
                                if self.has_vnode_call(arg) {
                                    return true;
                                }
                            }
                        }
                    }
                    false
                }
            },

            // Member expressions: obj.method()
            Expr::Member(member) => self.has_vnode_call(&member.obj),

            // Unary expressions: !expr, +expr, etc.
            Expr::Unary(unary) => self.has_vnode_call(&unary.arg),

            // JSX/Fragments - already transformed by Inferno plugin, so we won't see these
            _ => false,
        }
    }

    /// Check if a function body directly returns VNode calls (stateless component)
    fn is_stateless_component(&self, func: &Function) -> bool {
        if let Some(body) = &func.body {
            for stmt in &body.stmts {
                if let Stmt::Return(ret_stmt) = stmt {
                    if let Some(ret_arg) = &ret_stmt.arg {
                        // Check if directly returning VNode (not arrow function)
                        if self.has_vnode_call(ret_arg) {
                            // Make sure it's NOT an arrow function
                            if !matches!(&**ret_arg, Expr::Arrow(_)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        false
    }

    /// Check if a function body returns an arrow function with VNode calls (stateful component)
    fn is_rask_component(&self, func: &Function) -> bool {
        if let Some(body) = &func.body {
            for stmt in &body.stmts {
                if let Stmt::Return(ret_stmt) = stmt {
                    if let Some(ret_arg) = &ret_stmt.arg {
                        // Check if returning arrow function
                        if let Expr::Arrow(arrow) = &**ret_arg {
                            // Check arrow body for VNode calls
                            match &*arrow.body {
                                BlockStmtOrExpr::Expr(expr) => {
                                    if self.has_vnode_call(expr) {
                                        return true;
                                    }
                                }
                                BlockStmtOrExpr::BlockStmt(block) => {
                                    if self.block_has_vnode_return(block) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        false
    }

    /// Recursively check if a block statement contains any return with VNode calls
    fn block_has_vnode_return(&self, block: &BlockStmt) -> bool {
        for stmt in &block.stmts {
            if self.stmt_has_vnode_return(stmt) {
                return true;
            }
        }
        false
    }

    /// Check if a statement (or nested statements) contains a return with VNode calls
    fn stmt_has_vnode_return(&self, stmt: &Stmt) -> bool {
        match stmt {
            // Direct return statement
            Stmt::Return(ret) => {
                if let Some(arg) = &ret.arg {
                    return self.has_vnode_call(arg);
                }
            }
            // If statement - check both branches
            Stmt::If(if_stmt) => {
                // Check consequent block
                if self.stmt_has_vnode_return(&if_stmt.cons) {
                    return true;
                }
                // Check alternate (else/else if) branch
                if let Some(alt) = &if_stmt.alt {
                    if self.stmt_has_vnode_return(alt) {
                        return true;
                    }
                }
            }
            // Block statement - recursively check all statements
            Stmt::Block(block) => {
                return self.block_has_vnode_return(block);
            }
            // Switch statement - check all cases
            Stmt::Switch(switch) => {
                for case in &switch.cases {
                    for cons_stmt in &case.cons {
                        if self.stmt_has_vnode_return(cons_stmt) {
                            return true;
                        }
                    }
                }
            }
            // Try-catch-finally - check all blocks
            Stmt::Try(try_stmt) => {
                if self.block_has_vnode_return(&try_stmt.block) {
                    return true;
                }
                if let Some(handler) = &try_stmt.handler {
                    if self.block_has_vnode_return(&handler.body) {
                        return true;
                    }
                }
                if let Some(finalizer) = &try_stmt.finalizer {
                    if self.block_has_vnode_return(finalizer) {
                        return true;
                    }
                }
            }
            // For/while/do-while loops - check body
            Stmt::For(for_stmt) => {
                return self.stmt_has_vnode_return(&for_stmt.body);
            }
            Stmt::ForIn(for_in) => {
                return self.stmt_has_vnode_return(&for_in.body);
            }
            Stmt::ForOf(for_of) => {
                return self.stmt_has_vnode_return(&for_of.body);
            }
            Stmt::While(while_stmt) => {
                return self.stmt_has_vnode_return(&while_stmt.body);
            }
            Stmt::DoWhile(do_while) => {
                return self.stmt_has_vnode_return(&do_while.body);
            }
            // Labeled statement - check the nested statement
            Stmt::Labeled(labeled) => {
                return self.stmt_has_vnode_return(&labeled.body);
            }
            _ => {}
        }
        false
    }

    /// Transform a function declaration to a RaskStatefulComponent class
    fn transform_to_stateful_class(&mut self, name: Ident, func: Function) -> Decl {
        // Ensure we have the RaskStatefulComponent import
        if self.import_rask_stateful_component.is_none() {
            self.import_rask_stateful_component = Some(private_ident!("RaskStatefulComponent"));
        }

        let super_class_ident = self.import_rask_stateful_component.as_ref().unwrap().clone();

        // Create the class property: setup = function name() { ... }
        let setup_prop = ClassMember::ClassProp(ClassProp {
            span: Default::default(),
            key: PropName::Ident(quote_ident!("setup").into()),
            value: Some(Box::new(Expr::Fn(FnExpr {
                ident: Some(name.clone()),
                function: Box::new(func),
            }))),
            type_ann: None,
            is_static: false,
            decorators: vec![],
            accessibility: None,
            is_abstract: false,
            is_optional: false,
            is_override: false,
            readonly: false,
            declare: false,
            definite: false,
        });

        Decl::Class(ClassDecl {
            ident: name,
            declare: false,
            class: Box::new(Class {
                span: Default::default(),
                ctxt: Default::default(),
                decorators: vec![],
                body: vec![setup_prop],
                super_class: Some(Box::new(Expr::Ident(super_class_ident))),
                is_abstract: false,
                type_params: None,
                super_type_params: None,
                implements: vec![],
            }),
        })
    }

    /// Transform a function declaration to a RaskStatelessComponent class
    fn transform_to_stateless_class(&mut self, name: Ident, func: Function) -> Decl {
        // Ensure we have the RaskStatelessComponent import
        if self.import_rask_stateless_component.is_none() {
            self.import_rask_stateless_component = Some(private_ident!("RaskStatelessComponent"));
        }

        let super_class_ident = self.import_rask_stateless_component.as_ref().unwrap().clone();

        // Create the class property: renderFn = function name() { ... }
        let render_prop = ClassMember::ClassProp(ClassProp {
            span: Default::default(),
            key: PropName::Ident(quote_ident!("renderFn").into()),
            value: Some(Box::new(Expr::Fn(FnExpr {
                ident: Some(name.clone()),
                function: Box::new(func),
            }))),
            type_ann: None,
            is_static: false,
            decorators: vec![],
            accessibility: None,
            is_abstract: false,
            is_optional: false,
            is_override: false,
            readonly: false,
            declare: false,
            definite: false,
        });

        Decl::Class(ClassDecl {
            ident: name,
            declare: false,
            class: Box::new(Class {
                span: Default::default(),
                ctxt: Default::default(),
                decorators: vec![],
                body: vec![render_prop],
                super_class: Some(Box::new(Expr::Ident(super_class_ident))),
                is_abstract: false,
                type_params: None,
                super_type_params: None,
                implements: vec![],
            }),
        })
    }

    /// Create a class expression for variable assignments
    fn create_component_class_expr(&mut self, name: Ident, func: Function, is_stateful: bool) -> ClassExpr {
        let super_class_ident = if is_stateful {
            if self.import_rask_stateful_component.is_none() {
                self.import_rask_stateful_component = Some(private_ident!("RaskStatefulComponent"));
            }
            self.import_rask_stateful_component.as_ref().unwrap().clone()
        } else {
            if self.import_rask_stateless_component.is_none() {
                self.import_rask_stateless_component = Some(private_ident!("RaskStatelessComponent"));
            }
            self.import_rask_stateless_component.as_ref().unwrap().clone()
        };

        let prop_key = if is_stateful { "setup" } else { "renderFn" };

        ClassExpr {
            ident: Some(name.clone()),
            class: Box::new(Class {
                span: Default::default(),
                ctxt: Default::default(),
                decorators: vec![],
                body: vec![ClassMember::ClassProp(ClassProp {
                    span: Default::default(),
                    key: PropName::Ident(quote_ident!(prop_key).into()),
                    value: Some(Box::new(Expr::Fn(FnExpr {
                        ident: Some(name),
                        function: Box::new(func),
                    }))),
                    type_ann: None,
                    is_static: false,
                    decorators: vec![],
                    accessibility: None,
                    is_abstract: false,
                    is_optional: false,
                    is_override: false,
                    readonly: false,
                    declare: false,
                    definite: false,
                })],
                super_class: Some(Box::new(Expr::Ident(super_class_ident))),
                is_abstract: false,
                type_params: None,
                super_type_params: None,
                implements: vec![],
            }),
        }
    }

    /// Convert arrow function to regular function for analysis
    fn arrow_to_function(&self, arrow: &ArrowExpr) -> Function {
        // Convert arrow params (Vec<Pat>) to function params (Vec<Param>)
        let params = arrow
            .params
            .iter()
            .map(|pat| Param {
                span: Default::default(),
                decorators: vec![],
                pat: pat.clone(),
            })
            .collect();

        Function {
            params,
            decorators: vec![],
            span: arrow.span,
            ctxt: Default::default(),
            body: Some(match &*arrow.body {
                BlockStmtOrExpr::BlockStmt(block) => block.clone(),
                BlockStmtOrExpr::Expr(expr) => BlockStmt {
                    span: Default::default(),
                    ctxt: Default::default(),
                    stmts: vec![Stmt::Return(ReturnStmt {
                        span: Default::default(),
                        arg: Some(expr.clone()),
                    })],
                },
            }),
            is_generator: arrow.is_generator,
            is_async: arrow.is_async,
            type_params: arrow.type_params.clone(),
            return_type: arrow.return_type.clone(),
        }
    }

    /// Rewrite imports from "inferno" to the configured import source + "/compiler"
    fn rewrite_inferno_imports(&mut self, module: &mut Module) {
        let import_source = self
            .config
            .import_source
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("rask-ui");

        let compiler_import = format!("{}/compiler", import_source);

        for item in &mut module.body {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(import)) = item {
                if &*import.src.value == "inferno" {
                    // Rewrite the import source from "inferno" to the configured source + "/compiler"
                    import.src = Box::new(Str {
                        span: Default::default(),
                        value: Wtf8Atom::from(compiler_import.as_str()),
                        raw: None,
                    });
                }
            }
        }
    }

    /// Inject the RaskStatefulComponent and/or RaskStatelessComponent imports at the top of the module
    fn inject_runtime(&mut self, module: &mut Module) {
        let import_source = self
            .config
            .import_source
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("rask-ui");

        let mut specifiers = vec![];

        // Add RaskStatefulComponent if needed
        if let Some(stateful_ident) = &self.import_rask_stateful_component {
            // Check if import already exists
            let mut exists = false;
            for item in &module.body {
                if let ModuleItem::ModuleDecl(ModuleDecl::Import(import)) = item {
                    if &*import.src.value == import_source {
                        for spec in &import.specifiers {
                            if let ImportSpecifier::Named(named) = spec {
                                if let Some(ModuleExportName::Ident(imported)) = &named.imported {
                                    if &*imported.sym == "RaskStatefulComponent" {
                                        exists = true;
                                        break;
                                    }
                                } else if &*named.local.sym == "RaskStatefulComponent" {
                                    exists = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            if !exists {
                specifiers.push(ImportSpecifier::Named(ImportNamedSpecifier {
                    span: Default::default(),
                    local: stateful_ident.clone(),
                    imported: Some(ModuleExportName::Ident(quote_ident!("RaskStatefulComponent").into())),
                    is_type_only: false,
                }));
            }
        }

        // Add RaskStatelessComponent if needed
        if let Some(stateless_ident) = &self.import_rask_stateless_component {
            // Check if import already exists
            let mut exists = false;
            for item in &module.body {
                if let ModuleItem::ModuleDecl(ModuleDecl::Import(import)) = item {
                    if &*import.src.value == import_source {
                        for spec in &import.specifiers {
                            if let ImportSpecifier::Named(named) = spec {
                                if let Some(ModuleExportName::Ident(imported)) = &named.imported {
                                    if &*imported.sym == "RaskStatelessComponent" {
                                        exists = true;
                                        break;
                                    }
                                } else if &*named.local.sym == "RaskStatelessComponent" {
                                    exists = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            if !exists {
                specifiers.push(ImportSpecifier::Named(ImportNamedSpecifier {
                    span: Default::default(),
                    local: stateless_ident.clone(),
                    imported: Some(ModuleExportName::Ident(quote_ident!("RaskStatelessComponent").into())),
                    is_type_only: false,
                }));
            }
        }

        // Only create import if we have specifiers to add
        if !specifiers.is_empty() {
            let import = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                span: Default::default(),
                specifiers,
                src: Box::new(Str {
                    span: Default::default(),
                    value: Wtf8Atom::from(import_source),
                    raw: None,
                }),
                type_only: false,
                with: None,
                phase: Default::default(),
            }));

            module.body.insert(0, import);
        }
    }
}

impl VisitMut for RaskComponentTransform {
    noop_visit_mut_type!();

    fn visit_mut_module(&mut self, module: &mut Module) {
        // First visit all items to transform them
        module.visit_mut_children_with(self);

        // Rewrite any "inferno" imports to use the configured import source
        self.rewrite_inferno_imports(module);

        // Then inject imports if needed
        self.inject_runtime(module);
    }

    fn visit_mut_function(&mut self, func: &mut Function) {
        // Visit the function body to find nested components
        if let Some(body) = &mut func.body {
            for stmt in &mut body.stmts {
                self.visit_mut_stmt(stmt);
            }
        }
        func.visit_mut_children_with(self);
    }

    fn visit_mut_stmt(&mut self, stmt: &mut Stmt) {
        match stmt {
            // Handle: function MyComponent() { return () => <div /> }
            Stmt::Decl(Decl::Fn(fn_decl)) => {
                if self.is_rask_component(&fn_decl.function) {
                    let name = fn_decl.ident.clone();
                    let func = (*fn_decl.function).clone();
                    let class_decl = self.transform_to_stateful_class(name, func);
                    *stmt = Stmt::Decl(class_decl);
                    return;
                } else if self.is_stateless_component(&fn_decl.function) {
                    let name = fn_decl.ident.clone();
                    let func = (*fn_decl.function).clone();
                    let class_decl = self.transform_to_stateless_class(name, func);
                    *stmt = Stmt::Decl(class_decl);
                    return;
                }
            }

            // Handle: const MyComponent = () => { return () => <div /> }
            Stmt::Decl(Decl::Var(var_decl)) => {
                for decl in &mut var_decl.decls {
                    if let Some(init) = &mut decl.init {
                        // Check if it's an arrow function
                        if let Expr::Arrow(arrow) = &**init {
                            let func = self.arrow_to_function(arrow);
                            let is_stateful = self.is_rask_component(&func);
                            let is_stateless = self.is_stateless_component(&func);

                            if is_stateful || is_stateless {
                                // Get the variable name
                                if let Pat::Ident(ident_pat) = &decl.name {
                                    let name = ident_pat.id.clone();
                                    let class_expr = self.create_component_class_expr(name, func, is_stateful);
                                    *init = Box::new(Expr::Class(class_expr));
                                }
                            }
                        }
                    }
                }
            }

            _ => {}
        }

        stmt.visit_mut_children_with(self);
    }

    fn visit_mut_module_item(&mut self, item: &mut ModuleItem) {
        match item {
            ModuleItem::Stmt(Stmt::Decl(Decl::Fn(fn_decl))) => {
                // Check for stateful component first (returns arrow function)
                if self.is_rask_component(&fn_decl.function) {
                    let name = fn_decl.ident.clone();
                    let func = (*fn_decl.function).clone();
                    let class_decl = self.transform_to_stateful_class(name, func);
                    *item = ModuleItem::Stmt(Stmt::Decl(class_decl));
                    return;
                }
                // Then check for stateless component (directly returns VNode)
                else if self.is_stateless_component(&fn_decl.function) {
                    let name = fn_decl.ident.clone();
                    let func = (*fn_decl.function).clone();
                    let class_decl = self.transform_to_stateless_class(name, func);
                    *item = ModuleItem::Stmt(Stmt::Decl(class_decl));
                    return;
                }
            }
            ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(export)) => {
                match &mut export.decl {
                    // Handle: export default function MyComponent() { return () => <div /> }
                    DefaultDecl::Fn(fn_expr) => {
                        let is_stateful = self.is_rask_component(&fn_expr.function);
                        let is_stateless = self.is_stateless_component(&fn_expr.function);

                        if is_stateful || is_stateless {
                            // Get or create a name for the component
                            let name = fn_expr
                                .ident
                                .clone()
                                .unwrap_or_else(|| quote_ident!("DefaultComponent").into());

                            let func = (*fn_expr.function).clone();
                            let class_expr = self.create_component_class_expr(name, func, is_stateful);
                            export.decl = DefaultDecl::Class(ClassExpr {
                                ident: class_expr.ident,
                                class: class_expr.class,
                            });
                            return;
                        }
                    }
                    // No need to handle DefaultDecl::Class as it's already a class
                    _ => {}
                }
            }
            // Handle: const MyComponent = () => ...; export default MyComponent;
            ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultExpr(export)) => {
                // Check if it's an arrow function
                if let Expr::Arrow(arrow) = &*export.expr {
                    let func = self.arrow_to_function(arrow);
                    let is_stateful = self.is_rask_component(&func);
                    let is_stateless = self.is_stateless_component(&func);

                    if is_stateful || is_stateless {
                        let name = quote_ident!("DefaultComponent").into();
                        let class_expr = self.create_component_class_expr(name, func, is_stateful);
                        export.expr = Box::new(Expr::Class(class_expr));
                        return;
                    }
                }
            }
            ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(export)) => {
                // Handle: export function MyComponent() { return () => <div /> }
                if let Decl::Fn(fn_decl) = &mut export.decl {
                    // Check for stateful component first
                    if self.is_rask_component(&fn_decl.function) {
                        let name = fn_decl.ident.clone();
                        let func = (*fn_decl.function).clone();
                        let class_decl = self.transform_to_stateful_class(name, func);
                        export.decl = class_decl;
                        return;
                    }
                    // Then check for stateless component
                    else if self.is_stateless_component(&fn_decl.function) {
                        let name = fn_decl.ident.clone();
                        let func = (*fn_decl.function).clone();
                        let class_decl = self.transform_to_stateless_class(name, func);
                        export.decl = class_decl;
                        return;
                    }
                }
            }
            _ => {}
        }

        item.visit_mut_children_with(self);
    }
}

#[plugin_transform]
pub fn process_transform(mut program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let config = serde_json::from_str::<Config>(
        &metadata
            .get_transform_plugin_config()
            .unwrap_or_else(|| "{}".to_string()),
    )
    .unwrap_or_default();

    program.visit_mut_with(&mut RaskComponentTransform::new(config));
    program
}
