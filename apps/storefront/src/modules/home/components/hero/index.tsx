"use client"

import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Wrench } from "@medusajs/icons"

const Hero = () => {
  return (
    <div className="h-[75vh] min-h-[400px] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading
            level="h1"
            className="text-3xl small:text-4xl leading-tight text-ui-fg-base font-normal"
          >
            Off-Pavement Shop
          </Heading>
          <Heading
            level="h2"
            className="text-xl small:text-2xl leading-relaxed text-ui-fg-subtle font-normal mt-2"
          >
            Curated bikepacking gear, tested on the trail
          </Heading>
        </span>
        <Text className="text-ui-fg-muted max-w-lg">
          Plan your kit with our gear recommender — then shop the picks.
        </Text>
        <div className="flex flex-col small:flex-row gap-3">
          <LocalizedClientLink href="/kit-builder">
            <Button size="large" className="gap-2">
              <Wrench />
              Build Your Kit
            </Button>
          </LocalizedClientLink>
          <LocalizedClientLink href="/store">
            <Button variant="secondary" size="large">
              Browse Shop
            </Button>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default Hero
