"use client"

import { useState } from "react"
import type { TripProfile } from "../../types"

const DURATIONS = [
  { value: "overnight" as const, label: "Overnight" },
  { value: "weekend" as const, label: "Weekend (2-3 days)" },
  { value: "multi_day" as const, label: "Multi-day (4-7 days)" },
  { value: "expedition" as const, label: "Expedition (7+ days)" },
]
const TERRAINS = [
  { value: "gravel" as const, label: "Gravel" },
  { value: "mixed" as const, label: "Mixed" },
  { value: "singletrack" as const, label: "Singletrack" },
  { value: "touring" as const, label: "Touring" },
]
const RESUPPLIES = [
  { value: "self_sufficient" as const, label: "Self-sufficient" },
  { value: "frequent" as const, label: "Frequent resupply" },
  { value: "occasional" as const, label: "Occasional resupply" },
]

export function TripProfileStep({
  onComplete,
  onBack,
}: {
  onComplete: (profile: TripProfile) => void
  onBack: () => void
}) {
  const [form, setForm] = useState<Partial<TripProfile>>({
    duration: "weekend",
    terrain: "mixed",
    resupply: "occasional",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.duration && form.terrain && form.resupply) {
      onComplete(form as TripProfile)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold">Your trip</h2>
      <p className="text-gray-600">What kind of adventure are you planning?</p>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Trip duration
        </label>
        <select
          value={form.duration}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              duration: e.target.value as TripProfile["duration"],
            }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {DURATIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Terrain
        </label>
        <select
          value={form.terrain}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              terrain: e.target.value as TripProfile["terrain"],
            }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {TERRAINS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Resupply
        </label>
        <select
          value={form.resupply}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              resupply: e.target.value as TripProfile["resupply"],
            }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {RESUPPLIES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-md border border-gray-300 px-4 py-3 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 rounded-md bg-black px-4 py-3 text-white hover:bg-gray-800"
        >
          Continue
        </button>
      </div>
    </form>
  )
}
