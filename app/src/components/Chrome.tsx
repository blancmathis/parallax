import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LocaleLink as Link, LocaleNavLink as NavLink } from "../i18n/links";
import { localeFromPath } from "../i18n/provider";
import { useI18n, type Locale } from "../i18n";
import { pendingFor, useStore } from "../lib/store";

// Deep-link the single masthead CTA at a genuinely divisive seeded debate
// rather than duplicating the "debates" nav item. Kept as a static path so
// the chrome stays decoupled from the (lazily loaded) debate data.
const QUIZ_HASH = "#values-quiz";
const QUIZ_TARGET_SELECTOR = ".quizwrap";
const FEATURED_DEBATE = `/debates/smartphones-schools${QUIZ_HASH}`;

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash === QUIZ_HASH) {
      let timeoutId = 0;
      let observer: MutationObserver | null = null;

      const revealQuiz = () => {
        const quiz = document.querySelector<HTMLElement>(QUIZ_TARGET_SELECTOR);
        if (!quiz) return false;
        quiz.scrollIntoView({
          behavior: "instant" as ScrollBehavior,
          block: "start",
        });
        quiz
          .querySelector<HTMLElement>("button:not([disabled]), a[href]")
          ?.focus({ preventScroll: true });
        return true;
      };

      // Debate routes are lazy-loaded. Wait for the existing quiz to mount so
      // the masthead deep-link works on both a cold navigation and the same page.
      if (!revealQuiz()) {
        observer = new MutationObserver(() => {
          if (!revealQuiz()) return;
          observer?.disconnect();
          window.clearTimeout(timeoutId);
        });
        observer.observe(document.getElementById("app-content") ?? document.body, {
          childList: true,
          subtree: true,
        });
        timeoutId = window.setTimeout(() => observer?.disconnect(), 5000);
      }

      return () => {
        observer?.disconnect();
        window.clearTimeout(timeoutId);
      };
    }

    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

/** Swap the /fr prefix on the current path, preserving the rest of the route. */
function pathForLocale(pathname: string, target: Locale): string {
  if (localeFromPath(pathname) === target) return pathname;
  if (target === "fr") return pathname === "/" ? "/fr" : `/fr${pathname}`;
  const stripped = pathname.replace(/^\/fr(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

function LocaleSwitch({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const active = localeFromPath(pathname);
  const locales: Locale[] = ["fr", "en"];

  return (
    <div
      className={`locale-switch ${className}`}
      aria-label={t.chrome.languageLabel}
    >
      {locales.map((option, index) => (
        <span key={option} className="locale-switch__item">
          <button
            type="button"
            className={active === option ? "locale-switch__btn is-active" : "locale-switch__btn"}
            aria-pressed={active === option}
            onClick={() => navigate(`${pathForLocale(pathname, option)}${search}${hash}`)}
          >
            {option.toUpperCase()}
          </button>
          {index < locales.length - 1 && <span aria-hidden="true">·</span>}
        </span>
      ))}
    </div>
  );
}

export function Masthead() {
  const store = useStore();
  const pending = pendingFor(store).length;
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  // Close the sheet whenever the route changes. This is the "adjust state on a
  // prop change" pattern (set state during render, no effect): on the render
  // that observes a new pathname we collapse the menu before paint, so the
  // sheet never lingers across a navigation.
  const [sheetPath, setSheetPath] = useState(pathname);
  if (pathname !== sheetPath) {
    setSheetPath(pathname);
    setMenuOpen(false);
  }

  // When the sheet opens: move focus to its first link; close on Escape or
  // on a click/focus outside the masthead, and restore focus to the burger.
  useEffect(() => {
    if (!menuOpen) return;

    sheetRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const close = () => {
      setMenuOpen(false);
      burgerRef.current?.focus();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) close();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <header className="masthead" ref={headerRef}>
      <div className="masthead__inner">
        <Link to="/" className="masthead__brand">
          Parallax<em>.</em>
        </Link>
        <nav className="masthead__nav" aria-label={t.chrome.primaryNavLabel}>
          <NavLink to="/debates">{t.common.nav.debates}</NavLink>
          <NavLink to="/method">{t.common.nav.method}</NavLink>
          <NavLink to="/review" className="masthead__review">
            {t.common.nav.review}
            {pending > 0 && (
              <span className="masthead__badge" aria-hidden="true">
                {pending}
              </span>
            )}
            {pending > 0 && (
              <span className="sr-only">{t.chrome.pendingCount(pending)}</span>
            )}
          </NavLink>
          <NavLink to="/you">{t.common.nav.you}</NavLink>
        </nav>
        <div className="masthead__right">
          <button
            className="masthead__kbd"
            aria-label={t.chrome.commandPaletteLabel}
            title={t.chrome.commandPaletteLabel}
            onClick={() =>
              window.dispatchEvent(new CustomEvent("parallax:palette"))
            }
          >
            <span aria-hidden="true">⌘K</span>
          </button>
          <LocaleSwitch />
          <Link to={FEATURED_DEBATE} className="masthead__cta">
            {t.chrome.ctaTakeQuiz}
          </Link>
          <button
            ref={burgerRef}
            className={`masthead__burger${menuOpen ? " masthead__burger--open" : ""}`}
            aria-label={menuOpen ? t.chrome.menuClose : t.chrome.menuOpen}
            aria-expanded={menuOpen}
            aria-controls="masthead-sheet"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i aria-hidden="true" />
            <i aria-hidden="true" />
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav
          id="masthead-sheet"
          ref={sheetRef}
          className="masthead__sheet"
          aria-label={t.chrome.primaryNavLabel}
        >
          <NavLink to="/debates">{t.common.nav.debates}</NavLink>
          <NavLink to="/method">{t.common.nav.method}</NavLink>
          <NavLink to="/review">
            {t.common.nav.review}
            {pending > 0 && (
              <span className="masthead__badge" aria-hidden="true">
                {pending}
              </span>
            )}
            {pending > 0 && (
              <span className="sr-only">{t.chrome.pendingCount(pending)}</span>
            )}
          </NavLink>
          <NavLink to="/you">{t.common.nav.you}</NavLink>
          <div className="masthead__sheetfoot">
            <LocaleSwitch />
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="colophon">
      <div className="colophon__inner">
        <div className="colophon__main">
          <div className="colophon__lead">
            <span className="colophon__brand">
              Parallax<em>.</em>
            </span>
            <p className="colophon__motto">{t.chrome.footerMotto}</p>
          </div>
          <div className="colophon__cols">
            <div>
              <h4>{t.chrome.explore}</h4>
              <Link to="/debates">{t.chrome.allDebates}</Link>
              <Link to="/method">{t.chrome.howItWorks}</Link>
              <Link to="/review">{t.chrome.reviewQueue}</Link>
            </div>
            <div>
              <h4>{t.chrome.principles}</h4>
              {t.chrome.principleItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div>
              <h4>{t.chrome.project}</h4>
              {t.chrome.projectItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="colophon__legal">
          <span>{t.chrome.legal.instrument}</span>
          <span>{t.chrome.legal.seed}</span>
          <LocaleSwitch className="locale-switch--footer" />
        </div>
      </div>
    </footer>
  );
}
