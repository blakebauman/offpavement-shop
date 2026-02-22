# Sanity Schemas

Schemas for editorial content (product briefs) displayed on PDPs.

## Setup

1. Create a Sanity project at [sanity.io/manage](https://sanity.io/manage)
2. Add `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` to `.env.local`
3. To add a Sanity Studio to this project: `pnpm create sanity@latest` in a new directory (e.g. `apps/sanity-studio`)
4. Copy the schemas from `src/sanity/schemas/` into your studio's schema config

## Schema: productBrief

Links to Medusa products via `medusa_product_id`. The PDP fetches editorial content with:

```groq
*[_type == "productBrief" && medusa_product_id == $id][0]
```
