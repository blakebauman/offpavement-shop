"use client"

import { useState } from "react"
import type { RiderPreferences } from "../../types"

const SLOTS = [
  "frame_bag",
  "seat_bag",
  "handlebar_bag",
  "top_tube_bag",
  "shelter",
  "sleeping_bag",
  "sleeping_pad",
  "stove",
  "cook_pot",
  "tool_kit",
]

export function RiderPreferencesStep({
  onComplete,
  onBack,
}: {
  onComplete: (prefs: RiderPreferences) => void
  onBack: () => void
}) {
  const [weightVsDurability, setWeightVsDurability] = useState(3)
  const [budgetTier, setBudgetTier] = useState<RiderPreferences["budget_tier"]>("mid")
  const [existingGear, setExistingGear] = useState<string[]>([])

  const toggleExistingGear = (slot: string) => {
    setExistingGear((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete({
      weight_vs_durability: weightVsDurability as 1 | 2 | 3 | 4 | 5,
      budget_tier: budgetTier,
      existing_gear: existingGear,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold">Your preferences</h2>
      <p className="text-gray-600">Help us recommend the right gear for you.</p>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Weight vs durability ({weightVsDurability})
        </label>
        <div className="flex gap-2 text-xs text-gray-500">
          <span>Ultralight</span>
          <span className="flex-1" />
          <span>Bulletproof</span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={weightVsDurability}
          onChange={(e) => setWeightVsDurability(Number(e.target.value))}
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Budget tier
        </label>
        <select
          value={budgetTier}
          onChange={(e) =>
            setBudgetTier(e.target.value as RiderPreferences["budget_tier"])
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="budget">Budget</option>
          <option value="mid">Mid-range</option>
          <option value="premium">Premium</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Gear you already own
        </label>
        <p className="mt-1 text-xs text-gray-500">
          We&apos;ll skip recommendations for these slots.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SLOTS.map((slot) => (
            <label
              key={slot}
              className="inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-sm"
            >
              <input
                type="checkbox"
                checked={existingGear.includes(slot)}
                onChange={() => toggleExistingGear(slot)}
                className="sr-only"
              />
              <span
                className={
                  existingGear.includes(slot)
                    ? "font-medium"
                    : "text-gray-600"
                }
              >
                {slot.replace(/_/g, " ")}
              </span>
            </label>
          ))}
        </div>
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
          Get recommendations
        </button>
      </div>
    </form>
  )
}
