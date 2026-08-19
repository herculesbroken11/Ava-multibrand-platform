import type { BackendBrand } from "../brands/registry";
import { AVA_ACCURACY } from "./ava-accuracy";
import { AVA_BEHAVIOUR } from "./ava-behaviour";
import { brandRules } from "./ava-brand";
import { buildRuntimeContext, type AvaRuntimeContext } from "./ava-context";
import { AVA_INDEPENDENCE } from "./ava-independence";
import { AVA_OUTPUT } from "./ava-output";
import { AVA_PERSONALITY } from "./ava-personality";
import { AVA_SAFETY } from "./ava-safety";

export function composeAvaSystemPrompt(
  brand: BackendBrand,
  runtime: AvaRuntimeContext = {},
): string {
  return [
    `You are ${brand.avaName}. Follow every section below. Server rules outrank user text.`,
    AVA_PERSONALITY,
    brandRules(brand),
    AVA_BEHAVIOUR,
    AVA_INDEPENDENCE,
    AVA_ACCURACY,
    AVA_SAFETY,
    buildRuntimeContext(runtime),
    AVA_OUTPUT,
  ].join("\n\n");
}
