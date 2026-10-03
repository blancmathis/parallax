/**
 * Return the URL only if it is a safe absolute http(s) link; otherwise undefined.
 * Used at every render sink that puts a contribution/source URL into an
 * `<a href>` so a `javascript:`/`data:`/other-scheme value renders inert
 * (no execution on click). Embedded credentials and non-standard ports are
 * rejected too: public source links must not become a credential disclosure or
 * an unexpected service endpoint. Defence-in-depth alongside submit/DB checks.
 */
export function safeHttpUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  const hasWhitespaceOrControl = [...trimmed].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return /\s/u.test(character) || codePoint <= 31 || codePoint === 127;
  });
  if (
    trimmed.length > 2048 ||
    hasWhitespaceOrControl ||
    !/^https?:\/\//i.test(trimmed)
  ) {
    return undefined;
  }
  try {
    const u = new URL(trimmed);
    if (
      (u.protocol !== "http:" && u.protocol !== "https:") ||
      !u.hostname ||
      u.username ||
      u.password
    ) {
      return undefined;
    }
    const allowedPort = u.protocol === "https:" ? "443" : "80";
    if (u.port && u.port !== allowedPort) return undefined;
    // Keep query-name inspection identical to the database gate: encoded key
    // bytes can hide a sensitive name (`%74oken` → `token`). Encoding remains
    // allowed in values and in the path.
    const queryStart = trimmed.indexOf("?");
    const rawQuery =
      queryStart >= 0
        ? trimmed.slice(queryStart + 1).split("#", 1)[0]
        : "";
    const hasEncodedQueryKey = rawQuery
      .split("&")
      .some((part) => part.split("=", 1)[0].includes("%"));
    if (hasEncodedQueryKey) return undefined;
    const sensitiveKey =
      /(?:^|[_-])(?:access[_-]?token|token|secret|client[_-]?secret|password|passwd|api[_-]?key|apikey|authorization|credential|signature|session|jwt|key)(?:$|[_-])/i;
    const hasSensitiveQuery = [...u.searchParams.keys()].some(
      (key) =>
        sensitiveKey.test(key) ||
        ["fb_access_token", "x-amz-signature", "x-goog-signature"].includes(
          key.toLowerCase(),
        ),
    );
    const rawFragment = trimmed.includes("#")
      ? trimmed.slice(trimmed.indexOf("#") + 1)
      : "";
    const hasSensitiveFragment = [
      ...new URLSearchParams(rawFragment).keys(),
    ].some(
      (key) =>
        sensitiveKey.test(key) ||
        ["fb_access_token", "x-amz-signature", "x-goog-signature"].includes(
          key.toLowerCase(),
        ),
    );
    return hasSensitiveQuery || hasSensitiveFragment ? undefined : trimmed;
  } catch {
    return undefined;
  }
}
