/**
 * Return the URL only if it is a safe absolute http(s) link; otherwise undefined.
 * Used at every render sink that puts a contribution/source URL into an
 * `<a href>` so a `javascript:`/`data:`/other-scheme value renders inert
 * (no execution on click). Defence-in-depth alongside the Zod check on submit
 * and the DB CHECK constraint on contributions.url / sources.url.
 */
export function safeHttpUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:" ? trimmed : undefined;
  } catch {
    return undefined;
  }
}
