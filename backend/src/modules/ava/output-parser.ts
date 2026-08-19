import { z } from "zod";
import type { StructuredBlock } from "@product-reviews/contracts";

const comparisonTableSchema = z.object({
  caption: z.string().max(200).optional(),
  columns: z
    .array(
      z.object({
        key: z.string().min(1).max(64),
        label: z.string().min(1).max(80),
      }),
    )
    .min(1)
    .max(8),
  rows: z.array(z.record(z.string(), z.string().max(300))).min(1).max(8),
});

const structuredBlockSchema: z.ZodType<StructuredBlock> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), text: z.string().min(1).max(200) }),
  z.object({ type: z.literal("paragraph"), text: z.string().min(1).max(1200) }),
  z.object({
    type: z.literal("bullets"),
    items: z.array(z.string().min(1).max(400)).min(1).max(8),
  }),
  z.object({
    type: z.literal("numbered"),
    items: z.array(z.string().min(1).max(400)).min(1).max(8),
  }),
  z.object({
    type: z.literal("recommendation"),
    title: z.string().max(80).optional(),
    text: z.string().min(1).max(800),
  }),
  z.object({
    type: z.literal("advantages"),
    heading: z.string().max(80).optional(),
    items: z.array(z.string().min(1).max(400)).min(1).max(8),
  }),
  z.object({
    type: z.literal("limitations"),
    heading: z.string().max(80).optional(),
    items: z.array(z.string().min(1).max(400)).min(1).max(8),
  }),
  z.object({
    type: z.literal("considerations"),
    heading: z.string().max(80).optional(),
    items: z.array(z.string().min(1).max(400)).min(1).max(8),
  }),
  z.object({ type: z.literal("followUpPrompt"), text: z.string().min(1).max(300) }),
  z.object({ type: z.literal("comparison"), table: comparisonTableSchema }),
]);

export const avaModelOutputSchema = z.object({
  content: z.string().min(1).max(4000),
  structuredContent: z.array(structuredBlockSchema).max(12).optional(),
  followUps: z.array(z.string().min(1).max(160)).max(3).optional(),
  usedSourceIds: z.array(z.string().min(1).max(32)).max(8).optional(),
});

export type AvaModelOutput = z.infer<typeof avaModelOutputSchema>;

function stripUntrustedSourceFields(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = { ...(value as Record<string, unknown>) };
  delete record.sources;
  if (Array.isArray(record.structuredContent)) {
    record.structuredContent = record.structuredContent.filter(
      (block) =>
        !(block && typeof block === "object" && "type" in block && (block as { type: unknown }).type === "sources"),
    );
  }
  return record;
}

function stripModelSources(blocks?: StructuredBlock[]): StructuredBlock[] | undefined {
  if (!blocks) return undefined;
  const filtered = blocks.filter((block) => block.type !== "sources");
  return filtered.length > 0 ? filtered : undefined;
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

export function parseAvaModelOutput(raw: string): AvaModelOutput {
  const parsed = extractJsonObject(raw);
  if (parsed) {
    const result = avaModelOutputSchema.safeParse(stripUntrustedSourceFields(parsed));
    if (result.success) {
      return {
        content: result.data.content.trim(),
        structuredContent: stripModelSources(result.data.structuredContent),
        followUps: result.data.followUps?.slice(0, 3),
        usedSourceIds: result.data.usedSourceIds,
      };
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "content" in parsed &&
      typeof (parsed as { content: unknown }).content === "string"
    ) {
      const content = (parsed as { content: string }).content.trim();
      if (content) {
        return { content, followUps: [] };
      }
    }
  }

  const fallback = raw.replace(/```(?:json)?/gi, "").trim();
  if (fallback) {
    return { content: fallback.slice(0, 4000), followUps: [] };
  }

  throw new Error("empty_model_output");
}
