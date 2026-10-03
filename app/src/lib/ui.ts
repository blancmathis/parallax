import { useEffect, useRef, useState } from "react";

/** Adds "inview" class when the element enters the viewport (once). */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("inview");
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("inview");
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/** Standard document-title format across all pages: "X — Parallax". */
export const BRAND = "Parallax";

export function withBrand(name: string): string {
  return `${name} — ${BRAND}`;
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

/** Counts from 0 to target when `start` flips true. */
export function useCountUp(target: number, start: boolean, ms = 900): number {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (!start) return;
    // Under reduced-motion, collapse the duration so the very first animation
    // frame snaps straight to the target — keeping the only setState inside the
    // rAF callback (never synchronously in the effect body).
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : ms;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = duration <= 0 ? 1 : Math.min(1, (now - t0) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, ms]);
  return value;
}

/** Reading progress (0..1) across the whole document. */
export function useReadingProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return p;
}

export async function copyLink(hash?: string): Promise<boolean> {
  const url =
    window.location.origin +
    window.location.pathname +
    (hash ? `#${hash}` : "");
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
