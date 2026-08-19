import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadEnv } from "./env";

describe("database environment", () => {
  it("L: DATABASE_ENABLED=false does not require DATABASE_URL", () => {
    const parsed = loadEnv({ DATABASE_ENABLED: "false" } as NodeJS.ProcessEnv);
    assert.equal(parsed.DATABASE_ENABLED, false);
  });

  it("M: DATABASE_ENABLED=true without DATABASE_URL fails startup configuration", () => {
    assert.throws(() =>
      loadEnv({ DATABASE_ENABLED: "true" } as NodeJS.ProcessEnv),
    );
  });

  it("rejects a non-postgres URL when the database is enabled", () => {
    assert.throws(() =>
      loadEnv({
        DATABASE_ENABLED: "true",
        DATABASE_URL: "mysql://localhost/db",
      } as NodeJS.ProcessEnv),
    );
  });

  it("accepts DATABASE_ENABLED=true with a postgres URL", () => {
    const parsed = loadEnv({
      DATABASE_ENABLED: "true",
      DATABASE_URL: "postgresql://ava:ava@127.0.0.1:5432/productreviews",
    } as NodeJS.ProcessEnv);
    assert.equal(parsed.DATABASE_ENABLED, true);
    assert.equal(parsed.DATABASE_POOL_MAX, 10);
  });
});
