import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { randomUUID } from "node:crypto"
import { saveKitSchema } from "../schemas"
import { saveKitWorkflow } from "../../../../workflows/save-kit"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = saveKitSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const customerId =
    (req as MedusaRequest & { auth?: { actor_id?: string } }).auth?.actor_id ??
    null
  const sessionId = req.cookies?.kit_session ?? randomUUID()

  try {
    const { result: kit } = await saveKitWorkflow(req.scope).run({
      input: {
        customer_id: customerId,
        session_id: sessionId,
        bike_profile: parsed.data.bike_profile,
        trip_profile: parsed.data.trip_profile,
        preferences: parsed.data.preferences,
        slots: parsed.data.slots,
        total_weight_grams: parsed.data.total_weight_grams,
        total_cost: parsed.data.total_cost,
      },
    })

    res.setHeader(
      "Set-Cookie",
      `kit_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    )
    res.json({ kit })
  } catch (err) {
    console.error("Kit save error:", err)
    res.status(500).json({ message: "Failed to save kit" })
  }
}
