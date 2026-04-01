"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Task, Subtask } from "./components/types";
import TaskCard from "./components/task-card";
import AddTaskForm from "./components/add-task-form";
import Toast from "./components/toast";
import NotificationPanel from "./components/notification-panel";

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
  const tasksRef = useRef<Task[]>([]);
  // Keep ref in sync so async callbacks always see latest state
  tasksRef.current = tasks;
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const data = await api<Task[]>("GET", "/tasks");
      const normalized = data.map((t) => ({
        ...t,
        subtasks: (t.subtasks || []).map((s) => ({
          ...s,
          llm_loading: false,
        })),
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

  // Helper: save subtasks to backend
  async function saveSubtasks(taskId: string, subtasks: Subtask[]) {
    try {
      await api("PATCH", `/tasks/${taskId}`, {
        subtasks: subtasks.map((s) => ({
          id: s.id,
          title: s.title,
          completed: s.completed,
          llm_response: s.llm_response || null,
        })),
      });
    } catch {
      // silent — local state is already updated
    }
  }

  // ── Task CRUD ──

  async function handleAdd(title: string, subtaskTitles: string[]) {
    const subtasks: Subtask[] = subtaskTitles.map((st) => ({
      id: crypto.randomUUID(),
      title: st,
      completed: false,
    }));

    try {
      const created = await api<Task>("POST", "/tasks", {
        title,
        description: "",
        subtasks,
      });
      const normalized: Task = {
        ...created,
        subtasks: (created.subtasks || subtasks).map((s) => ({
          ...s,
          llm_loading: false,
        })),
      };
      setTasks((prev) => {
        const updated = [normalized, ...prev];
        // Update ref immediately so auto-solve can find the task
        tasksRef.current = updated;
        return updated;
      });
      showToast("Task created — solving subtasks...");

      // Auto-solve all subtasks in parallel
      for (const st of normalized.subtasks) {
        handleLLMCall(normalized.id, st.id, st.title);
      }
    } catch {
      const localTask: Task = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        subtasks,
      };
      setTasks((prev) => [localTask, ...prev]);
      showToast("Task created (local)");
    }
  }

  async function handleToggle(id: string, completed: boolean) {
    try {
      const updated = await api<Task>("PATCH", `/tasks/${id}`, { completed });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updated, subtasks: updated.subtasks || t.subtasks } : t))
      );
      showToast(completed ? "Marked done" : "Marked pending");
    } catch {
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
        prev.map((t) => (t.id === id ? { ...t, ...updated, subtasks: updated.subtasks || t.subtasks } : t))
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title } : t))
      );
    }
    showToast("Task updated");
  }

  // ── Subtask Operations ──

  function updateSubtasksAndSave(taskId: string, updater: (subtasks: Subtask[]) => Subtask[]) {
    let updatedSubtasks: Subtask[] = [];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        updatedSubtasks = updater(t.subtasks);
        return { ...t, subtasks: updatedSubtasks };
      })
    );
    // Save outside the state updater so the API call has the final data
    saveSubtasks(taskId, updatedSubtasks);
  }

  function handleSubtaskToggle(taskId: string, subtaskId: string, completed: boolean) {
    updateSubtasksAndSave(taskId, (subs) =>
      subs.map((s) => (s.id === subtaskId ? { ...s, completed } : s))
    );
  }

  function handleSubtaskDelete(taskId: string, subtaskId: string) {
    updateSubtasksAndSave(taskId, (subs) => subs.filter((s) => s.id !== subtaskId));
    showToast("Subtask removed");
  }

  function handleSubtaskAdd(taskId: string, title: string) {
    const newId = crypto.randomUUID();
    updateSubtasksAndSave(taskId, (subs) => [
      ...subs,
      { id: newId, title, completed: false },
    ]);
    // Auto-solve the new subtask
    handleLLMCall(taskId, newId, title);
  }

  // ── LLM Call (with caching) ──

  async function handleLLMCall(taskId: string, subtaskId: string, subtaskTitle: string) {
    // Check cache using ref for latest state
    const currentTask = tasksRef.current.find((t) => t.id === taskId);
    const currentSubtask = currentTask?.subtasks.find((s) => s.id === subtaskId);
    if (currentSubtask?.llm_response) {
      showToast("Showing cached AI solution");
      return;
    }

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
      // Use ref for latest task title
      const parentTask = tasksRef.current.find((t) => t.id === taskId);
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

      // Update local state
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

      // Persist only this subtask's response (no race condition)
      try {
        await api("PATCH", `/tasks/${taskId}/subtasks/${subtaskId}`, {
          llm_response: result.response,
        });
      } catch {
        // silent
      }
      showToast("AI solution ready");
    } catch {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, llm_loading: false } : s
            ),
          };
        })
      );
      showToast("LLM call failed");
    }
  }

  function handleDismissLLMResponse(_taskId: string, _subtaskId: string) {
    // UI-only dismiss — TaskCard handles hiding via showLLMFor state.
    // The llm_response stays in state + backend so it can be shown again
    // without re-calling the LLM.
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
            <NotificationPanel />
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
