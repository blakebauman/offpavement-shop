import { defineType } from "sanity"

export const guide = defineType({
  name: "guide",
  title: "Guide",
  type: "document",
  fields: [
    {
      name: "slug",
      type: "slug",
      title: "Slug",
      description: "URL path (e.g. bikepacking-basics)",
      validation: (Rule) => Rule.required(),
      options: {
        source: "title",
        maxLength: 96,
      },
    },
    {
      name: "title",
      type: "string",
      title: "Title",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "description",
      type: "text",
      title: "Description",
      rows: 2,
    },
    {
      name: "publishedAt",
      type: "datetime",
      title: "Published at",
    },
    {
      name: "content",
      type: "array",
      title: "Content",
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
      name: "featured",
      type: "boolean",
      title: "Featured",
      initialValue: false,
    },
    {
      name: "category",
      type: "string",
      title: "Category",
      options: {
        list: [
          { title: "Getting Started", value: "getting-started" },
          { title: "Gear", value: "gear" },
          { title: "Routes", value: "routes" },
          { title: "Skills", value: "skills" },
        ],
      },
    },
  ],
  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare: ({ title, slug }) => ({
      title: title || "Untitled Guide",
      subtitle: slug ? `/${slug}` : "",
    }),
  },
})
