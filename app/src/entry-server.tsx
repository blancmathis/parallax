import { StrictMode } from "react";
import { prerender } from "react-dom/static";
import { StaticRouter } from "react-router-dom";
import App from "./App";
import { I18nProvider } from "./i18n/provider";

/** Same component tree as the client; await all lazy reading sections. */
export async function renderPage(pathname: string): Promise<string> {
  const tree = (
    <StrictMode>
      <StaticRouter location={pathname}>
        <I18nProvider>
          <App />
        </I18nProvider>
      </StaticRouter>
    </StrictMode>
  );
  const options = {
    // Emit each completed boundary in place, even for a long dossier. Chunked
    // boundary replacement uses inline scripts and would break the site's CSP.
    progressiveChunkSize: Number.MAX_SAFE_INTEGER,
    onError: (error: unknown) => {
      throw error;
    },
  };
  const { prelude, postponed } = await prerender(tree, options);
  if (postponed) throw new Error(`Incomplete prerender: ${pathname}`);
  return new Response(prelude).text();
}
