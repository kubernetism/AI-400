"use client";

import { useState } from "react";

interface LLMResponseCardProps {
  subtaskTitle: string;
  response: string;
  onClose: () => void;
}

export default function LLMResponseCard({ subtaskTitle, response, onClose }: LLMResponseCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Split response into paragraphs for better formatting
  const paragraphs = response.split("\n").filter((p) => p.trim());

  return (
    <div
      className="bg-paper border-2 border-accent shadow-[4px_4px_0_var(--accent)] animate-slide-in"
      style={{ borderRadius: "var(--radius)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-accent/20 bg-accent-bg">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex-shrink-0 bg-accent text-white text-[0.55rem] font-medium
              tracking-[0.15em] px-2 py-0.5 uppercase"
            style={{ borderRadius: "var(--radius)" }}
          >
            AI Solution
          </span>
          <span className="text-xs font-mono text-ink truncate">
            {subtaskTitle}
          </span>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-ink-light hover:text-ink text-xs cursor-pointer
              transition-colors duration-150 px-1 font-mono"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "+" : "\u2013"}
          </button>
          <button
            onClick={onClose}
            className="text-ink-light hover:text-accent text-sm cursor-pointer
              transition-colors duration-150 px-1"
            aria-label="Close response"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 py-3 max-h-[400px] overflow-y-auto">
          <div className="font-mono text-[0.8rem] text-ink leading-relaxed space-y-2.5">
            {paragraphs.map((p, i) => {
              // Check if it looks like a heading (starts with # or is ALL CAPS short line)
              if (p.startsWith("# ")) {
                return (
                  <h3 key={i} className="font-display text-lg tracking-wide text-ink mt-2 first:mt-0">
                    {p.replace(/^#+\s*/, "")}
                  </h3>
                );
              }
              if (p.startsWith("## ")) {
                return (
                  <h4 key={i} className="font-display text-base tracking-wide text-ink mt-2">
                    {p.replace(/^#+\s*/, "")}
                  </h4>
                );
              }
              // Check for code blocks
              if (p.startsWith("```")) {
                return (
                  <pre
                    key={i}
                    className="bg-ink text-bg px-3 py-2 text-[0.75rem] overflow-x-auto"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    {p.replace(/```\w*\n?/g, "").replace(/```$/g, "")}
                  </pre>
                );
              }
              // Check for bullet points
              if (p.startsWith("- ") || p.startsWith("* ")) {
                return (
                  <div key={i} className="flex gap-2 pl-2">
                    <span className="text-accent flex-shrink-0">&bull;</span>
                    <span>{p.replace(/^[-*]\s+/, "")}</span>
                  </div>
                );
              }
              // Check for numbered items
              const numMatch = p.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={i} className="flex gap-2 pl-2">
                    <span className="text-accent flex-shrink-0 text-[0.7rem] font-medium">
                      {numMatch[1]}.
                    </span>
                    <span>{numMatch[2]}</span>
                  </div>
                );
              }
              // Regular paragraph
              return <p key={i}>{p}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
