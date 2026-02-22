/**
 * Sanity teamMember schema - referenced by productBrief for tester.
 */
import { defineType } from "sanity"

export const teamMember = defineType({
  name: "teamMember",
  title: "Team Member",
  type: "document",
  fields: [
    { name: "name", type: "string", title: "Name", validation: (Rule) => Rule.required() },
    { name: "role", type: "string", title: "Role" },
    { name: "bio", type: "text", title: "Bio" },
  ],
})
