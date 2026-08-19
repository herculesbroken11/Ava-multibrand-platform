import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { API_ERROR_CODES } from "@product-reviews/contracts";
import { AppError } from "./errors/app-error";
import { createConcurrencyGate } from "./concurrency";

describe("concurrency gate", () => {
  it("runs work under the max", async () => {
    const gate = createConcurrencyGate(2);
    const result = await gate.run(async () => "ok");
    assert.equal(result, "ok");
    assert.equal(gate.active, 0);
  });

  it("rejects immediately when at capacity", async () => {
    const gate = createConcurrencyGate(1);
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });

    const first = gate.run(() => blocked);
    await assert.rejects(
      () => gate.run(async () => "nope"),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 429 &&
        error.code === API_ERROR_CODES.CAPACITY_LIMITED,
    );

    release();
    await first;
    assert.equal(gate.active, 0);
  });

  it("releases the slot after failure", async () => {
    const gate = createConcurrencyGate(1);
    await assert.rejects(() =>
      gate.run(async () => {
        throw new Error("provider failed");
      }),
    );
    const result = await gate.run(async () => "recovered");
    assert.equal(result, "recovered");
  });
});
