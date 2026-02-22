"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { BikeProfileStep } from "./steps/bike-profile-step"
import { TripProfileStep } from "./steps/trip-profile-step"
import { RiderPreferencesStep } from "./steps/rider-preferences-step"
import { KitOutputView } from "./kit-output-view"
import type { BikeProfile, TripProfile, RiderPreferences } from "../types"

type Step = 1 | 2 | 3 | "result"

export function KitBuilderWizard() {
  const params = useParams()
  const countryCode = (params?.countryCode as string) ?? "us"
  const [step, setStep] = useState<Step>(1)
  const [bikeProfile, setBikeProfile] = useState<BikeProfile | null>(null)
  const [tripProfile, setTripProfile] = useState<TripProfile | null>(null)
  const [preferences, setPreferences] = useState<RiderPreferences | null>(null)

  const handleBikeProfileComplete = (profile: BikeProfile) => {
    setBikeProfile(profile)
    setStep(2)
  }

  const handleTripProfileComplete = (profile: TripProfile) => {
    setTripProfile(profile)
    setStep(3)
  }

  const handlePreferencesComplete = (prefs: RiderPreferences) => {
    setPreferences(prefs)
    setStep("result")
  }

  const goBack = () => {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
    else if (step === "result") setStep(3)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {step !== "result" && (
        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded ${
                  step >= s ? "bg-black" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Step {step} of 3
          </p>
        </div>
      )}

      {step === 1 && (
        <BikeProfileStep onComplete={handleBikeProfileComplete} />
      )}
      {step === 2 && (
        <TripProfileStep
          onComplete={handleTripProfileComplete}
          onBack={goBack}
        />
      )}
      {step === 3 && (
        <RiderPreferencesStep
          onComplete={handlePreferencesComplete}
          onBack={goBack}
        />
      )}
      {step === "result" && bikeProfile && tripProfile && preferences && (
        <KitOutputView
          bikeProfile={bikeProfile}
          tripProfile={tripProfile}
          preferences={preferences}
          countryCode={countryCode}
          onBack={goBack}
        />
      )}
    </div>
  )
}
