import { defineType } from "sanity"

export const productBrief = defineType({
  name: "productBrief",
  title: "Product Brief",
  type: "document",
  fields: [
    {
      name: "medusa_product_id",
      type: "string",
      title: "Medusa Product ID",
      description: "Links this brief to a product in Medusa (e.g., prod_01ABC123)",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "tester",
      type: "reference",
      to: [{ type: "teamMember" }],
      title: "Tester",
    },
    {
      name: "test_summary",
      type: "text",
      title: "Test Summary",
      rows: 2,
      description: "1-2 sentences shown in product grid",
    },
    {
      name: "brief",
      type: "array",
      title: "Full Brief",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
        },
      ],
    },
    {
      name: "verdict",
      type: "string",
      title: "Verdict",
      description: "One-line summary",
    },
    {
      name: "pros",
      type: "array",
      title: "Pros",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    },
    {
      name: "cons",
      type: "array",
      title: "Cons",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    },
    {
      name: "not_good_for",
      type: "array",
      title: "Not Good For",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    },
    {
      name: "best_for",
      type: "array",
      title: "Best For",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    },
    {
      name: "compared_to",
      type: "array",
      title: "Compared To",
      of: [
        {
          type: "object",
          fields: [
            { name: "product_id", type: "string", title: "Product ID" },
            { name: "comparison_note", type: "text", title: "Comparison Note" },
          ],
          preview: {
            select: { product_id: "product_id" },
            prepare: ({ product_id }) => ({ title: product_id || "Comparison" }),
          },
        },
      ],
    },
  ],
  preview: {
    select: { test_summary: "test_summary", medusa_product_id: "medusa_product_id" },
    prepare: ({ test_summary, medusa_product_id }) => ({
      title: test_summary?.slice(0, 50) || medusa_product_id || "Product Brief",
    }),
  },
})
