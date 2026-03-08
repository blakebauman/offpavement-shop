import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getGuideBySlug } from "@lib/sanity"
import { PortableText } from "@portabletext/react"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const guide = await getGuideBySlug(slug)
  if (!guide) return { title: "Guide | Off-Pavement Shop" }
  return {
    title: `${guide.title} | Off-Pavement Shop`,
    description: guide.description ?? undefined,
  }
}

export default async function GuidePage(props: Props) {
  const { slug } = await props.params
  const guide = await getGuideBySlug(slug)

  if (!guide) {
    notFound()
  }

  return (
    <div className="content-container py-12">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">{guide.title}</h1>
        {guide.description && (
          <p className="mt-2 text-lg text-gray-600">{guide.description}</p>
        )}
        {guide.publishedAt && (
          <p className="mt-2 text-sm text-gray-400">
            {new Date(guide.publishedAt).toLocaleDateString()}
          </p>
        )}

        {guide.content?.length ? (
          <div className="prose prose-gray mt-8 max-w-none">
            <PortableText value={guide.content} />
          </div>
        ) : (
          <p className="mt-8 text-gray-500">Content coming soon.</p>
        )}
      </article>
    </div>
  )
}
