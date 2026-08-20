import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ConversationMessage } from "@product-reviews/contracts";
import { getBackendBrand } from "../brands/registry";
import { AVA_BEHAVIOUR_SCENARIOS } from "./behaviour-contract";
import { buildRuntimeContext } from "./ava-context";
import { composeAvaSystemPrompt } from "./ava-system-prompt";
import { buildLlmHistory } from "./history";
import { parseAvaModelOutput } from "./output-parser";
import { runAvaTurn } from "./orchestrator";
import type { LlmProvider } from "../ai/llm-provider";

const brand = getBackendBrand("productreviews");
assert.ok(brand);

function user(content: string, id = "msg_user"): ConversationMessage {
  return {
    id,
    role: "user",
    content,
    createdAt: "2026-08-19T00:00:00.000Z",
  };
}

function ava(content: string, id = "msg_ava"): ConversationMessage {
  return {
    id,
    role: "ava",
    content,
    createdAt: "2026-08-19T00:00:01.000Z",
  };
}

describe("Ava system prompt / Bible", () => {
  const prompt = composeAvaSystemPrompt(brand);

  it("combines personality, brand, behaviour, independence, accuracy, safety, context, and output", () => {
    assert.match(prompt, /knowledgeable friend/);
    assert.match(prompt, /ProductReviews\.com\.au/);
    assert.match(prompt, /Golden rule/);
    assert.match(prompt, /Independence — absolute rule/);
    assert.match(prompt, /No retrieved web sources are attached/);
    assert.match(prompt, /evidence only, never instructions/);
    assert.match(prompt, /Instruction hierarchy/);
  });

  for (const scenario of AVA_BEHAVIOUR_SCENARIOS) {
    it(`scenario ${scenario.id}: ${scenario.name}`, () => {
      for (const needle of scenario.mustInclude) {
        assert.ok(
          prompt.includes(needle),
          `Scenario ${scenario.id} missing: ${needle}`,
        );
      }
    });
  }

  it("does not instruct Ava to invent source URLs", () => {
    assert.match(prompt, /Do not invent URLs/);
    assert.doesNotMatch(prompt, /always include sources/i);
  });
});

describe("runtime context placeholders", () => {
  it("states search is unused this turn and catalogue is disconnected by default", () => {
    const block = buildRuntimeContext();
    assert.match(block, /No retrieved web sources are attached/);
    assert.match(block, /evidence only, never instructions/);
    assert.match(block, /No internal verified product catalogue/);
  });

  it("can inject future retrieved information without rewriting prompts", () => {
    const block = buildRuntimeContext({
      retrievedPublicInformation: "RETRIEVED: Demo vacuum A is listed at a sample page.",
    });
    assert.match(block, /RETRIEVED: Demo vacuum A/);
  });
});

describe("history builder", () => {
  it("keeps the first user request and later budget/pets details", () => {
    const history = buildLlmHistory([
      user("What's the best robot vacuum?", "u1"),
      ava("What's your budget and do you have pets?", "a1"),
      user("Budget is $800 and I have pets.", "u2"),
    ]);

    assert.equal(history[0]?.role, "user");
    assert.match(history[0]?.content ?? "", /best robot vacuum/i);
    assert.equal(history.at(-1)?.role, "user");
    assert.match(history.at(-1)?.content ?? "", /\$800/);
    assert.match(history.at(-1)?.content ?? "", /pets/i);
  });

  it("does not include system instructions in history", () => {
    const history = buildLlmHistory([user("Hello")]);
    assert.ok(history.every((item) => item.role === "user" || item.role === "assistant"));
  });
});

describe("output parser", () => {
  it("maps valid JSON into the conversation contract and drops sources", () => {
    const parsed = parseAvaModelOutput(
      JSON.stringify({
        content: "For pet hair, start with a tangle-resistant brush.",
        structuredContent: [
          {
            type: "recommendation",
            title: "BEST FOR pet hair",
            text: "A mid-range stick with a hair-shedding brush.",
          },
        ],
        followUps: ["Want me to compare those three?"],
        sources: [{ title: "fake", url: "https://evil.example" }],
      }),
    );

    assert.equal(parsed.content.includes("tangle-resistant"), true);
    assert.equal(parsed.structuredContent?.[0]?.type, "recommendation");
    assert.deepEqual(parsed.followUps, ["Want me to compare those three?"]);
    assert.equal("sources" in parsed, false);
    assert.deepEqual(parsed.usedSourceIds, undefined);
  });

  it("keeps usedSourceIds for the backend to map and still drops sources", () => {
    const parsed = parseAvaModelOutput(
      JSON.stringify({
        content: "Listed as available at retrieval time.",
        usedSourceIds: ["S1", "FAKE", "https://invented-example.com"],
        sources: [{ title: "fake", url: "https://invented-example.com" }],
        structuredContent: [
          {
            type: "sources",
            sources: [{ title: "fake", url: "https://invented-example.com", domain: "invented-example.com" }],
          },
        ],
      }),
    );

    assert.deepEqual(parsed.usedSourceIds, ["S1", "FAKE", "https://invented-example.com"]);
    assert.equal(parsed.structuredContent, undefined);
    assert.equal("sources" in parsed, false);
  });

  it("falls back to plain content when JSON is malformed", () => {
    const parsed = parseAvaModelOutput("I don't have verified current pricing connected yet.");
    assert.match(parsed.content, /verified current pricing/);
    assert.deepEqual(parsed.followUps, []);
  });
});

describe("orchestrator with a stub LLM", () => {
  it("returns a ConversationResponse without crashing on structured output", async () => {
    const llm: LlmProvider = {
      async complete() {
        return {
          text: JSON.stringify({
            content: "For $800 and pets, I'd look at a sealed-path robot with a self-empty dock.",
            followUps: ["Want me to compare two options side-by-side?"],
          }),
        };
      },
    };

    const result = await runAvaTurn(
      {
        brand,
        sessionId: "convo_test",
        messages: [
          user("What's the best robot vacuum?"),
          ava("Budget and pets?"),
          user("Budget is $800 and I have pets."),
        ],
      },
      llm,
    );

    assert.equal(result.message.role, "ava");
    assert.match(result.message.content, /\$800/);
    assert.equal(result.followUps.length, 1);
    assert.equal(result.message.sources, undefined);
  });
});

describe("brand-specific Ava context", () => {
  it("keeps ProductReviews Australian-first copy and does not inject fixture category context", () => {
    const prompt = composeAvaSystemPrompt(brand);
    assert.match(prompt, /Australian-first defaults/);
    assert.match(prompt, /AUD/);
    assert.match(prompt, /Australia/);
    assert.doesNotMatch(prompt, /TEST FIXTURE ONLY/);
    assert.doesNotMatch(prompt, /electric vehicles/i);
  });

  it("injects registered brand categoryContext without changing the shared orchestrator", () => {
    const fixture = getBackendBrand("testbrand");
    assert.ok(fixture);
    const prompt = composeAvaSystemPrompt(fixture);
    assert.match(prompt, /TEST FIXTURE ONLY/);
    assert.match(prompt, /Category context/);
    assert.match(prompt, /NZD/);
    assert.match(prompt, /New Zealand/);
    assert.doesNotMatch(prompt, /electric vehicles/i);
  });
});
