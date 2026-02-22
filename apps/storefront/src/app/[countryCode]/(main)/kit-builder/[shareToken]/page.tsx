import { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchKitByShareToken } from "@lib/medusa-client"
import { getProductsByIds } from "@lib/data/products"
import { SharedKitView } from "@modules/kit-builder/components/shared-kit-view"

export const metadata: Metadata = {
  title: "Shared Kit | Off-Pavement Shop",
  description: "View a shared bikepacking kit.",
}

export default async function SharedKitPage({
  params,
}: {
  params: Promise<{ countryCode: string; shareToken: string }>
}) {
  const { countryCode, shareToken } = await params
  const data = await fetchKitByShareToken(shareToken)

  if (!data?.kit) {
    notFound()
  }

  const kit = data.kit
  const slots = kit.slots ?? {}
  const productIds = Object.values(slots)
    .filter((s) => s && !s.owned && s.selected_product_id)
    .map((s) => s!.selected_product_id)
  const products = await getProductsByIds({
    ids: [...new Set(productIds)],
    countryCode,
  })
  const productMap = Object.fromEntries(
    products.map((p) => [
      p.id,
      {
        title: p.title,
        handle: p.handle,
        variantId: p.variants?.[0]?.id,
      },
    ])
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 py-8">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-3xl font-bold">Shared Kit</h1>
          <p className="mt-2 text-gray-600">
            A curated bikepacking setup
          </p>
        </div>
      </div>
      <SharedKitView kit={kit} products={productMap} countryCode={countryCode} />
    </div>
  )
}
