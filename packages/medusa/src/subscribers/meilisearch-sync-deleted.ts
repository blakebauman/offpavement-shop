import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { getMeilisearchClient, INDEX_NAME } from "./meilisearch-utils"

export default async function meilisearchSyncDeletedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  try {
    const client = await getMeilisearchClient()
    if (!client) return

    const index = client.index(INDEX_NAME)
    await index.deleteDocument(data.id)
  } catch (err) {
    console.error("[Meilisearch] Sync deleted error:", err)
  }
}

export const config: SubscriberConfig = {
  event: "product.deleted",
}
