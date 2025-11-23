interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const serverTodos: Todo[] = [
  {
    id: "1",
    text: "Welcome to RASK Todo App! 🎉",
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: "2",
    text: "Double-click to edit a todo",
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: "3",
    text: "Hover over todos to see actions",
    completed: false,
    createdAt: Date.now(),
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function serverAddTodo(todo: Todo) {
  serverTodos.unshift(todo);
  await sleep(1000);

  return structuredClone(todo);
}

export async function serverGetTodos() {
  await sleep(1000);
  return structuredClone(serverTodos);
}

export async function serverToggleTodo(id: string) {
  const serverTodo = serverTodos.find((serverTodo) => serverTodo.id === id);

  if (!serverTodo) {
    throw new Error("No todo");
  }

  serverTodo.completed = !serverTodo.completed;

  return structuredClone(serverTodo);
}

export async function serverEditTodo(id: string, text: string) {
  const serverTodo = serverTodos.find((serverTodo) => serverTodo.id === id);

  if (!serverTodo) {
    throw new Error("No todo");
  }

  serverTodo.text = text;

  return structuredClone(serverTodo);
}

export async function serverDeleteTodo(id: string) {
  const serverTodoIndex = serverTodos.findIndex(
    (serverTodo) => serverTodo.id === id
  );

  if (serverTodoIndex === -1) {
    throw new Error("No todo");
  }

  serverTodos.splice(serverTodoIndex, 1);
}
