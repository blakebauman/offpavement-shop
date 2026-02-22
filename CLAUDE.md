# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Off-Pavement Shop is a bikepacking e-commerce platform built on Medusa v2 with a Kit Builder feature that recommends gear based on bike profile, trip type, and rider preferences.

## Commands

### Development
```bash
pnpm docker:up           # Start Postgres, Redis, Meilisearch, MinIO
pnpm dev                 # Run Medusa backend + Next.js storefront
pnpm dev:medusa          # Run Medusa only (localhost:9000)
pnpm dev:storefront      # Run storefront only (localhost:8000)
```

### Database
```bash
pnpm db:generate <module_name>   # Generate migrations for a module
pnpm db:migrate                  # Run migrations
pnpm db:sync-links               # Sync module links (required after adding products)
pnpm seed                        # Seed demo data
```

### Testing (in packages/medusa)
```bash
pnpm test:integration:http       # HTTP API integration tests
pnpm test:integration:modules    # Module integration tests (src/modules/*/__tests__)
pnpm test:unit                   # Unit tests (*/__tests__/**/*.unit.spec.ts)
```

### Build
```bash
pnpm build     # Build all packages
```

## Architecture

### Monorepo Structure
- `packages/medusa/` - Medusa v2 backend with custom modules
- `apps/storefront/` - Next.js 15 storefront (React 19, Tailwind, Sanity CMS integration)
- `apps/admin/` - Admin panel extensions (i18n only currently)

### Custom Medusa Modules

**ProductEditorial** (`packages/medusa/src/modules/product-editorial`)
- Stores curated editorial metadata: tester info, ratings, compatibility rules
- Links to core Product via `src/links/product-editorial.ts`
- Fields: `tester_name`, `test_duration_days`, `editorial_brief`, `verdict`, `price_tier`, `weight_grams`, `compatibility_rules`, etc.

**KitBuilder** (`packages/medusa/src/modules/kit-builder`)
- Recommendation engine for bikepacking gear kits
- Key concepts:
  - `BikeProfile`: bar_type, wheel_size, suspension, frame_size, saddle_rail_type, etc.
  - `TripProfile`: duration (overnight/weekend/multi_day/expedition), terrain, resupply
  - `RiderPreferences`: weight_vs_durability, budget_tier, existing_gear
  - `KIT_SLOTS`: gear categories with required/optional status per trip duration
- Generates recommendations per slot via `generateRecommendations()` method
- Saved kits have shareable tokens via `share_token`

### Kit Builder API Routes
- `POST /store/kit-builder/recommendations` - Get personalized gear recommendations
- `POST /store/kit-builder/save` - Save a kit configuration
- `GET /store/kit-builder/:shareToken` - Load shared kit

### Storefront Structure
- Next.js App Router with `[countryCode]` dynamic segment
- Route groups: `(main)` for standard pages, `(checkout)` for checkout flow
- Kit builder UI: `apps/storefront/src/modules/kit-builder/`
- Sanity integration for editorial PDP content (`src/sanity/`, `src/lib/sanity.ts`)

## Environment Variables

Copy `.env.example` to `.env` (medusa) and `apps/storefront/.env.template` to `.env.local`:
- `DATABASE_URL` - Postgres connection (local: `postgres://postgres:postgres@localhost:5432/offpavement_store`)
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` - Required for storefront API access
- `SANITY_PROJECT_ID`, `SANITY_DATASET` - Optional Sanity CMS integration

## Adding New Modules

1. Create module under `packages/medusa/src/modules/<name>/`
2. Define models in `models/`, service in `service.ts`, export from `index.ts`
3. Register in `packages/medusa/medusa-config.ts`
4. Generate migrations: `pnpm db:generate <module_name>`
5. Run migrations: `pnpm db:migrate`
6. If linking to Product, add link definition in `src/links/` and run `pnpm db:sync-links`
