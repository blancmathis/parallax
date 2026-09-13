import { fetchPinnedSource } from "../source-fetch.ts";

Deno.serve(async () => {
  const [address] = await Deno.resolveDns("example.com", "A");
  const response = await fetchPinnedSource(
    new URL("https://example.com/"),
    address,
    new AbortController().signal,
  );
  return Response.json({
    address,
    status: response.status,
    byte_length: (await response.bytes()).byteLength,
  });
});
