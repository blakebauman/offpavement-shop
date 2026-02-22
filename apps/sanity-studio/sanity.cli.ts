import { defineCliConfig } from "sanity/cli"

export default defineCliConfig({
  api: {
    // IMPORTANT: Replace with your actual Sanity project ID
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "YOUR_PROJECT_ID",
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  studioHost: "offpavement",
})
