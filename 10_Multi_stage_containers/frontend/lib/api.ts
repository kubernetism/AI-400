const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface BackendTodo {
  id: number;
  task: string;
}

export async function fetchTodos(): Promise<BackendTodo[]> {
  const res = await fetch(`${API_BASE}/todos`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.todos;
}

export async function createTodo(task: string): Promise<BackendTodo> {
  const res = await fetch(`${API_BASE}/todos?task=${encodeURIComponent(task)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.todo;
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/todos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export const API_URL = API_BASE;
