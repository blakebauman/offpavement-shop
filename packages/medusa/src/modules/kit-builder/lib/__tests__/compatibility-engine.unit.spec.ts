import { evaluateCompatibility } from "../compatibility-engine"
import type { BikeProfile, CompatibilityRule } from "../types"

const baseProfile: BikeProfile = {
  bar_type: "drop",
  wheel_size: "29",
  suspension: "hardtail",
  frame_size: "m",
  front_triangle: "medium",
  saddle_rail_type: "round",
  bar_diameter: "31.8",
  has_dropper: false,
}

describe("evaluateCompatibility", () => {
  it("returns compatible when no rules", () => {
    const result = evaluateCompatibility({}, baseProfile)
    expect(result).toEqual({ status: "compatible" })
  })

  it("returns compatible when rules array is null", () => {
    const result = evaluateCompatibility(
      { compatibility_rules: null },
      baseProfile
    )
    expect(result).toEqual({ status: "compatible" })
  })

  it("returns incompatible for excludes rule when profile matches", () => {
    const rules: CompatibilityRule[] = [
      {
        type: "excludes",
        attribute: "has_dropper",
        operator: "eq",
        value: true,
        message: "Not compatible with dropper posts",
      },
    ]
    const result = evaluateCompatibility(
      { compatibility_rules: rules },
      { ...baseProfile, has_dropper: true }
    )
    expect(result.status).toBe("incompatible")
    expect((result as { message: string }).message).toContain("dropper")
  })

  it("returns compatible for excludes rule when profile does not match", () => {
    const rules: CompatibilityRule[] = [
      {
        type: "excludes",
        attribute: "has_dropper",
        operator: "eq",
        value: true,
      },
    ]
    const result = evaluateCompatibility(
      { compatibility_rules: rules },
      baseProfile
    )
    expect(result).toEqual({ status: "compatible" })
  })

  it("returns incompatible for excludes rule on bar_type", () => {
    const rules: CompatibilityRule[] = [
      {
        type: "excludes",
        attribute: "bar_type",
        operator: "eq",
        value: "aero",
        message: "Not compatible with aero bars",
      },
    ]
    const result = evaluateCompatibility(
      { compatibility_rules: rules },
      { ...baseProfile, bar_type: "drop" }
    )
    expect(result).toEqual({ status: "compatible" })

    const resultAero = evaluateCompatibility(
      { compatibility_rules: rules },
      { ...baseProfile, bar_type: "flat" }
    )
    expect(resultAero).toEqual({ status: "compatible" })
  })

  it("returns warning for warns rule when profile matches", () => {
    const rules: CompatibilityRule[] = [
      {
        type: "warns",
        attribute: "has_dropper",
        operator: "eq",
        value: true,
        message: "May have fit issues with dropper",
      },
    ]
    const result = evaluateCompatibility(
      { compatibility_rules: rules },
      { ...baseProfile, has_dropper: true }
    )
    expect(result.status).toBe("warning")
    expect((result as { message: string }).message).toContain("dropper")
  })

  it("returns incompatible for requires rule when profile does not match", () => {
    const rules: CompatibilityRule[] = [
      {
        type: "requires",
        attribute: "bar_diameter",
        operator: "eq",
        value: "31.8",
      },
    ]
    const result = evaluateCompatibility(
      { compatibility_rules: rules },
      { ...baseProfile, bar_diameter: "25.4" }
    )
    expect(result.status).toBe("incompatible")
  })
})
