import { Modules } from "@medusajs/framework/utils"

export const INDEX_NAME = "products"

export async function getMeilisearchClient() {
  const host = process.env.MEILISEARCH_HOST
  const apiKey = process.env.MEILISEARCH_API_KEY
  if (!host || !apiKey) return null
  const { default: MeiliSearch } = await import("meilisearch")
  return new MeiliSearch({ host, apiKey })
}

function flattenMetadata(product: Record<string, unknown>) {
  const meta = (product.metadata ?? {}) as Record<string, unknown>
  return {
    bike_type_compatibility: (meta.bike_type_compatibility as string[]) ?? [],
    trip_type_suitability: (meta.trip_type_suitability as string[]) ?? [],
    mounting_type: (meta.mounting_type as string[]) ?? [],
    weight_grams: typeof meta.weight_grams === "number" ? meta.weight_grams : product.weight ?? 0,
    price_tier: meta.price_tier as string | null,
    editorial_rating: typeof meta.editorial_rating === "number" ? meta.editorial_rating : 5,
    durability_rating: typeof meta.durability_rating === "number" ? meta.durability_rating : null,
    kit_slots: (meta.kit_slots as string[]) ?? [],
  }
}

export function buildMeilisearchDocument(product: Record<string, unknown>) {
  const flat = flattenMetadata(product)
  return {
    id: product.id,
    title: product.title,
    description: product.description ?? "",
    handle: product.handle,
    thumbnail: product.thumbnail ?? null,
    status: product.status,
    weight: product.weight,
    metadata: product.metadata,
    // Flattened for faceted search
    bike_type_compatibility: flat.bike_type_compatibility,
    trip_type_suitability: flat.trip_type_suitability,
    mounting_type: flat.mounting_type,
    weight_grams: flat.weight_grams,
    price_tier: flat.price_tier,
    editorial_rating: flat.editorial_rating,
    durability_rating: flat.durability_rating,
    kit_slots: flat.kit_slots,
  }
}

export async function getProductFromContainer(
  container: { resolve: (key: string) => unknown },
  productId: string
): Promise<Record<string, unknown> | null> {
  const productService = container.resolve(Modules.PRODUCT) as {
    retrieveProduct?: (id: string) => Promise<Record<string, unknown>>
    retrieve?: (id: string) => Promise<Record<string, unknown>>
  }
  const retrieve = productService.retrieveProduct ?? productService.retrieve
  if (!retrieve) return null
  return retrieve.call(productService, productId) as Promise<Record<string, unknown> | null>
}
