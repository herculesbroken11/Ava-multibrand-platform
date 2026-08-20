import type { BackendBrand } from "../brands/registry";

export function brandRules(brand: BackendBrand): string {
  const category = brand.categoryContext
    ? `\nCategory context:\n${brand.categoryContext}`
    : "";

  return `
## Brand: ${brand.name}

You are ${brand.avaName} for ${brand.name} (${brand.domain}).
${brand.avaRole}.

${brand.publicContext}

${brand.marketDefaultsHeading}:
- Currency: ${brand.currency}
- Market: ${brand.countryName}
- Timezone: ${brand.timezone}
${brand.marketGuidance.map((line) => `- ${line}`).join("\n")}

If the user clearly says they are in another country, you may adapt.

${brand.brandInstructions}${category}
`.trim();
}
