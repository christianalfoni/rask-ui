import { useDerived } from "rask-ui";
import { TodoItem } from "./TodoItem";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export function TodoList() {
  const derived = useDerived({
    filteredTodos: () => {
      if (!todos.value) {
        return [];
      }

      switch (state.filter) {
        case "active":
          return todos.value.filter((t) => !t.completed);
        case "completed":
          return todos.value.filter((t) => t.completed);
        default:
          return todos.value;
      }
    },
  });
  return () => (
    <div>
      {props.todos.length === 0 ? (
        <div class="text-center py-12 text-gray-400">
          <p class="text-lg">No todos yet!</p>
          <p class="text-sm mt-2">Add one above to get started.</p>
        </div>
      ) : (
        <ul class="space-y-2">
          {props.todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onDelete={props.onDelete}
              onEdit={props.onEdit}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
