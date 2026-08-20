import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "openai-sk", pattern: /\bsk-[A-Za-z0-9_-]{16,}\b/ },
  { name: "private-key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

function isExampleEnv(path: string): boolean {
  return path.endsWith(".env.example") || path.endsWith(".env.production.example");
}

function gitRoot(): string {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
}

function trackedFiles(): string[] {
  const root = gitRoot();
  const output = execFileSync("git", ["ls-files", "-z"], {
    encoding: "utf8",
    cwd: root,
  });
  return output.split("\0").filter(Boolean).map((file) => `${root}/${file.replaceAll("\\", "/")}`);
}

describe("repository hygiene and secret scan", () => {
  it("does not track build output, dependencies, env secrets, or local database files", () => {
    const files = trackedFiles();
    const blocked = files.filter((file) => {
      const relative = file.replace(/\\/g, "/");
      return (
        relative.includes("/node_modules/") ||
        relative.includes("/.next/") ||
        relative.includes("/.embedded-postgres/") ||
        /(^|\/)\.env$/.test(relative) ||
        /(^|\/)\.env\.local$/.test(relative) ||
        /(^|\/)\.env\.production$/.test(relative)
      );
    });
    assert.deepEqual(blocked, []);
  });

  it("does not commit live secret values in tracked files", () => {
    const files = trackedFiles().filter((file) => {
      const relative = file.replace(/\\/g, "/");
      return (
        !relative.includes("/docs/") &&
        !relative.endsWith(".md") &&
        !relative.includes("/frontend/public/") &&
        !/\.(png|jpg|jpeg|webp|ico|woff2?|map)$/i.test(relative) &&
        !relative.endsWith("secret-scan.test.ts")
      );
    });
    const hits: string[] = [];

    for (const file of files) {
      let text = "";
      try {
        text = readFileSync(file, "utf8");
      } catch {
        continue;
      }

      for (const item of SECRET_PATTERNS) {
        if (item.pattern.test(text)) {
          hits.push(`${file} (${item.name})`);
        }
      }

      if (isExampleEnv(file)) continue;

      const assignedKey = text.match(/^\s*AI_API_KEY\s*=\s*(\S+)/m);
      if (assignedKey?.[1] && !/^(REPLACE_|your-|changeme)/i.test(assignedKey[1])) {
        hits.push(`${file} (AI_API_KEY)`);
      }
    }

    assert.deepEqual(hits, []);
  });
});
