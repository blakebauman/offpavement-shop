"use client"

import { useState } from "react"

interface ProductRec {
  id: string
  title?: string
  weight_grams?: number
  price_tier?: string
}

interface ProductDetail {
  thumbnail?: string | null
  priceFormatted?: string
}

export function KitSlotCard({
  slotName,
  recommended,
  alternatives,
  selectedId,
  onSwap,
  owned,
  onToggleOwned,
  productDetail,
}: {
  slotName: string
  recommended: ProductRec
  alternatives: ProductRec[]
  selectedId: string
  onSwap: (slot: string, productId: string) => void
  owned: boolean
  onToggleOwned: () => void
  productDetail?: ProductDetail | null
}) {
  const [expanded, setExpanded] = useState(false)
  const displayProduct =
    alternatives.find((p) => p.id === selectedId) ?? recommended

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium capitalize">
          {slotName.replace(/_/g, " ")}
          {owned && (
            <span className="ml-2 text-xs text-green-600">(owned)</span>
          )}
        </h3>
        <button
          type="button"
          onClick={onToggleOwned}
          className="text-xs text-gray-500 hover:underline"
        >
          {owned ? "Mark as needed" : "I own this"}
        </button>
      </div>

      {!owned && (
        <>
          <div className="mt-2 flex items-start gap-3">
            {productDetail?.thumbnail && (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-gray-100">
                <img
                  src={productDetail.thumbnail}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-sm">{displayProduct.title ?? displayProduct.id}</span>
              {displayProduct.weight_grams != null && (
                <span className="ml-2 text-xs text-gray-500">
                  {displayProduct.weight_grams}g
                </span>
              )}
              {productDetail?.priceFormatted && (
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {productDetail.priceFormatted}
                </p>
              )}
            </div>
          </div>

          {alternatives.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-xs text-gray-600 hover:underline"
              >
                {expanded ? "Hide alternatives" : "Show alternatives"}
              </button>
              {expanded && (
                <div className="mt-2 space-y-1">
                  {alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => onSwap(slotName, alt.id)}
                      className={`block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
                        selectedId === alt.id ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      {alt.title ?? alt.id}
                      {alt.weight_grams != null && ` (${alt.weight_grams}g)`}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
