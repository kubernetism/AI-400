"use client";

import type { Subtask, AgentInfo } from "./types";

interface SubtaskItemProps {
  subtask: Subtask;
  index: number;
  agents: AgentInfo[];
  onToggle: (id: string, completed: boolean) => void;
  onLLMCall: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAgentChange: (id: string, agent_id: string) => void;
}

export default function SubtaskItem({
  subtask,
  index,
  agents,
  onToggle,
  onLLMCall,
  onDelete,
  onAgentChange,
}: SubtaskItemProps) {
  const agentName = agents.find((a) => a.id === subtask.agent_id)?.name;

  return (
    <div
      className="animate-slide-in"
      style={{
        animationDelay: `${index * 40}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div
        className={`flex items-center gap-3 px-3 py-2.5 border-l-[3px] transition-colors duration-150
          ${subtask.completed
            ? "border-l-done-ink bg-done-bg/50"
            : "border-l-rule hover:border-l-accent"
          }
          ${subtask.llm_response ? "rounded-t" : ""}`}
      >
        {/* Number */}
        <span className="text-[0.6rem] tracking-wider text-ink-light font-mono uppercase w-5 flex-shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(subtask.id, !subtask.completed)}
          className={`w-4 h-4 flex-shrink-0 border-[1.5px] flex items-center justify-center
            cursor-pointer transition-colors duration-150
            ${subtask.completed
              ? "bg-done-ink border-done-ink"
              : "bg-transparent border-ink hover:bg-accent-bg"
            }`}
          style={{ borderRadius: "var(--radius)" }}
          aria-label={subtask.completed ? "Mark subtask pending" : "Mark subtask done"}
        >
          {subtask.completed && (
            <svg width="8" height="7" viewBox="0 0 12 10" fill="none">
              <polyline
                points="1,5 4.5,8.5 11,1"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Title */}
        <span
          className={`flex-1 text-[0.85rem] font-mono break-words transition-colors duration-150
            ${subtask.completed ? "line-through text-ink-light" : "text-ink"}`}
        >
          {subtask.title}
        </span>

        {/* Agent selector / badge */}
        {agents.length > 0 && (
          subtask.llm_response ? (
            // Show badge if already solved
            agentName && (
              <span
                className="flex-shrink-0 text-[0.55rem] font-mono tracking-wider uppercase
                  px-1.5 py-0.5 bg-done-bg text-done-ink border border-done-ink"
                style={{ borderRadius: "var(--radius)" }}
              >
                {agentName}
              </span>
            )
          ) : (
            // Show dropdown if not yet solved
            <select
              value={subtask.agent_id || agents[0]?.id || ""}
              onChange={(e) => onAgentChange(subtask.id, e.target.value)}
              className="flex-shrink-0 bg-paper border border-rule text-[0.55rem] font-mono
                tracking-wider px-1.5 py-0.5 text-ink cursor-pointer max-w-[120px]"
              style={{ borderRadius: "var(--radius)" }}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )
        )}

        {/* LLM Call Button */}
        <button
          onClick={() => onLLMCall(subtask.id, subtask.title)}
          disabled={subtask.llm_loading}
          className={`btn-press flex-shrink-0 font-mono text-[0.6rem] font-medium tracking-[0.12em] uppercase
            px-2.5 py-1 border-[1.5px] cursor-pointer transition-all duration-150 flex items-center gap-1.5
            ${subtask.llm_loading
              ? "border-accent bg-accent text-white cursor-wait"
              : subtask.llm_response
                ? "border-done-ink bg-done-bg text-done-ink hover:bg-done-ink hover:text-white"
                : "border-accent bg-accent-bg text-accent hover:bg-accent hover:text-white"
            }`}
          style={{ borderRadius: "var(--radius)" }}
          title="Ask LLM for a complete solution"
        >
          {subtask.llm_loading ? (
            <>
              <span className="w-2.5 h-2.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin-custom" />
              Thinking
            </>
          ) : subtask.llm_response ? (
            <>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm3.2 4.3a.75.75 0 00-1.06-.02L7 8.44 5.86 7.3a.75.75 0 10-1.06 1.06l1.5 1.5a.75.75 0 001.06 0l3.84-3.84a.75.75 0 00-.02-1.06z" />
              </svg>
              Solved
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M6.5 6.5a1.5 1.5 0 112.5 1.5c0 .75-.75 1-1 1.5" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
              </svg>
              Solve
            </>
          )}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(subtask.id)}
          className="text-ink-light hover:text-accent text-sm cursor-pointer
            transition-colors duration-150 px-0.5 flex-shrink-0"
          aria-label="Remove subtask"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
