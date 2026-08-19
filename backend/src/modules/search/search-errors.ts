export class SearchProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchProviderError";
  }
}
