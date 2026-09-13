import { describe, expect, it } from "vitest";
import { sourceKey } from "../../src/lib/sourceKey";
import { safeHttpUrl } from "../../src/lib/url";

describe("sourceKey", () => {
  it.each([
    ["", ""],
    ["   ", ""],
    [
      "  HTTP://Example.COM/Path/File?A=One#Frag  ",
      "http://example.com/Path/File?A=One#Frag",
    ],
    [
      "https://Example.COM/P?UTM_Source=X&A=One&fbclid=Y&gClId=Z&B=Two#Frag",
      "https://example.com/P?A=One&B=Two#Frag",
    ],
    [
      "https://EXAMPLE.com/P/?utm_campaign=x&&FBCLID=y#F",
      "https://example.com/P/#F",
    ],
    [
      "https://Example.com/P?B=2&a=One&B=3&empty=",
      "https://example.com/P?B=2&a=One&B=3&empty=",
    ],
    [
      "HTTPS://User:Pass@Example.COM:8443/Path",
      "https://User:Pass@example.com:8443/Path",
    ],
    [
      "HTTPS://User:Pass@[2001:DB8::A]:8443/Path",
      "https://User:Pass@[2001:db8::a]:8443/Path",
    ],
    ["  Example.COM/Path?utm_source=x  ", "Example.COM/Path?utm_source=x"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(sourceKey(input)).toBe(expected);
  });

  it("keeps http and https as distinct source identities", () => {
    expect(sourceKey("http://Example.com/Path")).toBe(
      "http://example.com/Path",
    );
    expect(sourceKey("https://Example.com/Path")).toBe(
      "https://example.com/Path",
    );
    expect(sourceKey("http://Example.com/Path")).not.toBe(
      sourceKey("https://Example.com/Path"),
    );
  });

  it("preserves byte-sensitive path, query values, fragments, and trailing slash", () => {
    expect(sourceKey("https://EXAMPLE.com/Case/?q=Value#Section")).toBe(
      "https://example.com/Case/?q=Value#Section",
    );
    expect(sourceKey("https://example.com/case?q=value#section")).not.toBe(
      sourceKey("https://EXAMPLE.com/Case/?q=Value#Section"),
    );
  });
});

describe("safeHttpUrl", () => {
  it.each([
    ["https://example.com/path?q=1#fragment", "https://example.com/path?q=1#fragment"],
    ["  http://Example.com/Path  ", "http://Example.com/Path"],
    ["HTTPS://example.com", "HTTPS://example.com"],
    ["https://example.com:443/report", "https://example.com:443/report"],
    ["http://example.com:80/report", "http://example.com:80/report"],
    [
      "https://example.com/report?lang=fr%20FR",
      "https://example.com/report?lang=fr%20FR",
    ],
    [
      "https://example.com/report#section%202",
      "https://example.com/report#section%202",
    ],
  ])("accepts absolute http(s) URL %j", (input, expected) => {
    expect(safeHttpUrl(input)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "   ",
    "/relative/path",
    "//example.com/path",
    "https://",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "ftp://example.com/file",
    "mailto:user@example.com",
    "about:blank",
    "https://user@example.com/report",
    "https://user:pass@example.com/report",
    "https://example.com:8443/report",
    "http://example.com:8080/report",
    "https://example.com/report?access_token=secret",
    "https://example.com/report?api%5Fkey=secret",
    "https://example.com/report?%6cang=fr",
    "https://example.com/report?%74oken=secret",
    "https://example.com/report#access_token=secret",
    "https://example.com/report#%61ccess_token=secret",
    "https://example.com/report#section=2&api_key=secret",
    `https://example.com/${"a".repeat(2030)}`,
    "https://example.com/report name",
  ])("rejects unsafe or non-absolute input %j", (input) => {
    expect(safeHttpUrl(input)).toBeUndefined();
  });

  it("rejects scheme shorthand that is not an explicit absolute URL", () => {
    expect(safeHttpUrl("http:example.com")).toBeUndefined();
    expect(safeHttpUrl("https:example.com/path")).toBeUndefined();
  });
});
