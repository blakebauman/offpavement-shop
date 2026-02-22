import { createClient, type SanityClient } from "next-sanity"

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ""
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"

function createSanityClient(): SanityClient | null {
  if (!projectId) return null
  return createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    useCdn: true,
  })
}

export const client = createSanityClient()

export async function getProductBrief(medusaProductId: string) {
  if (!client || !projectId) return null
  try {
    const brief = await client.fetch<{
      _id: string
      medusa_product_id?: string
      test_summary?: string
      brief?: unknown
      verdict?: string
      pros?: string[]
      cons?: string[]
      not_good_for?: string[]
      best_for?: string[]
      compared_to?: { product_id: string; comparison_note: string }[]
    } | null>(
      `*[_type == "productBrief" && medusa_product_id == $id][0]`,
      { id: medusaProductId }
    )
    return brief
  } catch {
    return null
  }
}
