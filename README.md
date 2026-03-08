# Off-Pavement Shop

Curated bikepacking e-commerce platform built on Medusa v2 with Kit Builder and editorial product metadata.

## Quick Start

1. **Start infrastructure** (requires Docker Desktop running):

   ```bash
   pnpm docker:up
   ```

2. **Install dependencies** (if not already done):

   ```bash
   pnpm install
   ```

3. **Run migrations** (first time only):

   ```bash
   pnpm db:generate product_editorial kit_builder
   pnpm db:migrate
   pnpm db:sync-links
   ```

4. **Seed demo data** (optional):

   ```bash
   pnpm seed
   pnpm --filter @offpavement/medusa exec medusa user -e admin@example.com -p supersecret
   ```

5. **Start development**:

   ```bash
   pnpm dev
   ```

   - Medusa backend: http://localhost:9000
   - Medusa admin: http://localhost:9000/app
   - Storefront: http://localhost:8000
   - Kit builder: http://localhost:8000/us/kit-builder

## Project Structure

```
offpavement-shop/
├── apps/
│   ├── storefront/    # Next.js storefront + kit builder
│   └── admin/         # Admin extensions (see packages/medusa/src/admin)
├── packages/
│   └── medusa/        # Medusa backend + ProductEditorial, Kit Builder modules
├── docker-compose.yml # Postgres, Redis, Meilisearch, MinIO
└── pnpm-workspace.yaml
```

## Scripts

- `pnpm docker:up` — Start Docker services
- `pnpm docker:down` — Stop Docker services
- `pnpm docker:build` — Build Medusa Docker image (run from repo root)
- `pnpm docker:clean` — Stop services and remove volumes
- `pnpm dev` — Run Medusa + storefront
- `pnpm dev:medusa` — Run Medusa only
- `pnpm dev:storefront` — Run storefront only
- `pnpm db:migrate` — Run database migrations

## Next Steps

- **Sanity**: Set `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `apps/storefront/.env.local` for editorial PDP content. Add the `productBrief` schema to your Sanity Studio.
- **Product metadata**: Add `weight_grams`, `kit_slots`, `price_tier`, etc. to product `metadata` in Medusa Admin for kit builder recommendations.
- **ProductEditorial links**: Run `npx medusa db:sync-links` after adding products to link them to editorial records.
