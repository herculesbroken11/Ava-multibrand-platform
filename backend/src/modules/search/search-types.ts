export type SearchIntent =
  | "none"
  | "current_price"
  | "availability"
  | "new_release"
  | "current_specification"
  | "recall_or_safety"
  | "promotion"
  | "current_product_recommendation"
  | "other_current_information";

export type RetrievalStatus = "not_needed" | "success" | "no_results" | "failed";

export type SearchContextSize = "low" | "medium" | "high";

export interface SearchUserLocation {
  country: string;
  timezone?: string;
  city?: string;
  region?: string;
}

export interface SearchRequest {
  query: string;
  intent: SearchIntent;
  maxResults: number;
  timeoutMs: number;
  contextSize: SearchContextSize;
  userLocation: SearchUserLocation;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedAt?: string;
  retrievedAt: string;
}

export interface SearchProvider {
  search(request: SearchRequest): Promise<SearchResult[]>;
}

export interface SearchDecision {
  intent: SearchIntent;
  shouldSearch: boolean;
  essential: boolean;
  location: SearchUserLocation;
  locationLabel: string;
}

export interface RetrievalBundle {
  status: RetrievalStatus;
  intent: SearchIntent;
  query?: string;
  results: SearchResult[];
  durationMs?: number;
}
