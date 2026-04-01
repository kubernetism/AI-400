"use client";

import { useState, useRef } from "react";
import type { AgentInfo } from "./types";

interface SubtaskDraft {
  id: string;
  title: string;
  agent_id: string;
}

interface AddTaskFormProps {
  onAdd: (title: string, subtasks: { title: string; agent_id: string }[]) => void;
  agents: AgentInfo[];
}

export default function AddTaskForm({ onAdd, agents }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [showSubtasks, setShowSubtasks] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const subtaskRef = useRef<HTMLInputElement>(null);

  const defaultAgent = agents.length > 0 ? agents[0].id : "";

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && title.trim()) {
      e.preventDefault();
      setShowSubtasks(true);
      setTimeout(() => subtaskRef.current?.focus(), 50);
    }
  }

  function addSubtask() {
    const trimmed = subtaskInput.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: trimmed, agent_id: defaultAgent },
    ]);
    setSubtaskInput("");
    subtaskRef.current?.focus();
  }

  function removeSubtask(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  }

  function setSubtaskAgent(id: string, agent_id: string) {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, agent_id } : s))
    );
  }

  function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      titleRef.current?.focus();
      return;
    }
    onAdd(
      trimmedTitle,
      subtasks.map((s) => ({ title: s.title, agent_id: s.agent_id }))
    );
    setTitle("");
    setSubtasks([]);
    setSubtaskInput("");
    setShowSubtasks(false);
    titleRef.current?.focus();
  }

  return (
    <div
      className="relative bg-paper border-2 border-ink shadow-[var(--shadow)] p-6 mb-10"
      style={{ borderRadius: "var(--radius)" }}
    >
      {/* Badge */}
      <span
        className="absolute -top-3 left-4 bg-accent text-white text-[0.65rem] font-medium
          tracking-[0.15em] px-2.5 py-0.5"
        style={{ borderRadius: "var(--radius)" }}
      >
        NEW TASK
      </span>

      {/* Title Row */}
      <div className="flex gap-3 mb-3">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          placeholder="Task title... (press Enter to add subtasks)"
          autoComplete="off"
          className="flex-1 min-w-0 bg-bg border-[1.5px] border-rule px-3.5 py-2.5
            font-mono text-sm text-ink"
          style={{ borderRadius: "var(--radius)" }}
        />
        {!showSubtasks && title.trim() && (
          <button
            onClick={() => {
              setShowSubtasks(true);
              setTimeout(() => subtaskRef.current?.focus(), 50);
            }}
            className="btn-press font-mono text-[0.7rem] font-medium tracking-wider uppercase
              px-4 py-2 border-2 border-rule bg-transparent text-ink-light whitespace-nowrap
              hover:border-ink hover:text-ink cursor-pointer transition-colors duration-150"
            style={{ borderRadius: "var(--radius)" }}
          >
            + Subtasks
          </button>
        )}
      </div>

      {/* Subtask Dropdown */}
      {showSubtasks && (
        <div className="animate-fade-in">
          {/* Existing subtasks */}
          {subtasks.length > 0 && (
            <div className="mb-3 flex flex-col gap-1.5">
              {subtasks.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2 bg-bg border border-rule
                    animate-slide-in"
                  style={{
                    borderRadius: "var(--radius)",
                    animationDelay: `${i * 30}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <span className="text-[0.65rem] tracking-wider text-ink-light font-mono uppercase w-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm font-mono text-ink truncate">
                    {s.title}
                  </span>
                  {/* Agent selector */}
                  {agents.length > 0 && (
                    <select
                      value={s.agent_id}
                      onChange={(e) => setSubtaskAgent(s.id, e.target.value)}
                      className="bg-paper border border-rule text-[0.6rem] font-mono
                        tracking-wider px-1.5 py-0.5 text-ink cursor-pointer"
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => removeSubtask(s.id)}
                    className="text-ink-light hover:text-accent text-sm cursor-pointer
                      transition-colors duration-150 px-1"
                    aria-label="Remove subtask"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add subtask input */}
          <div className="flex gap-2 mb-3">
            <input
              ref={subtaskRef}
              type="text"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSubtask();
                }
              }}
              placeholder="Add a subtask... (press Enter)"
              className="flex-1 min-w-0 bg-bg border-[1.5px] border-dashed border-rule px-3.5 py-2
                font-mono text-sm text-ink"
              style={{ borderRadius: "var(--radius)" }}
            />
            <button
              onClick={addSubtask}
              className="btn-press font-mono text-[0.7rem] font-medium tracking-wider uppercase
                px-3 py-2 border-[1.5px] border-rule bg-transparent text-ink-light whitespace-nowrap
                hover:border-ink hover:text-ink cursor-pointer transition-colors duration-150"
              style={{ borderRadius: "var(--radius)" }}
            >
              +
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-rule my-3" />
        </div>
      )}

      {/* Submit Row */}
      <div className="flex gap-3 justify-end">
        {showSubtasks && (
          <button
            onClick={() => {
              setShowSubtasks(false);
              setSubtasks([]);
              setSubtaskInput("");
            }}
            className="btn-press font-mono text-[0.7rem] font-medium tracking-wider uppercase
              px-4 py-2.5 border-2 border-rule bg-transparent text-ink-light
              hover:border-ink hover:text-ink cursor-pointer transition-colors duration-150"
            style={{ borderRadius: "var(--radius)" }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="btn-press font-mono text-sm font-medium tracking-wider uppercase
            px-5 py-2.5 border-2 border-ink bg-ink text-bg whitespace-nowrap
            shadow-[3px_3px_0_var(--accent)] hover:shadow-[4px_4px_0_var(--accent)]
            cursor-pointer transition-shadow duration-100"
          style={{ borderRadius: "var(--radius)" }}
        >
          + Create Task
        </button>
      </div>
    </div>
  );
}
