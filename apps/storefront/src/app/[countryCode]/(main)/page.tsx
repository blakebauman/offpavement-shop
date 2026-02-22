import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Off-Pavement Shop | Curated Bikepacking Gear",
  description:
    "Curated bikepacking gear, tested on the trail. Plan your kit with our gear recommender.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  let region = null
  let collections: Awaited<ReturnType<typeof listCollections>>["collections"] = []

  try {
    const [regionData, { collections: cols }] = await Promise.all([
      getRegion(countryCode),
      listCollections({ fields: "id, handle, title" }),
    ])
    region = regionData
    collections = cols ?? []
  } catch {
    // Medusa may be unavailable during build or when backend is down
  }

  if (!collections?.length || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections!} region={region!} />
        </ul>
      </div>
    </>
  )
}
