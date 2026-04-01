"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Task } from "../components/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function animateNumber(
  setter: (v: string) => void,
  target: number,
  suffix = "",
  isInt = true
) {
  const dur = 700;
  const step = 14;
  let t = 0;
  let from = 0;
  const timer = setInterval(() => {
    t += step;
    const v = from + (target - from) * Math.min(t / dur, 1);
    setter((isInt ? Math.round(v) : v.toFixed(1)) + suffix);
    if (t >= dur) clearInterval(timer);
  }, step);
  return () => clearInterval(timer);
}

export default function ProgressDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAlive, setApiAlive] = useState(true);

  // Animated stat values
  const [sTotal, setSTotal] = useState("--");
  const [sDone, setSDone] = useState("--");
  const [sPending, setSPending] = useState("--");
  const [sRate, setSRate] = useState("--");

  // Gauge
  const [gaugeDoneOffset, setGaugeDoneOffset] = useState(471.24);
  const [gaugePendOffset, setGaugePendOffset] = useState(471.24);
  const [gaugePendRotate, setGaugePendRotate] = useState(0);
  const [gaugePct, setGaugePct] = useState("0%");

  // Bars
  const [barDoneWidth, setBarDoneWidth] = useState("0%");
  const [barPendWidth, setBarPendWidth] = useState("0%");
  const [barDoneVal, setBarDoneVal] = useState("0");
  const [barPendVal, setBarPendVal] = useState("0");

  // Meta
  const [metaRemain, setMetaRemain] = useState("--");
  const [metaSubtasks, setMetaSubtasks] = useState("--");
  const [metaSolved, setMetaSolved] = useState("--");
  const [metaAgents, setMetaAgents] = useState("--");

  const CIRC = 2 * Math.PI * 75; // 471.24

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Task[] = await res.json();
      setTasks(data);
      setApiAlive(true);
      setError(null);
      setLoading(false);

      const total = data.length;
      const done = data.filter((t) => t.completed).length;
      const pending = total - done;
      const pct = total ? Math.round((done / total) * 100) : 0;

      // Subtask stats
      const allSubtasks = data.flatMap((t) => t.subtasks || []);
      const totalSubtasks = allSubtasks.length;
      const solvedSubtasks = allSubtasks.filter((s) => s.llm_response).length;
      const withAgent = allSubtasks.filter((s) => s.agent_id).length;

      // Animate numbers
      animateNumber(setSTotal, total);
      animateNumber(setSDone, done);
      animateNumber(setSPending, pending);
      animateNumber(setSRate, pct, "%");

      // Gauge
      setGaugePct(pct + "%");
      setTimeout(() => {
        const donePct = total ? (done / total) * 100 : 0;
        const pendPct = total ? (pending / total) * 100 : 0;
        setGaugeDoneOffset(CIRC - (donePct / 100) * CIRC);
        setGaugePendOffset(CIRC - (pendPct / 100) * CIRC);
        setGaugePendRotate((donePct / 100) * 360);
      }, 120);

      // Bars
      setBarDoneVal(String(done));
      setBarPendVal(String(pending));
      setTimeout(() => {
        setBarDoneWidth(total ? `${(done / total) * 100}%` : "0%");
        setBarPendWidth(total ? `${(pending / total) * 100}%` : "0%");
      }, 160);

      // Meta
      setMetaRemain(`${pending} tasks`);
      setMetaSubtasks(String(totalSubtasks));
      setMetaSolved(String(solvedSubtasks));
      setMetaAgents(String(withAgent));
    } catch (e: unknown) {
      setApiAlive(false);
      setError("Cannot reach API: " + (e instanceof Error ? e.message : String(e)));
      setLoading(false);
    }
  }, [CIRC]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen px-5 py-10 pb-20">
      {/* HEADER */}
      <header
        className="max-w-[960px] mx-auto mb-12 flex items-end justify-between
          border-b-[3px] border-ink pb-3 gap-4 flex-wrap"
      >
        <div>
          <h1
            className="font-display text-ink leading-[0.9] tracking-[0.02em]"
            style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
          >
            Progress
            <br />
            Board
          </h1>
          <p className="text-[0.7rem] tracking-[0.15em] uppercase text-ink-light mt-1.5 font-mono">
            AI Native Task Manager / Dashboard
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className="text-[0.65rem] tracking-[0.1em] uppercase bg-ink text-bg px-2.5 py-1 whitespace-nowrap"
            style={{ borderRadius: "var(--radius)" }}
          >
            API{" "}
            <span style={{ color: apiAlive ? "#90EE90" : "#ff6b6b", fontWeight: 500 }}>
              {"\u25CF"}
            </span>{" "}
            {API_URL.replace(/https?:\/\//, "")}
          </div>
          <Link
            href="/"
            className="text-[0.65rem] tracking-[0.1em] uppercase text-ink-light no-underline
              border-[1.5px] border-rule px-3 py-1 hover:border-ink hover:text-ink
              transition-colors duration-150 font-mono"
            style={{ borderRadius: "var(--radius)" }}
          >
            {"\u2190"} Task Board
          </Link>
        </div>
      </header>

      <div className="max-w-[960px] mx-auto">
        {/* ERROR BANNER */}
        {error && (
          <div
            className="bg-accent-bg border-2 border-accent text-accent text-[0.75rem]
              tracking-[0.05em] px-4 py-2.5 mb-7"
            style={{ borderRadius: "var(--radius)" }}
          >
            {"\u26A0"} {error}
          </div>
        )}

        {/* STAT CARDS */}
        <SectionLabel text="Overview" />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-9">
          <StatCard label="Total Tasks" value={sTotal} suffix="registered" colorClass="c-total" delay={0.04} />
          <StatCard label="Completed" value={sDone} suffix="finished" colorClass="c-done" delay={0.09} />
          <StatCard label="Pending" value={sPending} suffix="outstanding" colorClass="c-pending" delay={0.14} />
          <StatCard label="Completion Rate" value={sRate} suffix="percent done" colorClass="c-rate" delay={0.19} />
        </div>

        {/* ANALYSIS ROW */}
        <SectionLabel text="Analysis" />

        <div className="grid grid-cols-[1fr_1.55fr] gap-5 mb-9 max-md:grid-cols-1">
          {/* Gauge Panel */}
          <Panel title="Progress Arc" tag="Gauge">
            <div className="flex flex-col items-center gap-4 py-7 px-5">
              <div className="relative w-[170px] h-[170px]">
                <svg
                  className="w-[170px] h-[170px]"
                  viewBox="0 0 170 170"
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx="85" cy="85" r="75"
                    fill="none" stroke="var(--rule)" strokeWidth="15"
                  />
                  <circle
                    cx="85" cy="85" r="75"
                    fill="none" stroke="var(--bg)" strokeWidth="15"
                  />
                  <circle
                    cx="85" cy="85" r="75"
                    fill="none" stroke="var(--accent)" strokeWidth="15"
                    strokeDasharray={CIRC}
                    strokeDashoffset={gaugePendOffset}
                    style={{
                      transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1) 0.08s",
                      transform: `rotate(${gaugePendRotate}deg)`,
                      transformOrigin: "85px 85px",
                    }}
                  />
                  <circle
                    cx="85" cy="85" r="75"
                    fill="none" stroke="var(--done-ink)" strokeWidth="15"
                    strokeDasharray={CIRC}
                    strokeDashoffset={gaugeDoneOffset}
                    style={{
                      transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-display text-[3rem] leading-none text-ink">
                    {gaugePct}
                  </div>
                  <div className="font-serif italic text-[0.75rem] text-ink-light mt-0.5">
                    complete
                  </div>
                </div>
              </div>
              <div className="flex gap-5">
                <LegendItem color="done" label="Done" />
                <LegendItem color="pending" label="Pending" />
              </div>
            </div>
          </Panel>

          {/* Distribution Panel */}
          <Panel title="Distribution" tag="Breakdown" delay={0.08}>
            <div className="p-5">
              <div className="flex flex-col gap-5">
                <BarItem
                  name="Completed"
                  value={barDoneVal}
                  width={barDoneWidth}
                  variant="done"
                />
                <BarItem
                  name="Pending"
                  value={barPendVal}
                  width={barPendWidth}
                  variant="pending"
                />
              </div>

              <hr className="border-t border-rule my-[18px]" />

              <table className="w-full border-collapse">
                <tbody>
                  <MetaRow label="Remaining work" value={metaRemain} />
                  <MetaRow label="Total subtasks" value={metaSubtasks} />
                  <MetaRow label="AI solved" value={metaSolved} />
                  <MetaRow label="Agent assigned" value={metaAgents} />
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* TASK TABLE */}
        <div className="flex items-center gap-3 mb-3.5">
          <SectionLabel text="Task Registry" />
          <button
            onClick={loadData}
            className="font-mono text-[0.72rem] font-medium tracking-[0.08em] uppercase
              px-3.5 py-1.5 border-[1.5px] border-rule bg-transparent text-ink-light
              cursor-pointer hover:border-ink hover:text-ink transition-colors duration-150
              inline-flex items-center gap-1.5 ml-auto flex-shrink-0"
            style={{ borderRadius: "var(--radius)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M11 6A5 5 0 1 1 6 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <polyline
                points="11,1 11,6 6,6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Refresh
          </button>
        </div>

        <div
          className="bg-paper border-2 border-ink overflow-hidden"
          style={{
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow)",
            animation: "fadeUp 0.4s ease both",
            animationDelay: "0.18s",
          }}
        >
          <div className="flex items-center justify-between px-[18px] py-2.5 bg-ink border-b-2 border-ink">
            <span className="font-display text-[1rem] tracking-[0.12em] text-bg">
              All Tasks
            </span>
            <span
              className="text-[0.58rem] tracking-[0.12em] uppercase bg-bg text-ink-light px-2 py-0.5"
              style={{ borderRadius: "var(--radius)" }}
            >
              {tasks.length} entries
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-ink-light text-[0.75rem] tracking-[0.1em] uppercase">
              <div
                className="w-[18px] h-[18px] border-2 border-rule border-t-ink rounded-full mx-auto mb-3"
                style={{ animation: "spin 0.65s linear infinite" }}
              />
              Loading...
            </div>
          ) : !apiAlive ? (
            <div className="text-center py-12 text-ink-light text-[0.75rem] tracking-[0.1em] uppercase">
              <span className="font-display text-[4rem] text-rule block leading-none mb-2">
                {"\u2715"}
              </span>
              API unreachable
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-ink-light text-[0.75rem] tracking-[0.1em] uppercase">
              <span className="font-display text-[4rem] text-rule block leading-none mb-2">
                {"\u2205"}
              </span>
              No tasks yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono">
                <thead>
                  <tr>
                    <th className="text-left px-3.5 py-2 text-[0.6rem] tracking-[0.16em] uppercase text-bg bg-ink whitespace-nowrap w-11">
                      #
                    </th>
                    <th className="text-left px-3.5 py-2 text-[0.6rem] tracking-[0.16em] uppercase text-bg bg-ink whitespace-nowrap">
                      Title
                    </th>
                    <th className="text-left px-3.5 py-2 text-[0.6rem] tracking-[0.16em] uppercase text-bg bg-ink whitespace-nowrap">
                      Subtasks
                    </th>
                    <th className="text-left px-3.5 py-2 text-[0.6rem] tracking-[0.16em] uppercase text-bg bg-ink whitespace-nowrap w-[110px]">
                      Status
                    </th>
                    <th className="text-left px-3.5 py-2 text-[0.6rem] tracking-[0.16em] uppercase text-bg bg-ink whitespace-nowrap w-24">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => {
                    const subtaskCount = task.subtasks?.length || 0;
                    const doneCount = task.subtasks?.filter((s) => s.completed).length || 0;
                    return (
                      <tr key={task.id} className="hover:bg-bg">
                        <td className="px-3.5 py-[11px] border-b border-rule align-middle text-[0.8rem]">
                          <span className="font-serif italic text-ink-light">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </td>
                        <td className="px-3.5 py-[11px] border-b border-rule align-middle text-[0.8rem] font-medium text-ink">
                          {task.title}
                        </td>
                        <td className="px-3.5 py-[11px] border-b border-rule align-middle text-[0.72rem] text-ink-light">
                          {subtaskCount > 0 ? `${doneCount}/${subtaskCount}` : "--"}
                        </td>
                        <td className="px-3.5 py-[11px] border-b border-rule align-middle">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full border-[1.5px]
                              text-[0.62rem] tracking-[0.1em] uppercase
                              ${task.completed
                                ? "text-done-ink border-done-ink bg-done-bg"
                                : "text-accent border-accent bg-accent-bg"
                              }`}
                          >
                            {task.completed ? "Done" : "Pending"}
                          </span>
                        </td>
                        <td className="px-3.5 py-[11px] border-b border-rule align-middle text-[0.62rem] text-rule tracking-[0.04em]">
                          {task.id.slice(0, 8).toUpperCase()}{"\u2026"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 mb-3.5">
      <span className="font-display text-[1rem] tracking-[0.14em] text-ink-light whitespace-nowrap">
        {text}
      </span>
      <div className="flex-1 h-px bg-rule" />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  colorClass,
  delay,
}: {
  label: string;
  value: string;
  suffix: string;
  colorClass: string;
  delay: number;
}) {
  const colorMap: Record<string, { badge: string; value: string }> = {
    "c-total": { badge: "bg-ink", value: "text-ink" },
    "c-done": { badge: "bg-done-ink", value: "text-done-ink" },
    "c-pending": { badge: "bg-accent", value: "text-accent" },
    "c-rate": { badge: "bg-ink-light", value: "text-ink-light" },
  };
  const colors = colorMap[colorClass] || colorMap["c-total"];

  return (
    <div
      className="bg-paper border-2 border-ink relative px-[22px] py-5"
      style={{
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow)",
        animation: "fadeUp 0.35s ease both",
        animationDelay: `${delay}s`,
      }}
    >
      <span
        className={`absolute -top-[11px] left-3.5 text-[0.58rem] font-medium
          tracking-[0.16em] uppercase px-2 py-0.5 text-white ${colors.badge}`}
        style={{ borderRadius: "var(--radius)" }}
      >
        {label}
      </span>
      <div className={`font-display text-[3.8rem] leading-none tracking-[0.02em] mt-1.5 ${colors.value}`}>
        {value}
      </div>
      <div className="font-serif italic text-[0.85rem] text-ink-light mt-1">
        {suffix}
      </div>
    </div>
  );
}

function Panel({
  title,
  tag,
  delay = 0,
  children,
}: {
  title: string;
  tag: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-paper border-2 border-ink overflow-hidden"
      style={{
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow)",
        animation: "fadeUp 0.4s ease both",
        animationDelay: `${delay}s`,
      }}
    >
      <div className="flex items-center justify-between px-[18px] py-2.5 bg-ink border-b-2 border-ink">
        <span className="font-display text-[1rem] tracking-[0.12em] text-bg">
          {title}
        </span>
        <span
          className="text-[0.58rem] tracking-[0.12em] uppercase bg-bg text-ink-light px-2 py-0.5"
          style={{ borderRadius: "var(--radius)" }}
        >
          {tag}
        </span>
      </div>
      {children}
    </div>
  );
}

function LegendItem({ color, label }: { color: "done" | "pending"; label: string }) {
  const styles =
    color === "done"
      ? "bg-done-bg border-done-ink"
      : "bg-accent-bg border-accent";
  return (
    <div className="flex items-center gap-[7px] text-[0.65rem] tracking-[0.08em] uppercase text-ink-light">
      <div
        className={`w-2.5 h-2.5 border-2 ${styles}`}
        style={{ borderRadius: "var(--radius)" }}
      />
      {label}
    </div>
  );
}

function BarItem({
  name,
  value,
  width,
  variant,
}: {
  name: string;
  value: string;
  width: string;
  variant: "done" | "pending";
}) {
  const valColor = variant === "done" ? "text-done-ink" : "text-accent";
  const fillColor = variant === "done" ? "bg-done-ink" : "bg-accent";
  return (
    <div>
      <div className="flex justify-between items-baseline mb-[7px]">
        <span className="text-[0.68rem] tracking-[0.1em] uppercase text-ink-light">
          {name}
        </span>
        <span className={`font-display text-[1.15rem] tracking-[0.04em] ${valColor}`}>
          {value}
        </span>
      </div>
      <div
        className="h-2.5 bg-bg border-[1.5px] border-rule overflow-hidden"
        style={{ borderRadius: "var(--radius)" }}
      >
        <div
          className={`h-full ${fillColor}`}
          style={{
            width,
            borderRadius: "var(--radius)",
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-[7px] text-[0.63rem] text-ink-light tracking-[0.06em] uppercase border-b border-rule last:border-b-0">
        {label}
      </td>
      <td className="py-[7px] text-right font-display text-[1.1rem] tracking-[0.04em] text-ink border-b border-rule last:border-b-0">
        {value}
      </td>
    </tr>
  );
}
