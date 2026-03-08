"use client"

import { useState, useEffect } from "react"
import { fetchKitBuilderRecommendations, saveKit } from "@lib/medusa-client"
import { addKitToCart } from "@lib/data/cart"
import { getProductsByIds } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import type { BikeProfile, TripProfile, RiderPreferences } from "../types"
import { KitSlotCard } from "./kit-slot-card"
import { useRouter } from "next/navigation"

interface ProductRec {
  id: string
  title?: string
  weight_grams?: number
  price_tier?: string
}

interface ProductDetails {
  thumbnail?: string | null
  priceAmount: number
  priceFormatted: string
}

interface Recommendations {
  [slot: string]: {
    recommended: ProductRec
    alternatives: ProductRec[]
  }
}

export function KitOutputView({
  bikeProfile,
  tripProfile,
  preferences,
  countryCode,
  onBack,
}: {
  bikeProfile: BikeProfile
  tripProfile: TripProfile
  preferences: RiderPreferences
  countryCode: string
  onBack: () => void
}) {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({})
  const [ownedSlots, setOwnedSlots] = useState<Set<string>>(new Set(preferences.existing_gear))
  const [saving, setSaving] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [productDetails, setProductDetails] = useState<Record<string, ProductDetails>>({})
  const [totalCost, setTotalCost] = useState(0)

  useEffect(() => {
    fetchKitBuilderRecommendations({
      bikeProfile,
      tripProfile,
      preferences,
    })
      .then((data) => {
        setRecommendations(data.recommendations ?? {})
        const initial: Record<string, string> = {}
        for (const [slot, rec] of Object.entries(data.recommendations ?? {})) {
          if (rec?.recommended?.id) initial[slot] = rec.recommended.id
        }
        setSelectedProducts(initial)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [bikeProfile, tripProfile, preferences])

  useEffect(() => {
    if (!recommendations || !countryCode) return
    const productIds = Object.entries(selectedProducts)
      .filter(([slot]) => !ownedSlots.has(slot))
      .map(([, id]) => id)
      .filter(Boolean)
    if (productIds.length === 0) {
      setProductDetails({})
      setTotalCost(0)
      return
    }
    getProductsByIds({ ids: [...new Set(productIds)], countryCode })
      .then((products) => {
        const details: Record<string, ProductDetails> = {}
        let sum = 0
        for (const p of products) {
          const { cheapestPrice } = getProductPrice({ product: p })
          const amount = cheapestPrice?.calculated_price_number ?? 0
          details[p.id] = {
            thumbnail: p.thumbnail ?? (p.images?.[0] as { url?: string } | undefined)?.url ?? null,
            priceAmount: amount,
            priceFormatted: cheapestPrice?.calculated_price ?? "$0",
          }
          sum += amount
        }
        setProductDetails(details)
        setTotalCost(sum)
      })
      .catch(() => {
        setProductDetails({})
        setTotalCost(0)
      })
  }, [recommendations, selectedProducts, ownedSlots, countryCode])

  const totalWeight = recommendations
    ? Object.entries(selectedProducts).reduce((sum, [slot, productId]) => {
        if (ownedSlots.has(slot)) return sum
        const rec = recommendations[slot]
        const product = rec?.alternatives?.find((p) => p.id === productId) ?? rec?.recommended
        return sum + (product?.weight_grams ?? 0)
      }, 0)
    : 0

  const buildSlotsPayload = () => {
    if (!recommendations) return {}
    const slots: Record<string, { recommended_product_id: string; selected_product_id: string; swapped: boolean; owned: boolean }> = {}
    for (const [slot, rec] of Object.entries(recommendations)) {
      const selectedId = selectedProducts[slot] ?? rec?.recommended?.id
      slots[slot] = {
        recommended_product_id: rec?.recommended?.id ?? "",
        selected_product_id: selectedId ?? "",
        swapped: selectedId !== rec?.recommended?.id,
        owned: ownedSlots.has(slot),
      }
    }
    return slots
  }

  const handleSave = async (redirectAfter = true) => {
    if (!recommendations) return null
    setSaving(true)
    try {
      const slots = buildSlotsPayload()
      const { kit } = await saveKit({
        bike_profile: bikeProfile,
        trip_profile: tripProfile,
        preferences,
        slots,
        total_weight_grams: totalWeight,
        total_cost: totalCost,
      })
      if (kit?.share_token) {
        const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${countryCode}/kit-builder/${kit.share_token}`
        if (!redirectAfter) {
          return shareUrl
        }
        router.push(`/${countryCode}/kit-builder/${kit.share_token}`)
      }
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    const url = await handleSave(false)
    if (url) {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    }
  }

  const handleAddToCart = async () => {
    if (!recommendations) return
    const productIds = Object.entries(selectedProducts)
      .filter(([slot]) => !ownedSlots.has(slot))
      .map(([, id]) => id)
      .filter(Boolean)
    if (productIds.length === 0) {
      setAddToCartMessage("No items to add (all marked as owned)")
      setTimeout(() => setAddToCartMessage(null), 3000)
      return
    }
    setAddingToCart(true)
    setAddToCartMessage(null)
    try {
      const { added, failed } = await addKitToCart({ productIds, countryCode })
      if (added > 0) {
        setAddToCartMessage(
          failed.length > 0
            ? `Added ${added} item(s). ${failed.length} could not be added.`
            : `Added ${added} item(s) to cart.`
        )
        router.refresh()
      } else {
        setAddToCartMessage("Could not add items to cart. Please try again.")
      }
      setTimeout(() => setAddToCartMessage(null), 3000)
    } catch (e) {
      setAddToCartMessage(e instanceof Error ? e.message : "Failed to add to cart")
      setTimeout(() => setAddToCartMessage(null), 3000)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleSwap = (slot: string, productId: string) => {
    setSelectedProducts((prev) => ({ ...prev, [slot]: productId }))
  }

  const handleToggleOwned = (slot: string) => {
    setOwnedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(slot)) next.delete(slot)
      else next.add(slot)
      return next
    })
  }

  if (loading) return <div className="py-12 text-center">Loading recommendations...</div>
  if (error) return <div className="py-12 text-center text-red-600">{error}</div>
  if (!recommendations) return null

  const slots = Object.entries(recommendations)

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-600 hover:underline"
      >
        ← Back to preferences
      </button>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-xl font-semibold">Your kit</h2>
        <p className="text-sm text-gray-600 capitalize">
          {tripProfile.duration.replace(/_/g, " ")} · {tripProfile.terrain}
        </p>
        <p className="mt-2 text-lg font-medium">
          Total weight: {(totalWeight / 1000).toFixed(1)} kg
          {totalCost > 0 && (
            <span className="ml-4">
              Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(totalCost / 100)}
            </span>
          )}
        </p>
      </div>

      <div className="space-y-4">
        {slots.map(([slotName, rec]) => (
          <KitSlotCard
            key={slotName}
            slotName={slotName}
            recommended={rec.recommended}
            alternatives={rec.alternatives}
            selectedId={selectedProducts[slotName] ?? rec.recommended.id}
            onSwap={handleSwap}
            owned={ownedSlots.has(slotName)}
            onToggleOwned={() => handleToggleOwned(slotName)}
            productDetail={productDetails[selectedProducts[slotName] ?? rec.recommended.id]}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t pt-6">
        <div className="flex gap-3">
          <button
            onClick={() => handleAddToCart()}
            disabled={addingToCart}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {addingToCart ? "Adding..." : "Add all to cart"}
          </button>
          <button
            onClick={handleShare}
            disabled={saving}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {shareCopied ? "Link copied!" : saving ? "Saving..." : "Share kit"}
          </button>
        </div>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="w-full rounded-md bg-black px-4 py-3 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save this kit"}
        </button>
        {addToCartMessage && (
          <p className="text-center text-sm text-gray-600">{addToCartMessage}</p>
        )}
      </div>
    </div>
  )
}
