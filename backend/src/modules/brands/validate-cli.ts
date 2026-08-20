import { validateBackendBrandRegistry } from "./schema";
import {
  resolveFrontendPublicDir,
  validateFrontendBrandRegistry,
} from "../../../../frontend/src/brands/schema";
import { registeredFrontendBrands } from "../../../../frontend/src/brands/registry";

const issues = [
  ...validateBackendBrandRegistry(),
  ...validateFrontendBrandRegistry(registeredFrontendBrands, {
    publicDir: resolveFrontendPublicDir(),
  }),
];

if (issues.length > 0) {
  console.error("Brand configuration is invalid:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Brand configuration is valid.");
