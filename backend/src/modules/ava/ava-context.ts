import { RETRIEVED_EVIDENCE_NOTICE } from "../search/search-context";

export interface AvaRuntimeContext {
  retrievedPublicInformation?: string;
  verifiedProductData?: string;
}

export function buildRuntimeContext(context: AvaRuntimeContext = {}): string {
  const retrieved = context.retrievedPublicInformation?.trim();
  const catalogue = context.verifiedProductData?.trim();

  return `
## Runtime context from the server

### Retrieved public information
${RETRIEVED_EVIDENCE_NOTICE}
${
  retrieved
    ? retrieved
    : "NONE. No retrieved web sources are attached to this turn. Do not invent current prices, stock, promotions, recalls, newly released models, or URLs."
}

### Verified product database
${
  catalogue
    ? catalogue
    : "NONE. No internal verified product catalogue is connected. Do not invent a private product database."
}
`.trim();
}
