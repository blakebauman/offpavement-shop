import { Metadata } from "next"
import { KitBuilderWizard } from "@modules/kit-builder/components/kit-builder-wizard"

export const metadata: Metadata = {
  title: "Kit Builder | Off-Pavement Shop",
  description: "Build your bikepacking kit with personalized recommendations.",
}

export default function KitBuilderPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 py-8">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-3xl font-bold">Kit Builder</h1>
          <p className="mt-2 text-gray-600">
            Answer a few questions and we&apos;ll recommend gear that fits your bike and trip.
          </p>
        </div>
      </div>
      <KitBuilderWizard />
    </div>
  )
}
