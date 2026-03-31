"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, Subtask } from "./components/types";
import TaskCard from "./components/task-card";
import AddTaskForm from "./components/add-task-form";
import Toast from "./components/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const LLM_URL = process.env.NEXT_PUBLIC_LLM_URL || "http://localhost:8001";

type Filter = "all" | "pending" | "done";

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const data = await api<Task[]>("GET", "/tasks");
      // Ensure each task has a subtasks array
      const normalized = data.map((t) => ({
        ...t,
        subtasks: t.subtasks || [],
      }));
      setTasks(normalized);
      setApiOnline(true);
      setError(null);
    } catch (e) {
      setApiOnline(false);
      setError("Cannot reach API: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function showToast(msg: string) {
    setToast(msg);
  }

  // ── Task CRUD ──

  async function handleAdd(title: string, subtaskTitles: string[]) {
    try {
      const subtasks: Subtask[] = subtaskTitles.map((st) => ({
        id: crypto.randomUUID(),
        title: st,
        completed: false,
      }));

      const taskPayload = { title, description: "", subtasks };
      const created = await api<Task>("POST", "/tasks", taskPayload);

      // Ensure subtasks come back (backend might not support them yet)
      const normalized: Task = {
        ...created,
        subtasks: created.subtasks || subtasks,
      };
      setTasks((prev) => [normalized, ...prev]);
      showToast("Task created");
    } catch (e) {
      // If backend doesn't support subtasks yet, store locally
      const localTask: Task = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        subtasks: subtaskTitles.map((st) => ({
          id: crypto.randomUUID(),
          title: st,
          completed: false,
        })),
      };
      setTasks((prev) => [localTask, ...prev]);
      showToast("Task created (local)");
    }
  }

  async function handleToggle(id: string, completed: boolean) {
    try {
      const updated = await api<Task>("PATCH", `/tasks/${id}`, { completed });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updated, subtasks: t.subtasks } : t))
      );
      showToast(completed ? "Marked done" : "Marked pending");
    } catch {
      // Fallback: update locally
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed } : t))
      );
      showToast(completed ? "Marked done" : "Marked pending");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api("DELETE", `/tasks/${id}`);
    } catch {
      // Continue with local delete even if API fails
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast("Task deleted");
  }

  async function handleUpdate(id: string, title: string) {
    try {
      const updated = await api<Task>("PATCH", `/tasks/${id}`, { title });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updated, subtasks: t.subtasks } : t))
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title } : t))
      );
    }
    showToast("Task updated");
  }

  // ── Subtask Operations ──

  function handleSubtaskToggle(taskId: string, subtaskId: string, completed: boolean) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed } : s
          ),
        };
      })
    );
  }

  function handleSubtaskDelete(taskId: string, subtaskId: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
        };
      })
    );
    showToast("Subtask removed");
  }

  function handleSubtaskAdd(taskId: string, title: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: [
            ...t.subtasks,
            { id: crypto.randomUUID(), title, completed: false },
          ],
        };
      })
    );
  }

  // ── LLM Call ──

  async function handleLLMCall(taskId: string, subtaskId: string, subtaskTitle: string) {
    // Set loading state
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, llm_loading: true } : s
          ),
        };
      })
    );

    try {
      // Find the parent task title for context
      const parentTask = tasks.find((t) => t.id === taskId);
      const prompt = parentTask
        ? `Task: "${parentTask.title}" — Subtask: "${subtaskTitle}"`
        : subtaskTitle;

      const res = await fetch(`${LLM_URL}/llm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`LLM error ${res.status}`);
      const result = await res.json() as { response: string };

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((s) =>
              s.id === subtaskId
                ? { ...s, llm_response: result.response, llm_loading: false }
                : s
            ),
          };
        })
      );
      showToast("AI solution ready");
    } catch {
      // Fallback: mock response for demo when backend doesn't have /llm endpoint
      const mockResponse = `# Solution for: ${subtaskTitle}\n\nThis is where the LLM response will appear once the backend /llm endpoint is implemented.\n\n## Steps:\n1. Connect the backend to an LLM provider (OpenAI, Gemini, etc.)\n2. Create a POST /llm endpoint that accepts { prompt: string }\n3. Return { response: string } with the LLM's answer\n\n## Example Backend Code:\n\`\`\`python\n@app.post("/llm")\nasync def llm_call(data: dict):\n    # Call your LLM here\n    response = await llm.generate(data["prompt"])\n    return {"response": response}\n\`\`\`\n\nThe response will be displayed in this card automatically.`;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((s) =>
              s.id === subtaskId
                ? { ...s, llm_response: mockResponse, llm_loading: false }
                : s
            ),
          };
        })
      );
      showToast("AI solution ready (demo)");
    }
  }

  function handleDismissLLMResponse(taskId: string, subtaskId: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, llm_response: undefined } : s
          ),
        };
      })
    );
  }

  // ── Filtering ──

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "done", label: "Done" },
  ];

  const displayUrl = API_URL.replace(/https?:\/\//, "");
  const totalSubtasks = tasks.reduce((acc, t) => acc + t.subtasks.length, 0);

  return (
    <div className="pb-20">
      {/* Sticky Navbar */}
      <nav
        className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b-[3px] border-ink"
      >
        <div className="max-w-[1120px] mx-auto px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[0.9] tracking-wide text-ink">
              TaskBoard
            </h1>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-ink-light font-mono hidden sm:block">
              Agentic Todo Manager
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="text-[0.6rem] tracking-[0.1em] uppercase bg-ink text-bg
                px-2.5 py-1 whitespace-nowrap font-mono"
              style={{ borderRadius: "var(--radius)" }}
            >
              API{" "}
              <span style={{ color: apiOnline ? "#90EE90" : "#ff6b6b" }}>&#9679;</span>{" "}
              <span className="text-bg/70">{displayUrl}</span>
            </div>
            <div
              className="text-[0.55rem] tracking-[0.1em] uppercase bg-accent text-white
                px-2.5 py-1 whitespace-nowrap font-mono flex items-center gap-1.5"
              style={{ borderRadius: "var(--radius)" }}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M6.5 6.5a1.5 1.5 0 112.5 1.5c0 .75-.75 1-1 1.5" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
              </svg>
              LLM-Powered
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1120px] mx-auto px-5 pt-8">
        {/* Add Form */}
        <AddTaskForm onAdd={handleAdd} />

        {/* Error Banner */}
        {error && (
          <div
            className="bg-accent-bg border-2 border-accent text-accent
              text-xs tracking-wider px-4 py-2.5 mb-5 font-mono"
            style={{ borderRadius: "var(--radius)" }}
          >
            &#9888; {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2.5">
          <div className="flex items-baseline gap-3">
            <div className="font-display text-[1.4rem] tracking-wider text-ink">
              {tasks.length}{" "}
              <em className="font-serif italic text-base text-ink-light tracking-normal">
                tasks
              </em>
            </div>
            {totalSubtasks > 0 && (
              <div className="text-[0.65rem] tracking-wider text-ink-light font-mono uppercase">
                {totalSubtasks} subtasks
              </div>
            )}
          </div>
          <div className="flex gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`font-mono text-[0.65rem] tracking-[0.1em] uppercase
                  px-3 py-1 rounded-full border-[1.5px] cursor-pointer
                  transition-all duration-150
                  ${filter === f.key
                    ? "bg-ink text-bg border-ink"
                    : "bg-transparent text-ink-light border-rule hover:bg-ink hover:text-bg hover:border-ink"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-10">
              <div
                className="w-4 h-4 border-2 border-rule border-t-ink rounded-full
                  animate-spin-custom mx-auto"
              />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-16 border-2 border-dashed border-rule"
              style={{ borderRadius: "var(--radius)" }}
            >
              <div className="font-display text-[5rem] leading-none text-rule">
                &#8709;
              </div>
              <p className="text-xs text-ink-light tracking-[0.1em] uppercase mt-2 font-mono">
                {filter === "all"
                  ? "No tasks yet \u2014 add one above"
                  : `No ${filter} tasks`}
              </p>
            </div>
          ) : (
            filtered.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onSubtaskToggle={handleSubtaskToggle}
                onSubtaskDelete={handleSubtaskDelete}
                onSubtaskAdd={handleSubtaskAdd}
                onLLMCall={handleLLMCall}
                onDismissLLMResponse={handleDismissLLMResponse}
                index={i}
              />
            ))
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
