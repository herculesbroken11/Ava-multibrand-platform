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

describe("rate limit and concurrency environment", () => {
  it("defaults rate limiting on with a 30-request minute window", () => {
    const parsed = loadEnv({} as NodeJS.ProcessEnv);
    assert.equal(parsed.RATE_LIMIT_ENABLED, true);
    assert.equal(parsed.RATE_LIMIT_MAX, 30);
    assert.equal(parsed.RATE_LIMIT_WINDOW_MS, 60_000);
    assert.equal(parsed.TRUST_PROXY, false);
    assert.equal(parsed.AI_MAX_CONCURRENT_REQUESTS, 4);
    assert.equal(parsed.SEARCH_MAX_CONCURRENT_REQUESTS, 4);
  });

  it("accepts RATE_LIMIT_ENABLED=false", () => {
    const parsed = loadEnv({ RATE_LIMIT_ENABLED: "false" } as NodeJS.ProcessEnv);
    assert.equal(parsed.RATE_LIMIT_ENABLED, false);
  });

  it("rejects invalid concurrency bounds", () => {
    assert.throws(() =>
      loadEnv({ AI_MAX_CONCURRENT_REQUESTS: "0" } as NodeJS.ProcessEnv),
    );
    assert.throws(() =>
      loadEnv({ SEARCH_MAX_CONCURRENT_REQUESTS: "99" } as NodeJS.ProcessEnv),
    );
  });
});
