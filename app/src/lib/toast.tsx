/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { useToasts, type Toast } from "./toast-store";

// The toast() function + its store moved to ./toast-store. Re-export here so
// existing imports from "../lib/toast" (e.g. `import { toast } from "../lib/toast"`)
// keep working.
export { toast } from "./toast-store";
export type { Toast } from "./toast-store";

/** Minimal toast system, styled like everything else: paper, ink, stamp. */

function ToastItem({ t }: { t: Toast }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className={`toast toast--${t.kind}${leaving ? " toast--leaving" : ""}`}>
      <span className="toast__dot" />
      {t.message}
    </div>
  );
}

export function Toaster() {
  const list = useToasts();
  if (list.length === 0) return null;
  return (
    <div className="toaster" aria-live="polite">
      {list.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
}
