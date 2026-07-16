import { useSyncExternalStore } from "react";

/** Minimal toast store: the data + subscribe layer behind <Toaster />. */

export interface Toast {
  id: number;
  message: string;
  kind: "info" | "success";
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function toast(message: string, kind: Toast["kind"] = "info"): void {
  const t = { id: nextId++, message, kind };
  toasts = [...toasts, t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, 3400);
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
  );
}
