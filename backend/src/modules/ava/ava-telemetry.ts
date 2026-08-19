export interface AvaTurnTelemetry {
  aiProvider: string;
  aiModel: string | null;
  searchUsed: boolean;
  searchIntent: string | null;
  searchStatus: string | null;
  searchProvider: string | null;
  searchResultCount: number;
}
