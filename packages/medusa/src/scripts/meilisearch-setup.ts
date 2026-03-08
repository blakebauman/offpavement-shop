/**
 * Configure Meilisearch index settings for product search.
 * Run after seed: pnpm exec medusa exec ./src/scripts/meilisearch-setup.ts
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { getMeilisearchClient, INDEX_NAME, buildMeilisearchDocument } from "../lib/meilisearch-utils"

export default async function meilisearchSetup({ container }: ExecArgs) {
  const client = await getMeilisearchClient()
  if (!client) {
    console.log("Meilisearch not configured (MEILISEARCH_HOST/API_KEY missing). Skipping.")
    return
  }

  const index = client.index(INDEX_NAME)

  await index.updateFilterableAttributes([
    "price_tier",
    "bike_type_compatibility",
    "trip_type_suitability",
    "mounting_type",
    "weight_grams",
    "editorial_rating",
    "kit_slots",
  ])

  await index.updateSortableAttributes(["weight_grams", "editorial_rating"])

  console.log("[Meilisearch] Index settings updated.")

  // Optionally re-index all products
  const productService = container.resolve(Modules.PRODUCT)
  const result = await (productService as { listProducts: (filters: object, options?: object) => Promise<unknown> }).listProducts(
    { status: "published" },
    { take: 1000 }
  )
  const products = (Array.isArray(result) ? result : (result as { products?: unknown[] })?.products ?? []) as Record<string, unknown>[]
  if (products.length > 0) {
    const documents = products.map((p) => buildMeilisearchDocument(p as Record<string, unknown>))
    await index.addDocuments(documents)
    console.log(`[Meilisearch] Re-indexed ${documents.length} products.`)
  }
}
