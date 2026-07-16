// CANONICAL url normalizer. MUST stay byte-identical to SQL public.source_key():
//  trim; lowercase the whole string; http->https; strip #fragment; drop
//  utm_*/fbclid/gclid (rebuild query, no orphan separators); strip trailing slash.
// It is the join key between the source-integrity library and a rendered source.
export function sourceKey(rawUrl: string): string {
  let s = (rawUrl ?? "").trim().toLowerCase();
  if (s === "") return "";
  s = s.replace(/^http:\/\//, "https://");
  s = s.replace(/#.*$/, "");
  const q = s.indexOf("?");
  if (q >= 0) {
    const base = s.slice(0, q);
    const kept = s
      .slice(q + 1)
      .split("&")
      .filter(
        (kv) => kv !== "" && !/^(utm_.*|fbclid|gclid)$/.test(kv.split("=")[0]),
      );
    s = kept.length ? `${base}?${kept.join("&")}` : base;
  }
  s = s.replace(/\/+$/, "");
  return s;
}
