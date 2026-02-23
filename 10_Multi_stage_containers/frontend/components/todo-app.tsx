"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  Zap,
  Clock,
  Activity,
  CheckCheck,
  ListTodo,
  LayoutList,
  Server,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  fetchTodos,
  createTodo,
  deleteTodo as apiDeleteTodo,
  API_URL,
  type BackendTodo,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority   = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type FilterType = "ALL" | "ACTIVE" | "COMPLETED";
type ApiStatus  = "connecting" | "online" | "offline";

interface LocalMeta {
  completed: boolean;
  priority: Priority;
}

interface Todo {
  id: string;        // string version of backend id
  backendId: number;
  task: string;
  completed: boolean;
  priority: Priority;
}

// ─── Priority config ──────────────────────────────────────────────────────────

const P = {
  CRITICAL: {
    bar:   "#f87171",
    badge: { color: "#f87171", border: "rgba(248,113,113,0.28)", bg: "rgba(248,113,113,0.08)" },
    dot:   { bg: "#f87171", glow: "0 0 7px #f87171" },
    card:  { hoverBorder: "rgba(248,113,113,0.32)", hoverShadow: "0 0 22px rgba(248,113,113,0.1)" },
  },
  HIGH: {
    bar:   "#fb923c",
    badge: { color: "#fb923c", border: "rgba(251,146,60,0.28)",  bg: "rgba(251,146,60,0.08)"  },
    dot:   { bg: "#fb923c", glow: "0 0 7px #fb923c" },
    card:  { hoverBorder: "rgba(251,146,60,0.32)",  hoverShadow: "0 0 22px rgba(251,146,60,0.1)"  },
  },
  MEDIUM: {
    bar:   "#22d3ee",
    badge: { color: "#22d3ee", border: "rgba(34,211,238,0.28)",  bg: "rgba(34,211,238,0.08)"  },
    dot:   { bg: "#22d3ee", glow: "0 0 7px #22d3ee" },
    card:  { hoverBorder: "rgba(34,211,238,0.32)",  hoverShadow: "0 0 22px rgba(34,211,238,0.1)"  },
  },
  LOW: {
    bar:   "#34d399",
    badge: { color: "#34d399", border: "rgba(52,211,153,0.28)",  bg: "rgba(52,211,153,0.08)"  },
    dot:   { bg: "#34d399", glow: "0 0 7px #34d399" },
    card:  { hoverBorder: "rgba(52,211,153,0.32)",  hoverShadow: "0 0 22px rgba(52,211,153,0.1)"  },
  },
} satisfies Record<Priority, {
  bar: string;
  badge: { color: string; border: string; bg: string };
  dot:   { bg: string; glow: string };
  card:  { hoverBorder: string; hoverShadow: string };
}>;

