import { PortableText } from "@portabletext/react"
import type { PortableTextBlock } from "@portabletext/types"

export default function GuideTemplate({
  title,
  description,
  content,
  publishedAt,
}: {
  title: string
  description?: string | null
  content?: PortableTextBlock[] | null
  publishedAt?: string | null
}) {
  return (
    <article className="content-container py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="mt-2 text-lg text-gray-600">{description}</p>
        )}
        {publishedAt && (
          <p className="mt-2 text-sm text-gray-500">
            {new Date(publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </header>
      {content && content.length > 0 && (
        <div className="prose prose-gray mt-8 max-w-2xl">
          <PortableText value={content} />
        </div>
      )}
    </article>
  )
}
