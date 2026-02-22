"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addToCart } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"

interface SavedKit {
  id: string
  bike_profile?: unknown
  trip_profile?: unknown
  slots?: Record<
    string,
    {
      recommended_product_id: string
      selected_product_id: string
      swapped: boolean
      owned: boolean
    }
  >
  total_weight_grams?: number
  total_cost?: number
}

type ProductInfo = {
  title?: string
  handle?: string
  variantId?: string
}

export function SharedKitView({
  kit,
  products = {},
  countryCode,
}: {
  kit: SavedKit
  products?: Record<string, ProductInfo>
  countryCode?: string
}) {
  const router = useRouter()
  const [addingId, setAddingId] = useState<string | null>(null)
  const tripProfile = kit.trip_profile as { duration?: string; terrain?: string } | null
  const slots = kit.slots ?? {}

  const handleAddToCart = async (productId: string) => {
    const p = products[productId]
    if (!p?.variantId || !countryCode) return
    setAddingId(productId)
    try {
      await addToCart({ variantId: p.variantId, quantity: 1, countryCode })
      router.refresh()
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-xl font-semibold">Kit summary</h2>
        {tripProfile && (
          <p className="text-sm text-gray-600 capitalize">
            {tripProfile.duration?.replace(/_/g, " ")} · {tripProfile.terrain}
          </p>
        )}
        {kit.total_weight_grams != null && (
          <p className="mt-2 text-lg font-medium">
            Total weight: {(kit.total_weight_grams / 1000).toFixed(1)} kg
          </p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {Object.entries(slots).map(([slotName, slot]) => {
          const productId = slot?.selected_product_id
          const product = productId ? products[productId] : null
          const productName = product?.title ?? (productId || "—")
          const isOwned = slot?.owned ?? false

          return (
            <div
              key={slotName}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-medium capitalize">
                  {slotName.replace(/_/g, " ")}
                  {isOwned && (
                    <span className="ml-2 text-xs text-green-600">(owned)</span>
                  )}
                </h3>
                {!isOwned && (
                  product?.handle ? (
                    <LocalizedClientLink
                      href={`/products/${product.handle}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {productName}
                    </LocalizedClientLink>
                  ) : (
                    <p className="text-sm text-gray-500">{productName}</p>
                  )
                )}
              </div>
              {!isOwned && product?.variantId && countryCode && (
                <Button
                  size="small"
                  variant="secondary"
                  disabled={addingId === productId}
                  onClick={() => handleAddToCart(productId)}
                >
                  {addingId === productId ? "Adding..." : "Add to cart"}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
