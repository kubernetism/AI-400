"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Task, Subtask, AgentInfo } from "./components/types";
import TaskCard from "./components/task-card";
import AddTaskForm from "./components/add-task-form";
import Toast from "./components/toast";
import NotificationPanel from "./components/notification-panel";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://backend:8000";
const LLM_URL = process.env.NEXT_PUBLIC_LLM_URL || "http://llm-call:8001";

type Filter = "all" | "pending" | "done";

async function api<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
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
  tasksRef.current = tasks;
  const [agents, setAgents] = useState<AgentInfo[]>([]);
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
      setError(
        "Cannot reach API: " +
          (e instanceof Error ? e.message : "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch agents from LLM service
  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch(`${LLM_URL}/agents`);
      if (res.ok) {
        const data: AgentInfo[] = await res.json();
        setAgents(data);
      }
    } catch {
      // LLM service might be offline — agents dropdown will be empty
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadAgents();
  }, [loadTasks, loadAgents]);

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
          agent_id: s.agent_id || null,
        })),
      });
    } catch {
      // silent
    }
  }

  // ── Task CRUD ──

  async function handleAdd(
    title: string,
    subtaskDrafts: { title: string; agent_id: string }[],
  ) {
    const subtasks: Subtask[] = subtaskDrafts.map((st) => ({
      id: crypto.randomUUID(),
      title: st.title,
      completed: false,
      agent_id: st.agent_id || undefined,
    }));

    try {
      const created = await api<Task>("POST", "/tasks", {
        title,
        description: "",
        subtasks: subtasks.map((s) => ({
          id: s.id,
          title: s.title,
          completed: false,
          agent_id: s.agent_id,
        })),
      });
      const normalized: Task = {
        ...created,
        subtasks: (created.subtasks || subtasks).map((s, i) => ({
          ...s,
          agent_id: s.agent_id || subtasks[i]?.agent_id,
          llm_loading: false,
        })),
      };
      setTasks((prev) => {
        const updated = [normalized, ...prev];
        tasksRef.current = updated;
        return updated;
      });
      showToast("Task created — solving subtasks...");

      // Auto-solve all subtasks in parallel with their assigned agents
      for (const st of normalized.subtasks) {
        handleLLMCall(normalized.id, st.id, st.title, st.agent_id);
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
        prev.map((t) =>
          t.id === id
            ? { ...t, ...updated, subtasks: updated.subtasks || t.subtasks }
            : t,
        ),
      );
      showToast(completed ? "Marked done" : "Marked pending");
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed } : t)),
      );
      showToast(completed ? "Marked done" : "Marked pending");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api("DELETE", `/tasks/${id}`);
    } catch {
      // Continue with local delete
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast("Task deleted");
  }

  async function handleUpdate(id: string, title: string) {
    try {
      const updated = await api<Task>("PATCH", `/tasks/${id}`, { title });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...updated, subtasks: updated.subtasks || t.subtasks }
            : t,
        ),
      );
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    }
    showToast("Task updated");
  }

  // ── Subtask Operations ──

  function updateSubtasksAndSave(
    taskId: string,
    updater: (subtasks: Subtask[]) => Subtask[],
  ) {
    let updatedSubtasks: Subtask[] = [];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        updatedSubtasks = updater(t.subtasks);
        return { ...t, subtasks: updatedSubtasks };
      }),
    );
    saveSubtasks(taskId, updatedSubtasks);
  }

  function handleSubtaskToggle(
    taskId: string,
    subtaskId: string,
    completed: boolean,
  ) {
    updateSubtasksAndSave(taskId, (subs) =>
      subs.map((s) => (s.id === subtaskId ? { ...s, completed } : s)),
    );
  }

  function handleSubtaskDelete(taskId: string, subtaskId: string) {
    updateSubtasksAndSave(taskId, (subs) =>
      subs.filter((s) => s.id !== subtaskId),
    );
    showToast("Subtask removed");
  }

  function handleSubtaskAdd(taskId: string, title: string) {
    const newId = crypto.randomUUID();
    const defaultAgent = agents.length > 0 ? agents[0].id : undefined;
    updateSubtasksAndSave(taskId, (subs) => [
      ...subs,
      { id: newId, title, completed: false, agent_id: defaultAgent },
    ]);
    handleLLMCall(taskId, newId, title, defaultAgent);
  }

  function handleSubtaskAgentChange(
    taskId: string,
    subtaskId: string,
    agentId: string,
  ) {
    updateSubtasksAndSave(taskId, (subs) =>
      subs.map((s) => (s.id === subtaskId ? { ...s, agent_id: agentId } : s)),
    );
  }

  // ── LLM Call (with agent routing) ──

  async function handleLLMCall(
    taskId: string,
    subtaskId: string,
    subtaskTitle: string,
    agentId?: string,
  ) {
    const currentTask = tasksRef.current.find((t) => t.id === taskId);
    const currentSubtask = currentTask?.subtasks.find(
      (s) => s.id === subtaskId,
    );
    if (currentSubtask?.llm_response) {
      showToast("Showing cached AI solution");
      return;
    }

    // Use the subtask's agent_id if not explicitly passed
    const resolvedAgent = agentId || currentSubtask?.agent_id;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, llm_loading: true } : s,
          ),
        };
      }),
    );

    try {
      const parentTask = tasksRef.current.find((t) => t.id === taskId);
      const prompt = parentTask
        ? `Task: "${parentTask.title}" — Subtask: "${subtaskTitle}"`
        : subtaskTitle;

      const res = await fetch(`${LLM_URL}/llm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, agent_id: resolvedAgent || null }),
      });
      if (!res.ok) throw new Error(`LLM error ${res.status}`);
      const result = (await res.json()) as {
        response: string;
        agent_id: string;
        agent_name: string;
      };

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((s) =>
              s.id === subtaskId
                ? {
                    ...s,
                    llm_response: result.response,
                    llm_loading: false,
                    agent_id: result.agent_id,
                  }
                : s,
            ),
          };
        }),
      );

      try {
        await api("PATCH", `/tasks/${taskId}/subtasks/${subtaskId}`, {
          llm_response: result.response,
          agent_id: result.agent_id,
        });
      } catch {
        // silent
      }
      showToast(`AI solution ready (${result.agent_name})`);
    } catch {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, llm_loading: false } : s,
            ),
          };
        }),
      );
      showToast("LLM call failed");
    }
  }

  function handleDismissLLMResponse(_taskId: string, _subtaskId: string) {
    // UI-only dismiss — TaskCard handles hiding via showLLMFor state.
  }

  // ── Download RESPONSE.md ──

  async function handleDownloadResponse(taskId: string) {
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}/response`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || "RESPONSE.md";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("RESPONSE.md downloaded");
    } catch {
      showToast("Download failed");
    }
  }

  // ── Final Review ──

  async function handleReview(taskId: string) {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (!task) return;

    const solutions = task.subtasks
      .filter((s) => s.llm_response)
      .map((s) => ({ title: s.title, response: s.llm_response! }));

    if (solutions.length === 0) {
      showToast("No solutions to review yet");
      return;
    }

    showToast("Running Final Review...");

    try {
      const res = await fetch(`${LLM_URL}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_title: task.title,
          subtask_solutions: solutions,
        }),
      });
      if (!res.ok) throw new Error("Review failed");
      const result = (await res.json()) as { response: string };

      // Save review as a special subtask called "Final Review"
      const reviewId = crypto.randomUUID();
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          // Remove any existing review subtask
          const filtered = t.subtasks.filter(
            (s) => s.title !== "--- Final Review ---",
          );
          return {
            ...t,
            subtasks: [
              ...filtered,
              {
                id: reviewId,
                title: "--- Final Review ---",
                completed: true,
                llm_response: result.response,
                agent_id: "reviewer",
              },
            ],
          };
        }),
      );

      // Persist
      const updated = tasksRef.current.find((t) => t.id === taskId);
      if (updated) saveSubtasks(taskId, updated.subtasks);

      showToast("Final Review complete");
    } catch {
      showToast("Review failed");
    }
  }

  // ── Filtering ──

  const filtered = tasks.filter((t) => {
    const allSubtasksDone =
      t.subtasks.length > 0 && t.subtasks.every((s) => s.completed);
    const isDone = t.completed || allSubtasksDone;
    if (filter === "pending") return !isDone;
    if (filter === "done") return isDone;
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
      <nav className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b-[3px] border-ink">
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
              <span style={{ color: apiOnline ? "#90EE90" : "#ff6b6b" }}>
                &#9679;
              </span>{" "}
              <span className="text-bg/70">{displayUrl}</span>
            </div>
            <div
              className="text-[0.55rem] tracking-[0.1em] uppercase bg-accent text-white
                px-2.5 py-1 whitespace-nowrap font-mono flex items-center gap-1.5"
              style={{ borderRadius: "var(--radius)" }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="8" cy="8" r="6.5" />
                <path
                  d="M6.5 6.5a1.5 1.5 0 112.5 1.5c0 .75-.75 1-1 1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
              </svg>
              {agents.length > 0 ? `${agents.length} Agents` : "LLM-Powered"}
            </div>
            <NotificationPanel />
          </div>
        </div>
      </nav>

      <main className="max-w-[1120px] mx-auto px-5 pt-8">
        {/* Add Form */}
        <AddTaskForm onAdd={handleAdd} agents={agents} />

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
                  ${
                    filter === f.key
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
                agents={agents}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onSubtaskToggle={handleSubtaskToggle}
                onSubtaskDelete={handleSubtaskDelete}
                onSubtaskAdd={handleSubtaskAdd}
                onLLMCall={(tid, sid, title) => handleLLMCall(tid, sid, title)}
                onDismissLLMResponse={handleDismissLLMResponse}
                onSubtaskAgentChange={handleSubtaskAgentChange}
                onDownloadResponse={handleDownloadResponse}
                onReview={handleReview}
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
