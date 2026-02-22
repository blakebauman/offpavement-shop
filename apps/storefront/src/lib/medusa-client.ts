const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
  process.env.MEDUSA_BACKEND_URL ??
  "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "pk_test"

export async function fetchKitBuilderRecommendations(body: {
  bikeProfile: unknown
  tripProfile: unknown
  preferences: unknown
}) {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/kit-builder/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to fetch recommendations")
  return res.json()
}

export async function saveKit(body: {
  bike_profile: unknown
  trip_profile: unknown
  preferences: unknown
  slots: unknown
  total_weight_grams: number
  total_cost: number
}) {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/kit-builder/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
    },
    credentials: "include",
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to save kit")
  return res.json()
}

export async function searchProducts(params: {
  q: string
  limit?: number
  price_tier?: string
  bike_type?: string
  trip_type?: string
  max_weight_grams?: number
}) {
  const searchParams = new URLSearchParams()
  searchParams.set("q", params.q)
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.price_tier) searchParams.set("price_tier", params.price_tier)
  if (params.bike_type) searchParams.set("bike_type", params.bike_type)
  if (params.trip_type) searchParams.set("trip_type", params.trip_type)
  if (params.max_weight_grams != null) searchParams.set("max_weight_grams", String(params.max_weight_grams))

  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/search?${searchParams.toString()}`,
    {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
    }
  )
  if (!res.ok) throw new Error("Search failed")
  return res.json() as Promise<{
    hits: Array<{
      id: string
      title: string
      handle: string
      description?: string
      thumbnail?: string | null
      weight_grams?: number
      price_tier?: string | null
      editorial_rating?: number
    }>
    estimatedTotalHits: number
    query: string
  }>
}

export async function fetchSavedKits() {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/kit-builder`, {
    headers: {
      "x-publishable-api-key": PUBLISHABLE_KEY,
    },
    credentials: "include",
  })
  if (!res.ok) return { kits: [] }
  const data = await res.json()
  return { kits: data.kits ?? [] }
}

export async function fetchKitByShareToken(shareToken: string) {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/kit-builder/${shareToken}`,
    {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
    }
  )
  if (!res.ok) return null
  return res.json()
}
