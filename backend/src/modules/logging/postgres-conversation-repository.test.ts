import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { getBackendBrand } from "../brands/registry";
import { applyMigrations } from "../database/migrate";
import { PostgresConversationRepository } from "./postgres-conversation-repository";
import type { SuccessfulTurnLog } from "./logging-types";

const { Pool } = pg;
const resolvedBrand = getBackendBrand("productreviews");
assert.ok(resolvedBrand);
const brand = resolvedBrand;

const PORT = 55_432;
const USER = "ava";
const PASSWORD = "ava";
const DATABASE = "productreviews_test";

function successLog(overrides: Partial<SuccessfulTurnLog> = {}): SuccessfulTurnLog {
  return {
    clientSessionId: "convo_pg",
    brand,
    userMessage: "What's the best robot vacuum?",
    avaResponse: "What's your budget, and do you have pets?",
    structuredResponse: undefined,
    sources: undefined,
    aiProvider: "openai",
    aiModel: "gpt-4o-mini",
    responseDurationMs: 42,
    searchUsed: false,
    searchIntent: "none",
    searchStatus: "not_needed",
    searchProvider: null,
    searchResultCount: 0,
    ...overrides,
  };
}

describe("postgres conversation repository", { timeout: 180_000 }, () => {
  let embedded: EmbeddedPostgres | undefined;
  let pool: pg.Pool | undefined;
  let repo: PostgresConversationRepository;
  let dataDir: string | undefined;

  before(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "ava-pg-"));
    embedded = new EmbeddedPostgres({
      databaseDir: dataDir,
      user: USER,
      password: PASSWORD,
      port: PORT,
      persistent: false,
      onLog: () => undefined,
    });
    await embedded.initialise();
    await embedded.start();
    await embedded.createDatabase(DATABASE);
    pool = new Pool({
      connectionString: `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}`,
      max: 8,
      connectionTimeoutMillis: 5_000,
    });
    await applyMigrations(pool);
    repo = new PostgresConversationRepository(pool);
  });

  function db(): pg.Pool {
    assert.ok(pool);
    return pool;
  }

  after(async () => {
    await pool?.end();
    await embedded?.stop();
    if (dataDir) {
      await rm(dataDir, { recursive: true, force: true });
    }
  });

  it("P: migration creates the required schema", async () => {
    const applied = await applyMigrations(db());
    assert.deepEqual(applied, []);

    const tables = await db().query<{ table_name: string }>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('conversation_sessions', 'conversation_turns', 'schema_migrations')
      `,
    );
    assert.deepEqual(
      tables.rows.map((row) => row.table_name).sort(),
      ["conversation_sessions", "conversation_turns", "schema_migrations"],
    );

    const rerun = await applyMigrations(db());
    assert.deepEqual(rerun, []);
  });

  it("O: schema has no identity/profile/IP fields", async () => {
    const columns = await db().query<{ column_name: string }>(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('conversation_sessions', 'conversation_turns')
      `,
    );
    const names = columns.rows.map((row) => row.column_name);
    const forbidden = [
      "name",
      "email",
      "phone",
      "account_id",
      "user_profile",
      "advertising_id",
      "fingerprint",
      "payment_information",
      "ip",
      "ip_address",
      "user_id",
      "customer_id",
      "device_id",
    ];
    for (const name of forbidden) {
      assert.equal(names.includes(name), false, `unexpected column ${name}`);
    }
  });

  it("A: first successful question creates one session and turn 1", async () => {
    const recorded = await repo.recordSuccessfulTurn(
      successLog({ clientSessionId: "convo_a" }),
    );
    assert.equal(recorded.turn.turnNumber, 1);
    assert.equal(recorded.session.turnCount, 1);
    assert.equal(recorded.session.domain, "productreviews.com.au");
  });

  it("B/C: later turns reuse the session and increment follow_up_count", async () => {
    await repo.recordSuccessfulTurn(successLog({ clientSessionId: "convo_bc", userMessage: "First" }));
    const second = await repo.recordSuccessfulTurn(
      successLog({ clientSessionId: "convo_bc", userMessage: "Second" }),
    );
    assert.equal(second.turn.turnNumber, 2);
    assert.equal(second.session.turnCount, 2);
    assert.equal(second.session.followUpCount, 1);
  });

  it("D: a different client session creates a different row", async () => {
    const first = await repo.recordSuccessfulTurn(successLog({ clientSessionId: "convo_d1" }));
    const second = await repo.recordSuccessfulTurn(successLog({ clientSessionId: "convo_d2" }));
    assert.notEqual(first.session.id, second.session.id);
  });

  it("E: different brand IDs do not collide", async () => {
    const other = { ...brand, id: "otherbrand", domain: "other.example" };
    const first = await repo.recordSuccessfulTurn(successLog({ clientSessionId: "shared" }));
    const second = await repo.recordSuccessfulTurn(
      successLog({ clientSessionId: "shared", brand: other }),
    );
    assert.notEqual(first.session.id, second.session.id);
    assert.equal(second.session.domain, "other.example");
  });

  it("F: stores provider, model, and duration", async () => {
    const recorded = await repo.recordSuccessfulTurn(successLog({ clientSessionId: "convo_f" }));
    assert.equal(recorded.turn.aiProvider, "openai");
    assert.equal(recorded.turn.aiModel, "gpt-4o-mini");
    assert.equal(recorded.turn.responseDurationMs, 42);
  });

  it("G: stores search metadata and validated sources", async () => {
    const recorded = await repo.recordSuccessfulTurn(
      successLog({
        clientSessionId: "convo_g",
        searchUsed: true,
        searchIntent: "current_price",
        searchStatus: "success",
        searchProvider: "openai",
        searchResultCount: 1,
        sources: [
          {
            title: "Harvey Norman listing",
            domain: "harveynorman.com.au",
            url: "https://www.harveynorman.com.au/example-dyson",
          },
        ],
      }),
    );
    assert.equal(recorded.turn.searchUsed, true);
    assert.equal(recorded.turn.searchIntent, "current_price");
    assert.equal(recorded.turn.searchResultCount, 1);
    const sources = recorded.turn.sources as Array<{ url: string }>;
    assert.equal(sources[0]?.url, "https://www.harveynorman.com.au/example-dyson");
  });

  it("H: does not store a model-invented URL that was not in validated sources", async () => {
    const recorded = await repo.recordSuccessfulTurn(
      successLog({
        clientSessionId: "convo_h",
        sources: [
          {
            title: "Trusted",
            domain: "dyson.com.au",
            url: "https://www.dyson.com.au/vacuum-cleaners",
          },
        ],
      }),
    );
    assert.equal(JSON.stringify(recorded.turn.sources).includes("invented-example.com"), false);
  });

  it("I: failed turns store a safe error_code without an Ava response", async () => {
    const recorded = await repo.recordFailedTurn({
      clientSessionId: "convo_i",
      brand,
      userMessage: "How much is it today?",
      aiProvider: "openai",
      aiModel: "gpt-4o-mini",
      responseDurationMs: 20,
      errorCode: "PROVIDER_TIMEOUT",
      searchUsed: false,
      searchIntent: null,
      searchStatus: null,
      searchProvider: null,
      searchResultCount: 0,
    });
    assert.equal(recorded.turn.requestStatus, "failed");
    assert.equal(recorded.turn.errorCode, "PROVIDER_TIMEOUT");
    assert.equal(recorded.turn.avaResponse, null);
  });

  it("N: concurrent turns cannot produce duplicate turn numbers", async () => {
    const sessionId = "convo_n";
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        repo.recordSuccessfulTurn(
          successLog({ clientSessionId: sessionId, userMessage: `Question ${index}` }),
        ),
      ),
    );
    const numbers = results.map((item) => item.turn.turnNumber).sort((a, b) => a - b);
    assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8]);
    const counts = new Set(results.map((item) => item.session.id));
    assert.equal(counts.size, 1);
  });
});
