import { API_ERROR_CODES } from "@product-reviews/contracts";
import {
  originHostname,
  resolveBrandByHost,
} from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import { isAllowedFrontendOrigin } from "./origins";

export function assertBrandMatchesOrigin(
  brandId: string,
  origin: string | undefined,
): void {
  if (!origin) return;

  if (!isAllowedFrontendOrigin(origin)) {
    throw new AppError(
      400,
      API_ERROR_CODES.BRAND_ORIGIN_MISMATCH,
      "That brand is not available.",
    );
  }

  const host = originHostname(origin);
  if (!host) {
    throw new AppError(
      400,
      API_ERROR_CODES.BRAND_ORIGIN_MISMATCH,
      "That brand is not available.",
    );
  }

  const resolved = resolveBrandByHost(host, {
    nodeEnv: env.NODE_ENV,
    defaultDevBrand: env.DEFAULT_DEV_BRAND,
  });

  if (!resolved || resolved.id !== brandId) {
    throw new AppError(
      400,
      API_ERROR_CODES.BRAND_ORIGIN_MISMATCH,
      "That brand is not available.",
    );
  }
}
