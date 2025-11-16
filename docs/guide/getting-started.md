# Getting Started

Get up and running with RASK in minutes.

## Quick Start

The fastest way to create a new RASK project is using `create-rask-ui`:

::: code-group

```bash [npm]
npm create rask-ui my-app
cd my-app
npm run dev
```

```bash [pnpm]
pnpm create rask-ui my-app
cd my-app
pnpm dev
```

```bash [yarn]
yarn create rask-ui my-app
cd my-app
yarn dev
```

```bash [bun]
bun create rask-ui my-app
cd my-app
bun run dev
```

:::

This scaffolds a complete Vite + RASK project with:

- ✅ Vite configured with the RASK plugin
- ✅ TypeScript or JavaScript (your choice)
- ✅ Sample counter component

Your app will be running at `http://localhost:5173`

## Manual Setup

If you prefer to add RASK to an existing project, follow these steps.

### Installation

Install RASK using your preferred package manager:

::: code-group

```bash [npm]
npm install rask-ui
```

```bash [pnpm]
pnpm add rask-ui
```

```bash [yarn]
yarn add rask-ui
```

:::

### Vite Configuration

RASK uses a custom Vite plugin powered by SWC for optimal JSX transformation. This plugin transforms JSX to Inferno's highly optimized `createVNode` calls and automatically converts function components to RASK's reactive component pattern.

### 1. Configure Vite

Create or update your `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import raskPlugin from "rask-ui/plugin";

export default defineConfig({
  plugins: [raskPlugin()],
});
```

### 2. Configure TypeScript

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "rask-ui"
  }
}
```

#### Key Settings Explained

- **`"jsx": "react-jsx"`** - Tells TypeScript to use the new JSX transform for type checking
- **`"jsxImportSource": "rask-ui"`** - Points to RASK's JSX runtime for type definitions

#### How It Works

- **TypeScript**: Type-checks JSX using RASK's type definitions (imported from Inferno)
- **SWC Plugin**: Transforms JSX to Inferno's `createVNode` calls at build time
- **Result**: Full type safety with zero runtime overhead

## Your First Component

Create a simple counter component:

```tsx
import { createState, render } from "rask-ui";

function Counter() {
  const state = createState({ count: 0 });

  return () => (
    <div>
      <h1>Count: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>
      <button onClick={() => state.count--}>Decrement</button>
    </div>
  );
}

render(<Counter />, document.getElementById("app")!);
```

### What's Happening Here?

1. **`createState({ count: 0 })`** - Creates a reactive state object
2. **`return () => (...)`** - Returns a render function that runs when dependencies change
3. **`state.count++`** - Direct mutations trigger re-renders automatically
4. **`render(<Counter />, ...)`** - Mounts the component to the DOM

## Component Structure

Stateful components in RASK have two distinct phases:

```tsx
function MyComponent(props) {
  // SETUP PHASE - Runs once when component is created
  const state = createState({ value: props.initial });

  createMountEffect(() => {
    console.log("Component mounted!");
  });

  // RENDER PHASE - Returns a function that runs on every update
  return () => (
    <div>
      <p>{state.value}</p>
      <button onClick={() => state.value++}>Update</button>
    </div>
  );
}
```

- **Setup Phase**: Runs once during component initialization

  - Create state
  - Set up effects
  - Register lifecycle hooks
  - Define event handlers

- **Render Phase**: The returned function runs whenever reactive dependencies change
  - Access reactive state
  - Generate JSX
  - All reactive dependencies are tracked automatically

But you can also express plain stateless components that only takes props:

```tsx
function Header(props) {
  return <h1>{props.children}</h1>;
}
```

Notice that we are not returning a render function!

## Next Steps

Now that you have RASK set up, learn about the core concepts:

- [Core Concepts](/guide/core-concepts) - Understanding reactive state and effects
- [API Reference](/api/) - Complete API documentation
