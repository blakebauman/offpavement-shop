import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import { visionTool } from "@sanity/vision"
import { schemaTypes } from "./schemaTypes"

export default defineConfig({
  name: "offpavement",
  title: "Off-Pavement Shop",

  // IMPORTANT: Replace with your actual Sanity project ID
  // Create a project at https://sanity.io/manage
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "YOUR_PROJECT_ID",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
