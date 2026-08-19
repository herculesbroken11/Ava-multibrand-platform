export interface BackendBrand {
  id: string;
  name: string;
  avaName: string;
  avaRole: string;
  domain: string;
  market: "AU";
  currency: "AUD";
}

const brands: Record<string, BackendBrand> = {
  productreviews: {
    id: "productreviews",
    name: "ProductReviews.com.au",
    avaName: "Ava",
    avaRole: "Independent product research assistant",
    domain: "productreviews.com.au",
    market: "AU",
    currency: "AUD",
  },
};

export function getBackendBrand(id: string): BackendBrand | undefined {
  return brands[id];
}

export function listBackendBrandIds(): string[] {
  return Object.keys(brands);
}
