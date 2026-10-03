import { useEffect, useMemo, useRef, useState } from "react";
import { useLocaleNavigate } from "../i18n/links";
import { getDebates, slugOf } from "../data";
import { useI18n } from "../i18n";

interface Item {
  id: string;
  label: string;
  hint: string;
  to: string;
  searchText: string;
}

function normalizeSearch(value: string, locale: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase(locale);
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const navigate = useLocaleNavigate();
  const { locale, t } = useI18n();
  const debates = getDebates(locale);

  const items: Item[] = useMemo(() => {
    const p = t.interactive.palette;
    const page = (id: string, label: string, to: string): Item => ({
      id,
      label,
      hint: p.hintPage,
      to,
      searchText: `${label} ${p.hintPage}`,
    });
    return [
      page("home", p.home, "/"),
      page("debates", p.allDebates, "/debates"),
      page("method", p.method, "/method"),
      ...debates.map((d) => ({
        id: d.topic.id,
        label: d.topic.question,
        hint: p.hintDebate,
        to: `/debates/${slugOf(d)}`,
        searchText: [
          d.topic.title,
          d.topic.question,
          d.topic.summary,
          ...d.positions.flatMap((position) => [
            position.title,
            position.short_summary,
            position.steelman,
          ]),
          ...d.arguments.map((argument) => argument.summary),
          ...d.claims.map((claim) => claim.text),
          ...d.sources.flatMap((source) => [
            source.title,
            source.publisher,
            source.url,
            source.quality_notes,
          ]),
          ...d.values.flatMap((value) => [value.name, value.description]),
          ...d.tradeoffs.flatMap((tradeoff) => [
            tradeoff.gain,
            tradeoff.cost,
            tradeoff.risk,
          ]),
        ].join(" "),
      })),
    ];
  }, [debates, t]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query.trim(), locale);
    if (!q) return items;
    return items.filter((item) => normalizeSearch(item.searchText, locale).includes(q));
  }, [items, locale, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => {
      setOpen(true);
      setQuery("");
      setActive(0);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("parallax:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("parallax:palette", onOpen);
    };
  }, []);

  // Lock body scroll while open and restore focus to the opener on close.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const activeId = filtered[active]?.id;

  const go = (item: Item) => {
    setOpen(false);
    navigate(item.to);
  };

  return (
    <div
      className="palette"
      role="dialog"
      aria-modal="true"
      aria-label={t.interactive.palette.placeholder}
    >
      <div className="palette__backdrop" onClick={() => setOpen(false)} />
      <div className="palette__panel" ref={panelRef}>
        <div className="palette__inputrow">
          <span className="palette__glyph" aria-hidden="true">
            ⌘K
          </span>
          <input
            ref={inputRef}
            className="palette__input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-listbox"
            aria-activedescendant={
              activeId ? `palette-opt-${activeId}` : undefined
            }
            aria-autocomplete="list"
            aria-label={t.interactive.palette.placeholder}
            placeholder={t.interactive.palette.placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (filtered.length === 0) return;
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && filtered[active]) {
                e.preventDefault();
                go(filtered[active]);
              } else if (e.key === "Tab") {
                // single-input dialog: keep focus inside the palette
                e.preventDefault();
              }
            }}
          />
        </div>
        <div
          className="palette__list"
          id="palette-listbox"
          role="listbox"
          aria-label={t.interactive.palette.placeholder}
        >
          {filtered.length === 0 && (
            <p className="palette__empty" role="status" aria-live="polite">
              {t.interactive.palette.empty}
            </p>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.id}
              id={`palette-opt-${item.id}`}
              type="button"
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              className={`palette__item${i === active ? " palette__item--active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
            >
              <span className="palette__label">{item.label}</span>
              <span className="palette__hint">{item.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
