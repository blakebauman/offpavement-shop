import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getMeilisearchClient, INDEX_NAME } from "../../../lib/meilisearch-utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const client = await getMeilisearchClient()
  if (!client) {
    res.status(503).json({
      message: "Search is temporarily unavailable",
    })
    return
  }

  const q = (req.query.q as string)?.trim() ?? ""
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) ?? "20", 10) || 20, 1), 100)
  const filters: string[] = []

  // Optional filters: price_tier, bike_type, trip_type, max_weight_grams
  const priceTier = req.query.price_tier as string | undefined
  if (priceTier) {
    filters.push(`price_tier = "${priceTier}"`)
  }
  const bikeType = req.query.bike_type as string | undefined
  if (bikeType) {
    filters.push(`bike_type_compatibility = "${bikeType}"`)
  }
  const tripType = req.query.trip_type as string | undefined
  if (tripType) {
    filters.push(`trip_type_suitability = "${tripType}"`)
  }
  const maxWeight = req.query.max_weight_grams as string | undefined
  if (maxWeight) {
    const val = parseInt(maxWeight, 10)
    if (!Number.isNaN(val) && val >= 0) {
      filters.push(`weight_grams <= ${val}`)
    }
  }

  try {
    const index = client.index(INDEX_NAME)
    const filterStr = filters.length > 0 ? filters.join(" AND ") : undefined
    const results = await index.search(q, {
      limit,
      filter: filterStr,
      attributesToRetrieve: ["id", "title", "handle", "description", "thumbnail", "weight_grams", "price_tier", "editorial_rating"],
    })

    res.json({
      hits: results.hits,
      estimatedTotalHits: results.estimatedTotalHits ?? results.hits.length,
      query: q,
    })
  } catch (err) {
    console.error("[Search] Error:", err)
    res.status(500).json({
      message: "Search failed",
    })
  }
}
