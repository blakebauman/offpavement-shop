import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { SavedKitsView } from "@modules/account/components/saved-kits-view"

export const metadata: Metadata = {
  title: "Saved Kits",
  description: "Your saved bikepacking kits.",
}

export default async function SavedKitsPage() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    notFound()
  }

  return <SavedKitsView />
}
