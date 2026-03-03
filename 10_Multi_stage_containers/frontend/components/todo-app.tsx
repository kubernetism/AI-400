"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  Clock,
  CheckCheck,
  ListTodo,
  LayoutList,
  Server,
  WifiOff,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Terminal,
  Zap,
  X,
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
type ThemeMode  = "light" | "dark" | "system";
type ApiStatus  = "connecting" | "online" | "offline";

interface LocalMeta {
  completed: boolean;
  priority: Priority;
}

interface Todo {
  id: string;
  backendId: number;
  task: string;
  completed: boolean;
  priority: Priority;
}

// ─── Priority config (brutal palette) ─────────────────────────────────────────

const P = {
  CRITICAL: { label: "!! URGENT",  color: "var(--color-destructive)", bgClass: "bg-destructive/10", borderClass: "border-destructive/40" },
  HIGH:     { label: "! HIGH",     color: "var(--color-primary)",     bgClass: "bg-primary/10",      borderClass: "border-primary/40" },
  MEDIUM:   { label: "— MEDIUM",   color: "var(--color-secondary)",   bgClass: "bg-secondary/10",    borderClass: "border-secondary/40" },
  LOW:      { label: "_ LOW",      color: "var(--color-muted-foreground)", bgClass: "bg-muted/30",   borderClass: "border-muted-foreground/30" },
} satisfies Record<Priority, { label: string; color: string; bgClass: string; borderClass: string }>;

const DEFAULT_META: LocalMeta = { completed: false, priority: "MEDIUM" };

// ─── ThemeToggle (three-way: Light / System / Dark) ───────────────────────────

function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    } else {
      setMode("system");
    }
  }, []);

  const applyTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem("theme", newMode);

    if (newMode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newMode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // system
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  return (
    <div className="flex border-brutal">
      {([
        { value: "light" as ThemeMode, icon: Sun, label: "LGT" },
        { value: "system" as ThemeMode, icon: Monitor, label: "SYS" },
        { value: "dark" as ThemeMode, icon: Moon, label: "DRK" },
      ]).map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => applyTheme(value)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
            mode === value
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            value !== "light" && "border-l-2 border-border",
          )}
          aria-label={`Switch to ${value} mode`}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="border-brutal bg-card p-4 text-center shadow-brutal-sm transition-colors hover:shadow-brutal">
      <div className="mb-1.5 flex justify-center text-muted-foreground">{icon}</div>
      <div
        className="mb-0.5 text-4xl tracking-tight text-foreground"
        style={{ fontFamily: "var(--font-bebas-neue)" }}
      >
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );
}

// ─── ApiStatusBadge ───────────────────────────────────────────────────────────

