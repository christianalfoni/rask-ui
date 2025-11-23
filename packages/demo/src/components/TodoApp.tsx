import {
  createContext,
  useAction,
  useAsync,
  useDerived,
  useState,
  useView,
} from "rask-ui";
import { TodoInput } from "./TodoInput";
import { TodoFilters, type FilterType } from "./TodoFilters";
import { TodoList } from "./TodoList";
import { serverAddTodo, serverGetTodos } from "../server";

function Header() {
  return (
    <header class="mb-8">
      <h1 class="text-4xl font-bold text-center text-gray-800 mb-2">
        📝 RASK Todo
      </h1>
      <p class="text-center text-gray-500 text-sm">
        A reactive todo app built with RASK UI
      </p>
    </header>
  );
}

const TodosContext = createContext();

export function TodoApp() {
  const [todos, refreshTodos] = useAsync(serverGetTodos);
  const state = useState({
    filter: "all" as FilterType,
  });
  const derived = useDerived({
    todos: () => todos.value || [],
    stats: () => {
      const total = derived.todos.length;
      const completed = derived.todos.filter((t) => t.completed).length;
      const active = total - completed;

      return { total, completed, active };
    },
  });
  const [addingTodo, addTodo] = useAction(async (text: string) => {
    await serverAddTodo({
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    });
    await refreshTodos();
  });
  const changeFilter = (filter: FilterType) => {
    state.filter = filter;
  };

  return () => (
    <div class="w-full max-w-3xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <Header />

        <TodoInput onAdd={addTodo} />

        <TodoFilters
          currentFilter={state.filter}
          onFilterChange={changeFilter}
        />

        <TodoList filter={state.filter} />

        {todos.stats.total > 0 && (
          <footer class="mt-6 pt-6 border-t border-gray-200">
            <div class="flex justify-between items-center text-sm text-gray-500">
              <span>
                {todos.stats.active === 0
                  ? "All tasks completed! 🎉"
                  : `${todos.stats.active} ${
                      todos.stats.active === 1 ? "task" : "tasks"
                    } remaining`}
              </span>
              {todos.stats.completed > 0 && (
                <button
                  onClick={() => {
                    // state.todos = state.todos.filter((t) => !t.completed);
                  }}
                  class="text-red-500 hover:text-red-700 transition-colors"
                >
                  Clear completed
                </button>
              )}
            </div>
          </footer>
        )}
      </div>

      <footer class="mt-8 text-center text-sm text-gray-500">
        <p>
          Click checkbox to complete • Double-click to edit • Hover for actions
        </p>
      </footer>
    </div>
  );
}
