import { Component, lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { LocaleLink as Link } from "./i18n/links";
import { Footer, Masthead, ScrollToTop } from "./components/Chrome";
import { useI18n } from "./i18n";
import { CommandPalette } from "./components/CommandPalette";
import { Toaster } from "./lib/toast";
import { RouteHead } from "./seo/RouteHead";
import Landing from "./pages/Landing";
import "./features.css";

// Landing is needed for the first paint; the rest are route-split so the
// landing does not download every debate, both i18n dicts, and all interactive
// surfaces in one chunk.
const DebatesIndex = lazy(() => import("./pages/DebatesIndex"));
const DebatePage = lazy(() => import("./pages/DebatePage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const Project = lazy(() => import("./pages/Project"));
const Method = lazy(() => import("./pages/Method"));

function NotFound() {
  const { t } = useI18n();
  return (
    <main className="page notfound">
      <span className="stamp stamp--inline">404</span>
      <h1 className="section__title section__title--big">
        {t.features.notFoundTitle}
        <br />
        <em>{t.features.notFoundBody}</em>
      </h1>
      <Link to="/debates" className="btn btn--primary">
        {t.features.notFoundCta}
      </Link>
    </main>
  );
}

/** Lightweight, paper-aesthetic placeholder while a route chunk loads. */
function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback__mark" aria-hidden="true">
        <span className="route-fallback__dot route-fallback__dot--fill" />
        <span className="route-fallback__dot route-fallback__dot--ring" />
      </span>
    </div>
  );
}

/** Reusable paper fallback for runtime render errors. Reads i18n via hook. */
function ErrorScreen({ onReset }: { onReset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="page notfound">
      <span className="stamp stamp--inline">!</span>
      <h1 className="section__title section__title--big">
        {t.features.errorTitle}
        <br />
        <em>{t.features.errorBody}</em>
      </h1>
      <button type="button" className="btn btn--primary" onClick={onReset}>
        {t.features.errorCta}
      </button>
    </main>
  );
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.error("Render error:", error);
  }

  handleReset = () => {
    // A reload re-runs the lazy chunk fetch and clears transient render state.
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorScreen onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

/** The same reading components serve FR at / and EN under /en/. */
function AppRoutes() {
  const { locale } = useI18n();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/debates" element={<DebatesIndex />} />
      <Route path="/debates/:slug" element={<DebatePage />} />
      <Route path="/method" element={<Method />} />
      <Route
        path={locale === "fr" ? "/projet" : "/project"}
        element={<Project />}
      />
      <Route
        path={locale === "fr" ? "/mentions-legales" : "/legal"}
        element={<LegalPage kind="legal" />}
      />
      <Route
        path={locale === "fr" ? "/confidentialite" : "/privacy"}
        element={<LegalPage kind="privacy" />}
      />
      <Route path="/contact" element={<LegalPage kind="contact" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  const { t } = useI18n();
  return (
    <>
      <a className="skip-link" href="#app-content">
        {t.features.skipToContent}
      </a>
      <ScrollToTop />
      <RouteHead />
      <Masthead />
      <div id="app-content" tabIndex={-1} className="app-main">
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/en/*" element={<AppRoutes />} />
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
      <Footer />
      <CommandPalette />
      <Toaster />
    </>
  );
}
