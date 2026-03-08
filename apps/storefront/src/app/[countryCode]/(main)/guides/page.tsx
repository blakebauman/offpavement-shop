import { Metadata } from "next"
import Link from "next/link"
import { getGuides } from "@lib/sanity"

export const metadata: Metadata = {
  title: "Guides | Off-Pavement Shop",
  description: "Bikepacking guides and how-tos from the Off-Pavement team.",
}

export default async function GuidesPage() {
  const guides = await getGuides()

  return (
    <div className="content-container py-12">
      <h1 className="text-3xl font-bold">Guides</h1>
      <p className="mt-2 text-gray-600">
        Bikepacking guides and how-tos from the Off-Pavement team.
      </p>

      {!guides?.length ? (
        <p className="mt-8 text-gray-500">No guides yet. Check back soon.</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <li key={guide._id}>
              <Link
                href={`/guides/${guide.slug?.current ?? guide._id}`}
                className="block rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md"
              >
                <h2 className="text-lg font-semibold">{guide.title}</h2>
                {guide.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {guide.description}
                  </p>
                )}
                {guide.publishedAt && (
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(guide.publishedAt).toLocaleDateString()}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
