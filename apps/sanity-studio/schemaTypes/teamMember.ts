import { defineType } from "sanity"

export const teamMember = defineType({
  name: "teamMember",
  title: "Team Member",
  type: "document",
  fields: [
    {
      name: "name",
      type: "string",
      title: "Name",
      validation: (Rule) => Rule.required()
    },
    {
      name: "role",
      type: "string",
      title: "Role",
      description: "e.g., Product Tester, Content Editor"
    },
    {
      name: "bio",
      type: "text",
      title: "Bio",
      rows: 3
    },
    {
      name: "image",
      type: "image",
      title: "Profile Image",
      options: {
        hotspot: true,
      },
    },
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "image" },
  },
})
