// CANONICAL URL normalizer. MUST stay behavior-identical to SQL
// public.source_key(): trim; lowercase scheme + hostname only; preserve
// protocol, path/query/fragment case and trailing slash; drop tracking params.
// It is the join key between the source-integrity library and a rendered source.
export function sourceKey(rawUrl: string): string {
  const input = (rawUrl ?? "").trim();
  if (input === "") return "";

  const absolute = input.match(
    /^([A-Za-z][A-Za-z0-9+.-]*):\/\/([^/?#]*)([\s\S]*)$/,
  );
  if (!absolute) return input;

  const [, rawScheme, rawAuthority, rawSuffix] = absolute;
  const at = rawAuthority.lastIndexOf("@");
  const userInfo = at >= 0 ? rawAuthority.slice(0, at + 1) : "";
  const hostPort = at >= 0 ? rawAuthority.slice(at + 1) : rawAuthority;

  let hostname = hostPort;
  let port = "";
  if (hostPort.startsWith("[")) {
    const bracket = hostPort.indexOf("]");
    if (bracket >= 0) {
      hostname = hostPort.slice(0, bracket + 1);
      port = hostPort.slice(bracket + 1);
    }
  } else {
    const colon = hostPort.lastIndexOf(":");
    if (colon >= 0) {
      hostname = hostPort.slice(0, colon);
      port = hostPort.slice(colon);
    }
  }

  const hashAt = rawSuffix.indexOf("#");
  const beforeHash = hashAt >= 0 ? rawSuffix.slice(0, hashAt) : rawSuffix;
  const fragment = hashAt >= 0 ? rawSuffix.slice(hashAt) : "";
  const queryAt = beforeHash.indexOf("?");
  const path = queryAt >= 0 ? beforeHash.slice(0, queryAt) : beforeHash;
  const rawQuery = queryAt >= 0 ? beforeHash.slice(queryAt + 1) : null;
  const keptQuery = rawQuery
    ?.split("&")
    .filter((pair) => {
      if (pair === "") return false;
      const key = pair.split("=", 1)[0].toLowerCase();
      return !/^(utm_.*|fbclid|gclid)$/.test(key);
    });
  const query = keptQuery?.length ? `?${keptQuery.join("&")}` : "";

  return `${rawScheme.toLowerCase()}://${userInfo}${hostname.toLowerCase()}${port}${path}${query}${fragment}`;
}
