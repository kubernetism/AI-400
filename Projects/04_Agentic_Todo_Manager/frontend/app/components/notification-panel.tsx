"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "./types";

const NOTIFY_URL =
  process.env.NEXT_PUBLIC_NOTIFY_URL || "http://notification-api:8002";

const TYPE_ICONS: Record<string, string> = {
  task_created: "+",
  task_completed: "✓",
  task_deleted: "×",
  task_updated: "~",
  subtask_solved: "⚡",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [online, setOnline] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${NOTIFY_URL}/notifications`);
      if (!res.ok) throw new Error();
      const data: Notification[] = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);

  // Poll every 5 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAsRead(id: string) {
    try {
      await fetch(`${NOTIFY_URL}/notifications/${id}/read`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await fetch(`${NOTIFY_URL}/notifications/read-all`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 cursor-pointer
          border-[1.5px] border-ink bg-paper hover:bg-ink hover:text-bg
          transition-all duration-150"
        style={{ borderRadius: "var(--radius)" }}
        title="Notifications"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M8 1.5a4 4 0 014 4v3l1.5 2H2.5L4 8.5v-3a4 4 0 014-4z" />
          <path d="M6 12.5a2 2 0 004 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[0.5rem]
              font-mono leading-none min-w-[14px] h-[14px] flex items-center
              justify-center rounded-full px-0.5"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {!online && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-rule rounded-full"
            title="Notification service offline"
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-10 w-[320px] max-h-[400px] overflow-y-auto
            bg-paper border-2 border-ink shadow-[var(--shadow)] z-50
            animate-slide-in"
          style={{ borderRadius: "var(--radius)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-ink">
            <span className="font-display text-lg tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[0.6rem] font-mono tracking-wider uppercase text-accent
                  hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-ink-light font-mono tracking-wider uppercase">
                No notifications yet
              </p>
            </div>
          ) : (
            <div>
              {notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-rule
                    cursor-pointer transition-colors duration-100
                    ${n.read ? "opacity-50" : "bg-accent-bg/30 hover:bg-accent-bg/60"}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-sm leading-none mt-0.5 text-accent w-4 text-center flex-shrink-0">
                      {TYPE_ICONS[n.type] || "•"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[0.7rem] font-bold tracking-wider truncate">
                        {n.title}
                      </p>
                      <p className="font-mono text-[0.6rem] text-ink-light mt-0.5 truncate">
                        {n.message}
                      </p>
                    </div>
                    <span className="text-[0.55rem] font-mono text-ink-light whitespace-nowrap mt-0.5">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {!n.read && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
