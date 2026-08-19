# ProductReviews.com.au

Phase 1 workspace for a configurable multi-brand product-advice platform.

```
frontend/   Next.js UI (localhost:3000)
backend/    Fastify API (localhost:4000)
shared/     Serializable API contracts
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API health check is [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health).

Copy `frontend/.env.example` and `backend/.env.example` if you need to override defaults. Brand content lives in `frontend/src/brands/`. Shared UI lives in `frontend/src/components/`.
