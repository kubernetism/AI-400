"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onDone: () => void;
}

export default function Toast({ message, onDone }: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), 2000);
    const remove = setTimeout(onDone, 2200);
    return () => {
      clearTimeout(timer);
      clearTimeout(remove);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 font-mono text-xs tracking-wider uppercase
        bg-ink text-bg px-5 py-3 shadow-[3px_3px_0_var(--accent)]
        ${leaving ? "animate-toast-out" : "animate-toast-in"}`}
      style={{ borderRadius: "var(--radius)" }}
    >
      {message}
    </div>
  );
}
