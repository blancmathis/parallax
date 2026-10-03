import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(appRoot, "..");
const packageJson = JSON.parse(
  readFileSync(resolve(appRoot, "package.json"), "utf8"),
);

function githubRepository(value) {
  if (typeof value !== "string") return null;
  const match = value.match(
    /github\.com(?::|\/)([^/\s:#]+)\/([^/\s#]+)(?:[\s/#]|$)/i,
  );
  if (!match) return null;
  return `${match[1]}/${match[2].replace(/\.git$/i, "")}`;
}

const repositoryUrl =
  typeof packageJson.repository === "string"
    ? packageJson.repository
    : packageJson.repository?.url;
const expected = githubRepository(repositoryUrl);
const errors = [];

if (!expected) {
  errors.push("package.json repository must be a GitHub repository URL");
} else {
  const expectedUrls = {
    homepage: `https://github.com/${expected}#readme`,
    bugs: `https://github.com/${expected}/issues`,
  };
  if (packageJson.homepage !== expectedUrls.homepage) {
    errors.push(`package.json homepage must be ${expectedUrls.homepage}`);
  }
  if (packageJson.bugs?.url !== expectedUrls.bugs) {
    errors.push(`package.json bugs.url must be ${expectedUrls.bugs}`);
  }

  for (const relativePath of ["README.md", "SECURITY.md"]) {
    const contents = readFileSync(resolve(repositoryRoot, relativePath), "utf8");
    const references = [
      ...contents.matchAll(
        /https:\/\/github\.com\/[^/\s)]+\/parallax(?:\.git)?(?:[\s/#)]|$)/gi,
      ),
    ].map((match) => githubRepository(match[0]));
    if (references.length === 0) {
      errors.push(`${relativePath} must contain a Parallax GitHub repository URL`);
    }
    for (const reference of references) {
      if (reference !== expected) {
        errors.push(`${relativePath} points to ${reference}, expected ${expected}`);
      }
    }
  }

  const githubRepositoryEnv = process.env.GITHUB_REPOSITORY;
  if (githubRepositoryEnv && githubRepositoryEnv !== expected) {
    errors.push(
      `GITHUB_REPOSITORY is ${githubRepositoryEnv}, expected ${expected}`,
    );
  }

  let origin = "";
  try {
    origin = execFileSync(
      "git",
      ["config", "--get", "remote.origin.url"],
      { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    // Source archives and some CI checkouts intentionally have no Git remote.
  }
  const originRepository = githubRepository(origin);
  if (origin && originRepository !== expected) {
    errors.push(`origin points to ${originRepository ?? origin}, expected ${expected}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[repository-metadata] ${error}`);
  process.exitCode = 1;
} else {
  console.log(`[repository-metadata] package, docs, and available checkout metadata agree on ${expected}`);
}
