import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  getMeilisearchClient,
  buildMeilisearchDocument,
  getProductFromContainer,
  INDEX_NAME,
} from "../lib/meilisearch-utils"

export default async function meilisearchSyncUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const client = await getMeilisearchClient()
    if (!client) return

    const product = await getProductFromContainer(container, data.id)
    if (!product) return

    const index = client.index(INDEX_NAME)
    const document = buildMeilisearchDocument(product)
    await index.updateDocuments([document])
  } catch (err) {
    console.error("[Meilisearch] Sync updated error:", err)
  }
}

export const config: SubscriberConfig = {
  event: "product.updated",
}
