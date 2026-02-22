"use client"

import { useState } from "react"
import type { BikeProfile } from "../../types"

const BAR_TYPES = [
  { value: "drop" as const, label: "Drop bar" },
  { value: "flat" as const, label: "Flat bar" },
]
const WHEEL_SIZES = [
  { value: "26" as const, label: "26 inch" },
  { value: "27.5" as const, label: "27.5 inch" },
  { value: "29" as const, label: "29 inch" },
  { value: "700c" as const, label: "700c" },
]
const SUSPENSIONS = [
  { value: "rigid" as const, label: "Rigid" },
  { value: "hardtail" as const, label: "Hardtail" },
  { value: "full_sus" as const, label: "Full suspension" },
]
const FRAME_SIZES = [
  { value: "xs_s" as const, label: "XS / S" },
  { value: "m" as const, label: "M" },
  { value: "l_xl" as const, label: "L / XL" },
]
const FRONT_TRIANGLES = [
  { value: "small" as const, label: "Small" },
  { value: "medium" as const, label: "Medium" },
  { value: "large" as const, label: "Large" },
]
const SADDLE_RAILS = [
  { value: "round" as const, label: "Round" },
  { value: "carbon_round" as const, label: "Carbon round" },
  { value: "carbon_flat" as const, label: "Carbon flat" },
]
const BAR_DIAMETERS = [
  { value: "22.2" as const, label: "22.2mm" },
  { value: "25.4" as const, label: "25.4mm" },
  { value: "31.8" as const, label: "31.8mm" },
  { value: "35" as const, label: "35mm" },
]

export function BikeProfileStep({
  onComplete,
}: {
  onComplete: (profile: BikeProfile) => void
}) {
  const [form, setForm] = useState<Partial<BikeProfile>>({
    bar_type: "drop",
    wheel_size: "29",
    suspension: "hardtail",
    frame_size: "m",
    front_triangle: "medium",
    saddle_rail_type: "round",
    bar_diameter: "31.8",
    has_dropper: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      form.bar_type &&
      form.wheel_size &&
      form.suspension &&
      form.frame_size &&
      form.front_triangle &&
      form.saddle_rail_type &&
      form.bar_diameter &&
      form.has_dropper !== undefined
    ) {
      onComplete(form as BikeProfile)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold">Your bike</h2>
      <p className="text-gray-600">Tell us about your setup for compatibility.</p>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Bar type
        </label>
        <select
          value={form.bar_type}
          onChange={(e) =>
            setForm((f) => ({ ...f, bar_type: e.target.value as BikeProfile["bar_type"] }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {BAR_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Wheel size
        </label>
        <select
          value={form.wheel_size}
          onChange={(e) =>
            setForm((f) => ({ ...f, wheel_size: e.target.value as BikeProfile["wheel_size"] }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {WHEEL_SIZES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Suspension
        </label>
        <select
          value={form.suspension}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              suspension: e.target.value as BikeProfile["suspension"],
            }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {SUSPENSIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Frame size
        </label>
        <select
          value={form.frame_size}
          onChange={(e) =>
            setForm((f) => ({ ...f, frame_size: e.target.value as BikeProfile["frame_size"] }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {FRAME_SIZES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Front triangle size
        </label>
        <select
          value={form.front_triangle}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              front_triangle: e.target.value as BikeProfile["front_triangle"],
            }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {FRONT_TRIANGLES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Saddle rail type
        </label>
        <select
          value={form.saddle_rail_type}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              saddle_rail_type: e.target.value as BikeProfile["saddle_rail_type"],
            }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {SADDLE_RAILS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Bar diameter
        </label>
        <select
          value={form.bar_diameter}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              bar_diameter: e.target.value as BikeProfile["bar_diameter"],
            }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {BAR_DIAMETERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="has_dropper"
          checked={form.has_dropper}
          onChange={(e) =>
            setForm((f) => ({ ...f, has_dropper: e.target.checked }))
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="has_dropper" className="text-sm">
          I have a dropper post
        </label>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-black px-4 py-3 text-white hover:bg-gray-800"
      >
        Continue
      </button>
    </form>
  )
}