const DEFAULT_META: LocalMeta = { completed: false, priority: "MEDIUM" };

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, color, borderColor, shadowColor, icon,
}: {
  label: string; value: number; color: string;
  borderColor: string; shadowColor: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded p-4 text-center transition-all duration-300"
      style={{
        background: "rgba(7,8,15,0.9)",
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 24px ${shadowColor}`,
      }}
    >
      <div className="mb-1 flex justify-center opacity-40">{icon}</div>
      <div
        className="mb-1 tabular-nums text-3xl font-black tracking-tight"
        style={{
          fontFamily: "var(--font-orbitron)",
          color,
          textShadow: `0 0 10px ${color}cc, 0 0 30px ${color}55`,
        }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[9px] tracking-[0.3em] text-muted-foreground">{label}</div>
    </div>
  );
}

// ─── ApiStatusBadge ───────────────────────────────────────────────────────────

function ApiStatusBadge({ status }: { status: ApiStatus }) {
  const cfg = {
    connecting: { color: "#fb923c", dot: "bg-orange-400",  shadow: "0 0 6px #fb923c", label: "CONNECTING" },
    online:     { color: "#34d399", dot: "bg-emerald-400", shadow: "0 0 6px #34d399", label: "API ONLINE"  },
    offline:    { color: "#f87171", dot: "bg-red-400",     shadow: "0 0 6px #f87171", label: "API OFFLINE" },
  }[status];

  return (
    <div className="flex items-center gap-1.5">
      {status === "connecting" ? (
        <Loader2 className="h-2.5 w-2.5 animate-spin" style={{ color: cfg.color }} />
      ) : (
        <span
          className={cn("h-2 w-2 rounded-full", status === "online" ? "animate-pulse-dot" : "", cfg.dot)}
          style={{ boxShadow: cfg.shadow }}
        />
      )}
      <span className="text-[9px] tracking-[0.25em]" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ─── LoadingSkeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded"
          style={{
            background: "rgba(0,217,255,0.04)",
            border: "1px solid rgba(0,217,255,0.08)",
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TodoApp() {
  const [backendTodos, setBackendTodos] = useState<BackendTodo[]>([]);
  const [localMeta, setLocalMeta]       = useState<Record<string, LocalMeta>>({});
  const [apiStatus, setApiStatus]       = useState<ApiStatus>("connecting");
  const [loading, setLoading]           = useState(true);
  const [input, setInput]               = useState("");
  const [priority, setPriority]         = useState<Priority>("MEDIUM");
  const [filter, setFilter]             = useState<FilterType>("ALL");
  const [clock, setClock]               = useState("");
  const inputRef                        = useRef<HTMLInputElement>(null);

  // ── Live clock ────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-US", {
          hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Initial fetch from backend ────────────────────────────────────────────
  useEffect(() => {
    fetchTodos()
      .then((todos) => {
        setBackendTodos(todos);
        setLocalMeta((prev) => {
          const next = { ...prev };
          todos.forEach((t) => {
            if (!next[String(t.id)]) next[String(t.id)] = { ...DEFAULT_META };
          });
          return next;
        });
        setApiStatus("online");
      })
      .catch(() => setApiStatus("offline"))
      .finally(() => setLoading(false));
  }, []);

  // ── Merge backend + local meta → display todos ────────────────────────────
  const todos: Todo[] = backendTodos.map((bt) => {
    const meta = localMeta[String(bt.id)] ?? DEFAULT_META;
    return { id: String(bt.id), backendId: bt.id, task: bt.task, ...meta };
  });

  const completedCount = todos.filter((t) =>  t.completed).length;
  const activeCount    = todos.filter((t) => !t.completed).length;
  const progress       = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const visible = todos.filter((t) => {
    if (filter === "ACTIVE")    return !t.completed;
    if (filter === "COMPLETED") return  t.completed;
    return true;
  });

  // ── Add todo ──────────────────────────────────────────────────────────────
  const addTodo = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    inputRef.current?.focus();

    try {
      const created = await createTodo(trimmed);
      setBackendTodos((prev) => [created, ...prev]);
      setLocalMeta((prev) => ({
        ...prev,
        [String(created.id)]: { completed: false, priority },
      }));
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  }, [input, priority]);

  // ── Toggle completed (local only — backend has no completed field) ─────────
  const toggleTodo = (id: string) =>
    setLocalMeta((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? DEFAULT_META), completed: !(prev[id]?.completed ?? false) },
    }));

  // ── Delete todo ───────────────────────────────────────────────────────────
  const deleteTodo = async (id: string, backendId: number) => {
    // Optimistic: remove from UI immediately
    setBackendTodos((prev) => prev.filter((t) => t.id !== backendId));
    setLocalMeta((prev) => { const n = { ...prev }; delete n[id]; return n; });

    try {
      await apiDeleteTodo(backendId);
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-hidden scanline-container">

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -left-52 -top-52 h-[600px] w-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,217,255,0.045) 0%, transparent 68%)" }} />
      <div className="pointer-events-none absolute -bottom-52 -right-52 h-[600px] w-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,255,148,0.03) 0%, transparent 68%)" }} />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="flex items-start justify-between">

            {/* Title */}
            <div>
              <div className="mb-1 flex items-center gap-2.5">
                <Zap className="h-5 w-5 text-cyan-400" style={{ filter: "drop-shadow(0 0 7px #00d9ff)" }} />
                <h1
                  className="text-2xl font-black tracking-[0.25em] text-cyan-400 glow-cyan animate-flicker select-none"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  QUANTUM TASKS
                </h1>
              </div>
              <p className="ml-8 text-[9px] tracking-[0.35em] text-muted-foreground">
                NEURAL TASK MANAGEMENT SYSTEM v2.0
              </p>
            </div>

            {/* Status panel */}
            <div className="flex flex-col items-end gap-1.5">
              {/* System online */}
              <div className="flex items-center gap-2">
                <span className="animate-pulse-dot h-2 w-2 rounded-full bg-emerald-400"
                  style={{ boxShadow: "0 0 7px #34d399" }} />
                <span className="text-[9px] tracking-[0.3em] text-emerald-400">SYSTEM ONLINE</span>
              </div>

              {/* API status */}
              <ApiStatusBadge status={apiStatus} />

              {/* Clock */}
              <div className="flex items-center gap-1.5 text-[10px] tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span style={{ fontFamily: "var(--font-space-mono)" }}>{clock} UTC</span>
              </div>
            </div>
          </div>

          {/* API URL bar */}
          <div
            className="mt-3 flex items-center gap-2 rounded px-3 py-1.5"
            style={{
              background: "rgba(0,217,255,0.025)",
              border: "1px solid rgba(0,217,255,0.09)",
            }}
          >
            <Server className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[9px] tracking-widest text-muted-foreground">BACKEND</span>
            <span
              className="text-[9px] tracking-wider"
              style={{
                fontFamily: "var(--font-space-mono)",
                color: apiStatus === "online" ? "#34d399" : apiStatus === "offline" ? "#f87171" : "#fb923c",
              }}
            >
              {API_URL}
            </span>
            <div className="ml-auto text-[9px] tracking-widest text-muted-foreground">
              {apiStatus === "offline" ? "⊘ UNREACHABLE" : apiStatus === "connecting" ? "… PROBING" : "✓ REACHABLE"}
            </div>
          </div>

          {/* Separator */}
          <div className="mt-4 h-px"
            style={{ background: "linear-gradient(90deg, rgba(0,217,255,0.5), rgba(0,217,255,0.12) 60%, transparent)" }} />
        </header>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard label="TOTAL"  value={todos.length}   color="#22d3ee" borderColor="rgba(34,211,238,0.18)"  shadowColor="rgba(34,211,238,0.07)"  icon={<LayoutList className="h-4 w-4 text-cyan-400"    />} />
          <StatCard label="ACTIVE" value={activeCount}    color="#fb923c" borderColor="rgba(251,146,60,0.18)"  shadowColor="rgba(251,146,60,0.07)"  icon={<ListTodo   className="h-4 w-4 text-orange-400"  />} />
          <StatCard label="DONE"   value={completedCount} color="#34d399" borderColor="rgba(52,211,153,0.18)"  shadowColor="rgba(52,211,153,0.07)"  icon={<CheckCheck className="h-4 w-4 text-emerald-400" />} />
        </div>

        {/* ── Progress bar ─────────────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-cyan-400" />
              <span className="text-[9px] tracking-[0.3em] text-muted-foreground">MISSION PROGRESS</span>
            </div>
            <span
              className="text-sm font-bold text-cyan-400"
              style={{ fontFamily: "var(--font-orbitron)", textShadow: "0 0 10px rgba(0,217,255,0.7)" }}
            >
              {progress}%
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ background: "rgba(0,217,255,0.07)", border: "1px solid rgba(0,217,255,0.13)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out animate-progress-glow"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00d9ff, #00ff94)" }}
            />
          </div>
        </div>

        {/* ── Input area ───────────────────────────────────────────────────── */}
        <div
          className="mb-6 flex gap-2 rounded p-3"
          style={{
            background: "rgba(0,217,255,0.025)",
            border: "1px solid rgba(0,217,255,0.13)",
            boxShadow: "inset 0 0 30px rgba(0,217,255,0.015)",
          }}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="ENTER NEW TASK..."
            className="flex-1 border-0 bg-transparent text-sm tracking-wide placeholder:tracking-[0.2em] placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ fontFamily: "var(--font-space-mono)" }}
          />

          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger
              className="w-[120px] border text-[11px] tracking-wider focus:ring-0"
              style={{
                fontFamily: "var(--font-space-mono)",
                background: "rgba(0,217,255,0.04)",
                borderColor: "rgba(0,217,255,0.18)",
                color: P[priority].bar,
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: "#07080f", border: "1px solid rgba(0,217,255,0.18)", fontFamily: "var(--font-space-mono)" }}>
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                <SelectItem key={p} value={p} className="text-[11px] tracking-wider cursor-pointer" style={{ color: P[p].bar }}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 rounded px-4 text-[11px] tracking-[0.2em] transition-all duration-200 disabled:cursor-not-allowed"
            style={{
              fontFamily: "var(--font-orbitron)",
              color:      input.trim() ? "#00d9ff" : "rgba(0,217,255,0.3)",
              background: input.trim() ? "rgba(0,217,255,0.12)" : "rgba(0,217,255,0.03)",
              border:     `1px solid ${input.trim() ? "rgba(0,217,255,0.38)" : "rgba(0,217,255,0.1)"}`,
              boxShadow:  input.trim() ? "0 0 14px rgba(0,217,255,0.18)" : "none",
            }}
          >
            <Plus className="h-4 w-4" />
            ADD
          </button>
        </div>

        {/* ── Filter tabs ──────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-center gap-1.5">
          {(["ALL", "ACTIVE", "COMPLETED"] as FilterType[]).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded px-4 py-1.5 text-[9px] tracking-[0.3em] transition-all duration-200"
                style={{
                  fontFamily: "var(--font-orbitron)",
                  color:      isActive ? "#00d9ff" : "rgba(100,130,155,1)",
                  background: isActive ? "rgba(0,217,255,0.08)" : "transparent",
                  border:     `1px solid ${isActive ? "rgba(0,217,255,0.32)" : "rgba(0,217,255,0.07)"}`,
                  boxShadow:  isActive ? "0 0 12px rgba(0,217,255,0.13)" : "none",
                }}
              >
                {f}
              </button>
            );
          })}
          <span className="ml-auto text-[9px] tracking-widest text-muted-foreground">
            {visible.length} RECORD{visible.length !== 1 ? "S" : ""}
          </span>
        </div>

        {/* ── Todo list ────────────────────────────────────────────────────── */}
        <div className="space-y-2">

          {/* Loading skeleton */}
          {loading && <LoadingSkeleton />}

          {/* Offline / empty states */}
          {!loading && apiStatus === "offline" && backendTodos.length === 0 && (
            <div
              className="rounded py-12 text-center"
              style={{ border: "1px solid rgba(248,113,113,0.12)", background: "rgba(248,113,113,0.02)" }}
            >
              <WifiOff className="mx-auto mb-3 h-6 w-6 opacity-20" style={{ color: "#f87171" }} />
              <p className="text-[10px] tracking-[0.3em] text-muted-foreground">BACKEND UNREACHABLE</p>
              <p className="mt-1 text-[9px] tracking-wider" style={{ color: "#f87171", opacity: 0.6 }}>
                {API_URL}
              </p>
            </div>
          )}

          {!loading && !visible.length && (apiStatus !== "offline" || backendTodos.length > 0) && (
            <div
              className="rounded py-16 text-center"
              style={{ border: "1px solid rgba(0,217,255,0.07)", background: "rgba(0,217,255,0.015)" }}
            >
              <div className="mb-3 select-none text-3xl opacity-15" style={{ color: "#00d9ff" }}>◈</div>
              <p className="text-[10px] tracking-[0.35em] text-muted-foreground">NO TASKS IN DATABASE</p>
            </div>
          )}

          {/* Todo items */}
          {!loading && visible.map((todo, idx) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              cfg={P[todo.priority]}
              index={idx}
              onToggle={toggleTodo}
              onDelete={(id) => deleteTodo(id, todo.backendId)}
            />
          ))}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {!loading && todos.length > 0 && (
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.1))" }} />
            <span className="text-[9px] tracking-[0.3em] text-muted-foreground">
              {activeCount} TASK{activeCount !== 1 ? "S" : ""} REMAINING
            </span>
            <div className="h-px flex-1"
              style={{ background: "linear-gradient(90deg, rgba(0,217,255,0.1), transparent)" }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TodoItem ─────────────────────────────────────────────────────────────────

function TodoItem({
  todo, cfg, index, onToggle, onDelete,
}: {
  todo: Todo;
  cfg: (typeof P)[Priority];
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const borderColor = hovered && !todo.completed
    ? cfg.card.hoverBorder
    : todo.completed ? "rgba(52,211,153,0.11)" : "rgba(0,217,255,0.09)";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded p-3 transition-all duration-300 animate-slide-in-up",
        `delay-${Math.min(index, 9)}`,
      )}
      style={{
        background:   todo.completed ? "rgba(52,211,153,0.025)" : "rgba(7,8,15,0.85)",
        border:       `1px solid ${borderColor}`,
        boxShadow:    hovered && !todo.completed ? cfg.card.hoverShadow : "none",
        opacity:      todo.completed ? 0.6 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Priority bar */}
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l"
        style={{ background: cfg.bar, boxShadow: `0 0 10px ${cfg.bar}`, opacity: todo.completed ? 0.35 : 0.85 }}
      />

      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className="ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300"
        style={{
          border:     `1.5px solid ${todo.completed ? "#34d399" : "rgba(0,217,255,0.35)"}`,
          background: todo.completed ? "rgba(52,211,153,0.15)" : "transparent",
          boxShadow:  todo.completed ? "0 0 9px rgba(52,211,153,0.45)" : "none",
        }}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        {todo.completed && (
          <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none" style={{ filter: "drop-shadow(0 0 3px #34d399)" }}>
            <path d="M1.5 5l2.5 2.5 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <div
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ background: cfg.dot.bg, boxShadow: cfg.dot.glow, opacity: todo.completed ? 0.35 : 1 }}
      />

      {/* Task text */}
      <span
        className={cn(
          "flex-1 text-sm tracking-wide transition-all duration-300",
          todo.completed ? "line-through text-muted-foreground" : "text-foreground",
        )}
        style={{ fontFamily: "var(--font-space-mono)" }}
      >
        {todo.task}
      </span>

      {/* Backend ID badge */}
      <span
        className="flex-shrink-0 text-[8px] tracking-widest text-muted-foreground"
        style={{ fontFamily: "var(--font-space-mono)", opacity: 0.4 }}
      >
        #{todo.backendId}
      </span>

      {/* Priority badge */}
      <span
        className="flex-shrink-0 rounded px-2 py-0.5 text-[9px] tracking-[0.2em]"
        style={{
          fontFamily: "var(--font-orbitron)",
          color:      cfg.badge.color,
          border:     `1px solid ${cfg.badge.border}`,
          background: cfg.badge.bg,
        }}
      >
        {todo.priority.slice(0, 3)}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(todo.id)}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded opacity-0 transition-all duration-200 group-hover:opacity-100"
        style={{ color: "rgba(248,113,113,0.55)", border: "1px solid transparent" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color       = "#f87171";
          e.currentTarget.style.borderColor = "rgba(248,113,113,0.28)";
          e.currentTarget.style.background  = "rgba(248,113,113,0.08)";
          e.currentTarget.style.boxShadow   = "0 0 8px rgba(248,113,113,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color       = "rgba(248,113,113,0.55)";
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.background  = "transparent";
          e.currentTarget.style.boxShadow   = "none";
        }}
        aria-label="Delete task"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