function ApiStatusBadge({ status }: { status: ApiStatus }) {
  const cfg = {
    connecting: { marker: "~", color: "text-yellow-500" },
    online:     { marker: "+", color: "text-green-500" },
    offline:    { marker: "x", color: "text-destructive" },
  }[status];

  return (
    <div className="flex items-center gap-1.5 font-bold">
      {status === "connecting" ? (
        <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
      ) : (
        <span className={cn("text-xs", cfg.color)}>[{cfg.marker}]</span>
      )}
      <span className={cn("text-[10px] uppercase tracking-wider", cfg.color)}>
        {status}
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
          className="h-14 animate-pulse border-brutal bg-muted/30"
          style={{ animationDelay: `${i * 80}ms` }}
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

  // ── Initial fetch ─────────────────────────────────────────────────────────
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

  // ── Merge backend + local meta ──────────────────────────────────────────
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

  // ── Toggle completed ──────────────────────────────────────────────────────
  const toggleTodo = (id: string) =>
    setLocalMeta((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? DEFAULT_META), completed: !(prev[id]?.completed ?? false) },
    }));

  // ── Delete todo ───────────────────────────────────────────────────────────
  const deleteTodo = async (id: string, backendId: number) => {
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
    <div className="min-h-screen bg-background brutal-bg scanlines">
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-3">
                <Terminal className="h-5 w-5 text-primary" />
                <h1
                  className="text-5xl tracking-tight text-foreground"
                  style={{ fontFamily: "var(--font-bebas-neue)" }}
                >
                  TASKS<span className="animate-blink text-primary">_</span>
                </h1>
              </div>
              <p className="ml-8 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Raw productivity. No fluff.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <ThemeToggle />
              <div className="flex items-center gap-3">
                <ApiStatusBadge status={apiStatus} />
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="tabular-nums">{clock}</span>
                </div>
              </div>
            </div>
          </div>

          {/* API URL bar */}
          <div className="mt-5 flex items-center gap-2 border-brutal bg-card px-3 py-2">
            <Server className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">BACKEND</span>
            <span className={cn(
              "text-[10px] font-bold",
              apiStatus === "online" ? "text-green-500" :
              apiStatus === "offline" ? "text-destructive" :
              "text-yellow-500"
            )}>
              {API_URL}
            </span>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
              {apiStatus === "offline" ? "UNREACHABLE" : apiStatus === "connecting" ? "PROBING..." : "CONNECTED"}
            </span>
          </div>

          <div className="mt-5 h-0.5 bg-border" />
        </header>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard label="Total"  value={todos.length}   icon={<LayoutList className="h-4 w-4" />} />
          <StatCard label="Active" value={activeCount}    icon={<ListTodo   className="h-4 w-4" />} />
          <StatCard label="Done"   value={completedCount} icon={<CheckCheck className="h-4 w-4" />} />
        </div>

        {/* ── Progress bar ───────────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              // PROGRESS
            </span>
            <span
              className="text-2xl text-primary"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
            >
              {progress}%
            </span>
          </div>
          <div className="h-3 border-brutal bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Input area ─────────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-0 border-brutal-thick shadow-brutal">
          <div className="flex items-center bg-primary px-3">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="ENTER TASK..."
            className="flex-1 border-0 bg-card px-3 py-3 text-sm uppercase placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger
              className="w-[120px] border-0 border-l-2 border-border bg-card text-[10px] font-bold uppercase tracking-wider"
              style={{ color: P[priority].color }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-brutal bg-popover">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                <SelectItem
                  key={p}
                  value={p}
                  className="text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  style={{ color: P[p].color }}
                >
                  {P[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 border-l-2 border-border bg-primary px-5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            ADD
          </button>
        </div>

        {/* ── Filter tabs ────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-center gap-0">
          {(["ALL", "ACTIVE", "COMPLETED"] as FilterType[]).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "border-2 border-border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
                  f !== "ALL" && "-ml-0.5",
                )}
              >
                {f}
              </button>
            );
          })}
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            [{visible.length}] {visible.length === 1 ? "TASK" : "TASKS"}
          </span>
        </div>

        {/* ── Todo list ──────────────────────────────────────────────────── */}
        <div className="space-y-2">

          {loading && <LoadingSkeleton />}

          {!loading && apiStatus === "offline" && backendTodos.length === 0 && (
            <div className="border-2 border-destructive bg-destructive/5 py-12 text-center">
              <WifiOff className="mx-auto mb-3 h-6 w-6 text-destructive/60" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">BACKEND UNREACHABLE</p>
              <p className="mt-1 text-[10px] text-destructive/60">{API_URL}</p>
            </div>
          )}

          {!loading && !visible.length && (apiStatus !== "offline" || backendTodos.length > 0) && (
            <div className="border-brutal bg-card py-16 text-center">
              <Terminal className="mx-auto mb-3 h-8 w-8 text-primary/30" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {filter === "COMPLETED" ? "NOTHING COMPLETED" : filter === "ACTIVE" ? "ALL TASKS DONE_" : "NO TASKS. ADD ONE_"}
              </p>
            </div>
          )}

          {!loading && visible.map((todo, idx) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={idx}
              onToggle={toggleTodo}
              onDelete={(id) => deleteTodo(id, todo.backendId)}
            />
          ))}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {!loading && todos.length > 0 && (
          <div className="mt-8 flex items-center gap-4">
            <div className="h-0.5 flex-1 bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {activeCount} {activeCount === 1 ? "TASK" : "TASKS"} REMAINING
            </span>
            <div className="h-0.5 flex-1 bg-border" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TodoItem ─────────────────────────────────────────────────────────────────

function TodoItem({
  todo, index, onToggle, onDelete,
}: {
  todo: Todo;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const pcfg = P[todo.priority];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 border-brutal bg-card p-3 transition-all hover:shadow-brutal-sm animate-fade-in-up",
        `delay-${Math.min(index, 9)}`,
        todo.completed && "opacity-50",
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 transition-colors",
          todo.completed
            ? "border-primary bg-primary/20 text-primary"
            : "border-muted-foreground/40 hover:border-primary",
        )}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        {todo.completed && (
          <X className="h-3 w-3" strokeWidth={3} />
        )}
      </button>

      {/* Task text */}
      <span
        className={cn(
          "flex-1 text-sm transition-colors",
          todo.completed ? "line-through text-muted-foreground" : "text-foreground",
        )}
      >
        {todo.task}
      </span>

      {/* Backend ID */}
      <span className="flex-shrink-0 text-[10px] font-bold text-muted-foreground/30">
        #{todo.backendId}
      </span>

      {/* Priority badge */}
      <span
        className={cn(
          "flex-shrink-0 border-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
          pcfg.bgClass,
          pcfg.borderClass,
        )}
        style={{ color: pcfg.color }}
      >
        {pcfg.label}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(todo.id)}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center border-2 border-transparent text-muted-foreground/30 opacity-0 transition-all hover:border-destructive hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
