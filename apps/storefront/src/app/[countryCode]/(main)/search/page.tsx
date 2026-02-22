import { Metadata } from "next"
import { searchProducts } from "@lib/medusa-client"
import SearchTemplate from "@modules/search/templates"

export const metadata: Metadata = {
  title: "Search",
  description: "Search our bikepacking gear.",
}

type Params = {
  searchParams: Promise<{
    q?: string
    page?: string
    price_tier?: string
    bike_type?: string
    trip_type?: string
    max_weight_grams?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function SearchPage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const q = searchParams.q?.trim() ?? ""

  let result: Awaited<ReturnType<typeof searchProducts>> | null = null
  if (q) {
    try {
      result = await searchProducts({
        q,
        limit: 24,
        price_tier: searchParams.price_tier,
        bike_type: searchParams.bike_type,
        trip_type: searchParams.trip_type,
        max_weight_grams: searchParams.max_weight_grams
          ? parseInt(searchParams.max_weight_grams, 10)
          : undefined,
      })
    } catch {
      result = { hits: [], estimatedTotalHits: 0, query: q }
    }
  }

  return (
    <SearchTemplate
      countryCode={params.countryCode}
      query={q}
      result={result}
      filters={{
        price_tier: searchParams.price_tier,
        bike_type: searchParams.bike_type,
        trip_type: searchParams.trip_type,
        max_weight_grams: searchParams.max_weight_grams,
      }}
    />
  )
}
