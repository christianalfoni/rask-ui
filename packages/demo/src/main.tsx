import { createRoot } from "react-dom/client";
import { TodoApp } from "./components/TodoApp";
import "./style.css";

const root = createRoot(document.getElementById("app")!);
root.render(<TodoApp />);
