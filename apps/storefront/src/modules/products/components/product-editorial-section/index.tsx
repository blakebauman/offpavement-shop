import { PortableText } from "@portabletext/react"
import type { PortableTextBlock } from "@portabletext/types"

interface ProductBrief {
  test_summary?: string
  brief?: unknown
  verdict?: string
  pros?: string[]
  cons?: string[]
  not_good_for?: string[]
  best_for?: string[]
  compared_to?: { product_id: string; comparison_note: string }[]
}

export function ProductEditorialSection({ brief }: { brief: ProductBrief | null }) {
  if (!brief) return null

  return (
    <div className="border-t border-gray-200 py-12">
      <h2 className="text-xl font-semibold">Editorial review</h2>
      {brief.test_summary && (
        <p className="mt-2 text-gray-600">{brief.test_summary}</p>
      )}
      {brief.verdict && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className="font-medium">Verdict</p>
          <p className="mt-1">{brief.verdict}</p>
        </div>
      )}
      {brief.brief && (
        <div className="prose mt-6 max-w-none">
          <PortableText
            value={brief.brief as PortableTextBlock[]}
            components={{
              block: {
                normal: ({ children }) => <p className="mb-4">{children}</p>,
              },
            }}
          />
        </div>
      )}
      {(brief.pros?.length ?? 0) > 0 && (
        <div className="mt-6">
          <h3 className="font-medium">Pros</h3>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {brief.pros!.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      {(brief.cons?.length ?? 0) > 0 && (
        <div className="mt-4">
          <h3 className="font-medium">Cons</h3>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {brief.cons!.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {(brief.not_good_for?.length ?? 0) > 0 && (
        <div className="mt-4">
          <h3 className="font-medium">Not good for</h3>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {brief.not_good_for!.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
      {(brief.best_for?.length ?? 0) > 0 && (
        <div className="mt-4">
          <h3 className="font-medium">Best for</h3>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {brief.best_for!.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
