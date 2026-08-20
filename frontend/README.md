# ProductReviews.com.au frontend

Next.js 16 UI for the ProductReviews workspace. Run from the repository root:

```bash
npm install
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000). Brand content lives in `src/brands/`. Shared UI lives in `src/components/`.

Legal and contact routes (`/privacy`, `/terms`, `/disclaimer`, `/contact`) render structured blocks from `BrandConfig.pages`. They do not hard-code ProductReviews policy text.

Local API: `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`. Production must use HTTPS; see `/.env.production.example` and the root README.
