"use client"

import { useState, useEffect } from "react"
import { fetchSavedKits } from "@lib/medusa-client"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface SavedKit {
  id: string
  share_token?: string
  bike_profile?: unknown
  trip_profile?: unknown
  total_weight_grams?: number
  total_cost?: number
  created_at?: string
}

export function SavedKitsView() {
  const [kits, setKits] = useState<SavedKit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSavedKits()
      .then(({ kits: k }) => setKits(k ?? []))
      .catch(() => setKits([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Saved Kits</h1>
        <p className="text-ui-fg-muted">Loading...</p>
      </div>
    )
  }

  if (kits.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Saved Kits</h1>
        <p className="text-ui-fg-muted">
          You don&apos;t have any saved kits yet. Build a kit and save it to see it here.
        </p>
        <LocalizedClientLink
          href="/kit-builder"
          className="txt-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
        >
          Build your kit →
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Saved Kits</h1>
      <ul className="flex flex-col gap-4">
        {kits.map((kit) => {
          const tripProfile = kit.trip_profile as { duration?: string; terrain?: string } | null
          const label =
            tripProfile?.duration && tripProfile?.terrain
              ? `${String(tripProfile.duration).replace(/_/g, " ")} · ${tripProfile.terrain}`
              : "Kit"

          return (
            <li key={kit.id}>
              <LocalizedClientLink
                href={kit.share_token ? `/kit-builder/${kit.share_token}` : "/kit-builder"}
                className="flex flex-col gap-1 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium capitalize">{label}</span>
                {kit.total_weight_grams != null && (
                  <span className="text-sm text-ui-fg-muted">
                    {(kit.total_weight_grams / 1000).toFixed(1)} kg total
                  </span>
                )}
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
      <LocalizedClientLink
        href="/kit-builder"
        className="txt-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
      >
        Build another kit →
      </LocalizedClientLink>
    </div>
  )
}
