import { strict as assert } from "node:assert";
import { test } from "node:test";

test("capture-source keeps gateway JWT verification enabled", async () => {
  const config = await Deno.readTextFile(
    new URL("../../../config.toml", import.meta.url),
  );
  const marker = "[functions.capture-source]";
  const start = config.indexOf(marker);
  assert.notEqual(start, -1, "capture-source must have an explicit section");
  const remainder = config.slice(start + marker.length);
  const nextSection = remainder.search(/^\[/m);
  const section = nextSection === -1
    ? remainder
    : remainder.slice(0, nextSection);
  assert.match(section, /^verify_jwt\s*=\s*true\s*$/m);
});
