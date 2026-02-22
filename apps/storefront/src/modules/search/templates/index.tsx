"use client"

import { Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type SearchHit = {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string | null
  weight_grams?: number
  price_tier?: string | null
  editorial_rating?: number
}

type SearchResult = {
  hits: SearchHit[]
  estimatedTotalHits: number
  query: string
} | null

export default function SearchTemplate({
  countryCode,
  query,
  result,
  filters,
}: {
  countryCode: string
  query: string
  result: SearchResult
  filters: {
    price_tier?: string
    bike_type?: string
    trip_type?: string
    max_weight_grams?: string
  }
}) {
  return (
    <div className="content-container py-8">
      <div className="mb-8">
        <h1 className="text-2xl-semi mb-4">Search</h1>
        <form action={`/${countryCode}/search`} method="GET" className="flex gap-2 max-w-md">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search products..."
            className="flex-1 rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2 text-base"
            aria-label="Search"
          />
          <button
            type="submit"
            className="rounded-md bg-ui-button-neutral bg-ui-bg-component px-4 py-2 text-small-semibold hover:bg-ui-button-neutral-hover"
          >
            Search
          </button>
        </form>
      </div>

      {!query && (
        <Text className="text-ui-fg-muted">Enter a search term to find products.</Text>
      )}

      {query && result && (
        <>
          <Text className="text-ui-fg-subtle mb-6">
            {result.estimatedTotalHits} result{result.estimatedTotalHits !== 1 ? "s" : ""} for
            &quot;{query}&quot;
          </Text>

          {result.hits.length === 0 ? (
            <Text className="text-ui-fg-muted">No products found. Try a different search.</Text>
          ) : (
            <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-6">
              {result.hits.map((hit) => (
                <LocalizedClientLink
                  key={hit.id}
                  href={`/products/${hit.handle}`}
                  className="group"
                >
                  <div className="aspect-square relative bg-ui-bg-subtle rounded-lg overflow-hidden mb-2">
                    {hit.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hit.thumbnail}
                        alt={hit.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ui-fg-muted text-small">
                        No image
                      </div>
                    )}
                  </div>
                  <Text className="text-ui-fg-subtle group-hover:text-ui-fg-base font-medium">
                    {hit.title}
                  </Text>
                  {hit.price_tier && (
                    <Text className="text-ui-fg-muted text-small">
                      {hit.price_tier}
                    </Text>
                  )}
                </LocalizedClientLink>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
