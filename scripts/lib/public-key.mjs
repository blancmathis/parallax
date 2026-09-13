import { pathToFileURL } from "node:url";

export function validateBrowserPublicKey(publicKey, label = "public key") {
  if (typeof publicKey !== "string" || publicKey.length < 20 || /\s/.test(publicKey)) {
    throw new Error(`${label} is not a plausible single-line browser-safe key`);
  }

  if (publicKey.startsWith("sb_publishable_")) {
    return publicKey;
  }
  if (publicKey.startsWith("sb_")) {
    throw new Error(`${label} contains a Supabase secret or unsupported key type`);
  }

  const jwtParts = publicKey.split(".");
  if (
    jwtParts.length !== 3 ||
    jwtParts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))
  ) {
    throw new Error(
      `${label} must be an sb_publishable_ key or a legacy Supabase anon JWT`,
    );
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(jwtParts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error(`${label} looks like a JWT but its payload is invalid`);
  }
  if (payload?.role !== "anon") {
    throw new Error(`${label} JWT must carry only the anon role`);
  }

  return publicKey;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateBrowserPublicKey(
      process.env.PARALLAX_PUBLIC_KEY_TO_VALIDATE,
      process.env.PARALLAX_PUBLIC_KEY_LABEL || "public key",
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
