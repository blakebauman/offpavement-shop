import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { KIT_BUILDER_MODULE } from "../../../../modules/kit-builder"
import type KitBuilderModuleService from "../../../../modules/kit-builder/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth?.actor_id ?? null
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }

  const body = req.body as { session_id?: string } | undefined
  const sessionId = body?.session_id ?? (req.cookies as { kit_session?: string })?.kit_session ?? null
  if (!sessionId) {
    res.status(400).json({ message: "Missing session_id" })
    return
  }

  const kitBuilderService: KitBuilderModuleService = req.scope.resolve(
    KIT_BUILDER_MODULE
  )

  try {
    await kitBuilderService.linkSessionToCustomer(sessionId, customerId)
    res.json({ linked: true })
  } catch (err) {
    console.error("Kit link-session error:", err)
    res.status(500).json({ message: "Failed to link session" })
  }
}
