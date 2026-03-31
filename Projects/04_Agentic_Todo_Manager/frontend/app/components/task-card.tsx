"use client";

import { useState, useRef } from "react";
import type { Task, Subtask } from "./types";
import SubtaskItem from "./subtask-item";
import LLMResponseCard from "./llm-response-card";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onSubtaskToggle: (taskId: string, subtaskId: string, completed: boolean) => void;
  onSubtaskDelete: (taskId: string, subtaskId: string) => void;
  onSubtaskAdd: (taskId: string, title: string) => void;
  onLLMCall: (taskId: string, subtaskId: string, subtaskTitle: string) => void;
  onDismissLLMResponse: (taskId: string, subtaskId: string) => void;
  index: number;
}

export default function TaskCard({
  task,
  onToggle,
  onDelete,
  onUpdate,
  onSubtaskToggle,
  onSubtaskDelete,
  onSubtaskAdd,
  onLLMCall,
  onDismissLLMResponse,
  index,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(task.subtasks.length > 0);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [newSubtask, setNewSubtask] = useState("");
  const [removing, setRemoving] = useState(false);
  const [showLLMFor, setShowLLMFor] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const completedCount = task.subtasks.filter((s) => s.completed).length;
  const totalCount = task.subtasks.length;
  const hasSubtasks = totalCount > 0;
  const allDone = hasSubtasks && completedCount === totalCount;

  // Only show response card when explicitly requested via LLM-Call button
  const activeResponse = showLLMFor
    ? task.subtasks.find((s) => s.id === showLLMFor && s.llm_response)
    : null;

  function handleDelete() {
    setRemoving(true);
    setTimeout(() => onDelete(task.id), 200);
  }

  function handleSaveTitle() {
    if (!editTitle.trim()) return;
    onUpdate(task.id, editTitle.trim());
    setEditing(false);
  }

  function handleAddSubtask() {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    onSubtaskAdd(task.id, trimmed);
    setNewSubtask("");
    subtaskInputRef.current?.focus();
  }

  return (
    <div
      className="animate-slide-in"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className={`flex flex-col lg:flex-row gap-3 ${removing ? "opacity-0 translate-x-5 transition-all duration-200" : ""}`}>
        {/* Main Task Card */}
        <div
          className={`flex-1 border-2 font-mono transition-colors duration-200
            ${allDone || task.completed
              ? "bg-done-bg border-done-ink shadow-[4px_4px_0_var(--done-ink)]"
              : "bg-paper border-ink shadow-[var(--shadow)]"
            }`}
          style={{ borderRadius: "var(--radius)" }}
        >
          {/* Task Header */}
          <div className="flex items-start gap-4 p-5">
            {/* Main Checkbox */}
            <button
              onClick={() => onToggle(task.id, !task.completed)}
              className={`w-[22px] h-[22px] flex-shrink-0 mt-0.5 border-2 flex items-center justify-center
                cursor-pointer transition-colors duration-150
                ${task.completed || allDone
                  ? "bg-done-ink border-done-ink"
                  : "bg-transparent border-ink hover:bg-accent-bg"
                }`}
              style={{ borderRadius: "var(--radius)" }}
              aria-label={task.completed ? "Mark as pending" : "Mark as done"}
            >
              {(task.completed || allDone) && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <polyline
                    points="1,5 4.5,8.5 11,1"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* Title + Meta */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex gap-2">
                  <input
                    ref={titleRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") {
                        setEditTitle(task.title);
                        setEditing(false);
                      }
                    }}
                    className="flex-1 bg-bg border-[1.5px] border-rule px-2.5 py-1.5
                      font-mono text-sm text-ink"
                    style={{ borderRadius: "var(--radius)" }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="btn-press font-mono text-[0.65rem] tracking-wider uppercase
                      px-3 py-1.5 border-2 border-ink bg-ink text-bg cursor-pointer"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div
                  className={`text-[0.95rem] font-medium break-words transition-colors duration-150
                    ${task.completed || allDone ? "line-through text-ink-light" : "text-ink"}`}
                >
                  {task.title}
                </div>
              )}

              {/* Progress + Status */}
              <div className="mt-2 flex items-center gap-2.5 flex-wrap">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full border text-[0.65rem]
                    tracking-wider uppercase
                    ${task.completed || allDone
                      ? "text-done-ink border-done-ink bg-done-bg"
                      : "text-accent border-accent bg-accent-bg"
                    }`}
                >
                  {task.completed || allDone ? "Done" : "Pending"}
                </span>

                {hasSubtasks && (
                  <span className="text-[0.65rem] tracking-wider text-ink-light font-mono uppercase">
                    {completedCount}/{totalCount} subtasks
                  </span>
                )}

                {/* Progress bar */}
                {hasSubtasks && (
                  <div className="flex-1 min-w-[60px] max-w-[120px] h-1.5 bg-rule/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-done-ink rounded-full transition-all duration-300"
                      style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1.5 flex-shrink-0">
              {hasSubtasks && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="btn-press font-mono text-[0.7rem] font-medium tracking-wider uppercase
                    px-3 py-1.5 border-2 border-rule bg-transparent text-ink-light
                    hover:border-ink hover:text-ink cursor-pointer transition-colors duration-150"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  {expanded ? "\u25B4" : "\u25BE"} {totalCount}
                </button>
              )}
              {!editing && (
                <button
                  onClick={() => {
                    setEditing(true);
                    setEditTitle(task.title);
                    setTimeout(() => titleRef.current?.focus(), 50);
                  }}
                  className="btn-press font-mono text-[0.7rem] font-medium tracking-wider uppercase
                    px-3 py-1.5 border-2 border-rule bg-transparent text-ink-light
                    hover:border-ink hover:text-ink cursor-pointer transition-colors duration-150"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleDelete}
                className="btn-press font-mono text-[0.7rem] font-medium tracking-wider uppercase
                  px-3 py-1.5 border-2 border-accent bg-transparent text-accent
                  hover:bg-accent hover:text-white cursor-pointer transition-colors duration-150"
                style={{ borderRadius: "var(--radius)" }}
              >
                Del
              </button>
            </div>
          </div>

          {/* Subtasks Dropdown */}
          {expanded && (
            <div className="border-t-2 border-ink/10 animate-fade-in">
              {/* Subtask List */}
              {task.subtasks.map((subtask, i) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  index={i}
                  onToggle={(sid, completed) => onSubtaskToggle(task.id, sid, completed)}
                  onLLMCall={(sid, title) => {
                    onLLMCall(task.id, sid, title);
                    setShowLLMFor(sid);
                  }}
                  onDelete={(sid) => onSubtaskDelete(task.id, sid)}
                />
              ))}

              {/* Add Subtask Input */}
              <div className="flex gap-2 px-3 py-2.5 border-t border-rule/50">
                <input
                  ref={subtaskInputRef}
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add subtask..."
                  className="flex-1 min-w-0 bg-transparent border-none px-2 py-1
                    font-mono text-[0.8rem] text-ink outline-none"
                />
                <button
                  onClick={handleAddSubtask}
                  className="btn-press font-mono text-[0.6rem] font-medium tracking-wider uppercase
                    px-2.5 py-1 border-[1.5px] border-rule bg-transparent text-ink-light
                    hover:border-ink hover:text-ink cursor-pointer transition-colors duration-150"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  + Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LLM Response Card (appears beside the task) */}
        {activeResponse && (
          <div className="lg:w-[380px] flex-shrink-0">
            <LLMResponseCard
              subtaskTitle={activeResponse.title}
              response={activeResponse.llm_response!}
              onClose={() => setShowLLMFor(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
