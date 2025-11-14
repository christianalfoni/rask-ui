import { createState } from "rask-ui";

export function App() {
  const state = createState({ count: 0 });

  return () => (
    <div className="app-container">
      <div className="card">
        <img src="/logo.png" alt="RASK Logo" className="logo" />

        <h1 className="title">Welcome to RASK</h1>

        <p className="description">
          A lightweight UI library that combines the simplicity of observable
          state management with the simplicity of reconciling UI.
        </p>

        <div className="counter-container">
          <button
            onClick={() => state.count--}
            className="counter-button decrement"
          >
            −
          </button>

          <div className="counter-display">{state.count}</div>

          <button
            onClick={() => state.count++}
            className="counter-button increment"
          >
            +
          </button>
        </div>

        <p className="footer-text">
          Edit <code>src/App.tsx</code> and save to see changes instantly with
          HMR.
        </p>
      </div>
    </div>
  );
}
