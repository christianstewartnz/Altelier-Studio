"use client"

// TODO: Set DISABLE_PAYWALL_FOR_TESTING to false before deploying to production.
const DISABLE_PAYWALL_FOR_TESTING = true

import { useEffect, useRef } from "react"
import Script from "next/script"
import { BriefStepHero } from "@/components/steps/brief-step-hero"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { ProjectOverviewData, SiteCharacterData, BrandAmbitionData } from "@/app/page"

declare global {
  interface Window {
    Fungies?: {
      Fungies?: {
        ScanDOM: () => void
        Initialize: (
          options: { enableDataAttributes?: boolean },
          state?: { completedSetup?: boolean; options?: unknown }
        ) => void
      }
    }
    __fungiesInitialized?: boolean
  }
}

type StepReviewProps = {
  projectOverview: ProjectOverviewData
  siteCharacter: SiteCharacterData
  brandAmbition: BrandAmbitionData
  onGoToStep: (step: number) => void
  onPrevious: () => void
  onGenerate: () => void
  projectId: string
  userId?: string
  isPaid: boolean
  // True when the user is on an unused free trial -- we bypass the Fungies
  // overlay and show the free Generate button. /api/generate atomically
  // consumes the trial server-side.
  isTrialEligible: boolean
}

const siteQualityLabels: Record<string, string> = {
  "views": "Views",
  "sun-light": "Sun / Light",
  "elevation": "Elevation",
  "coastal": "Coastal",
  "urban": "Urban",
  "heritage": "Heritage",
  "landscape": "Landscape Connection",
  "architectural": "Architectural",
  "community": "Community-Oriented",
  "private": "Private / Secluded",
  "sustainable": "Sustainable",
  "resort": "Resort-Style",
  "parkside": "Parkside",
  "bushland": "Bushland"
}

const brandDirectionLabels: Record<string, string> = {
  "premium-refined": "Premium & Refined",
  "modern-architectural": "Modern & Architectural",
  "warm-local": "Warm & Local",
  "calm-coastal": "Calm & Coastal",
  "bold-contemporary": "Bold & Contemporary",
  "timeless-understated": "Timeless & Understated"
}

export function StepReview({
  projectOverview,
  siteCharacter,
  brandAmbition,
  onGoToStep,
  onPrevious,
  onGenerate,
  projectId,
  userId,
  isPaid,
  isTrialEligible
}: StepReviewProps) {
  const redirectedRef = useRef(false)

  useEffect(() => {
    // Trial-eligible users and testing-mode users never open the Fungies overlay.
    if (isPaid || isTrialEligible || DISABLE_PAYWALL_FOR_TESTING) return

    const redirectToSuccess = () => {
      if (redirectedRef.current) return
      redirectedRef.current = true
      window.location.href = `/project/${projectId}?payment=success`
    }

    // Primary signal: the SDK's checkout-complete event.
    // NOTE: Fungies SDK v0.7.2 only dispatches this event if Initialize()
    // has been called -- ScanDOM() alone isn't enough. The Script's onLoad
    // below handles that.
    document.addEventListener("fungies:checkout:complete", redirectToSuccess)

    // Fallback signal: poll our own DB for paid_at. Our webhook flips it
    // on payment_success, so if the SDK event is missed (older cached SDK,
    // postMessage blocked, overlay closed early, etc.) we still catch it.
    const supabase = createClient()
    const pollInterval = window.setInterval(async () => {
      if (redirectedRef.current) return
      const { data } = await supabase
        .from("projects")
        .select("paid_at")
        .eq("id", projectId)
        .maybeSingle()
      if (data?.paid_at) {
        redirectToSuccess()
      }
    }, 3000)

    return () => {
      document.removeEventListener("fungies:checkout:complete", redirectToSuccess)
      window.clearInterval(pollInterval)
    }
  }, [projectId, isPaid, isTrialEligible])

  const checkoutBaseUrl = process.env.NEXT_PUBLIC_FUNGIES_OVERLAY_URL || ""
  const successUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/project/${projectId}?payment=success`
      : ""
  const checkoutUrl = (() => {
    if (!checkoutBaseUrl) return ""
    try {
      const url = new URL(checkoutBaseUrl)
      if (successUrl) {
        url.searchParams.set("success_url", successUrl)
      }
      return url.toString()
    } catch {
      return checkoutBaseUrl
    }
  })()

  const customFields = JSON.stringify({
    project_id: projectId,
    user_id: userId || ""
  })

  return (
    <div className="animate-fade-up">
      <BriefStepHero
        step="Step 04"
        title="Review your brief"
        description="Before we generate concepts, take a moment to review."
      />

      {/* Brief Quality Score */}
      {(() => {
        let pts = 0
        if (projectOverview.location) pts += 10
        if (projectOverview.developmentType) pts += 10
        const tm = Array.isArray(projectOverview.targetMarket)
          ? projectOverview.targetMarket
          : projectOverview.targetMarket
            ? [projectOverview.targetMarket]
            : []
        if (tm.length > 0) pts += 10
        if (projectOverview.pricePositioning) pts += 10
        if (siteCharacter.siteContext && siteCharacter.siteContext.trim().split(/\s+/).length > 20) pts += 15
        if (siteCharacter.qualities.length >= 3) pts += 10
        if (brandAmbition.buyerFeeling && brandAmbition.buyerFeeling.trim().split(/\s+/).length > 15) pts += 15
        if (brandAmbition.pointOfDifference && brandAmbition.pointOfDifference.trim().split(/\s+/).length > 15) pts += 15
        if (brandAmbition.wordsToAvoid) pts += 5
        if (siteCharacter.attachments.length > 0) pts += 10
        if (brandAmbition.additionalInfo) pts += 10
        const pct = Math.round((pts / 120) * 100)
        const label =
          pct <= 40
            ? "Brief needs more detail -- add more specifics for better results"
            : pct <= 70
              ? "Good brief -- a few more details will improve your results"
              : pct <= 90
                ? "Strong brief -- you should get great results"
                : "Excellent brief -- your concepts will be highly specific to this project"
        return (
          <section className="bg-[#FAF9F7] border-b border-border">
            <div className="mx-auto max-w-3xl px-6 py-8">
              <div className="flex items-center justify-between mb-3">
                <p className="section-label-accent">{label}</p>
                <span className="text-sm font-medium text-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 bg-border w-full">
                <div
                  className="h-full bg-[#B5281C] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </section>
        )
      })()}

      {/* Review Section -- warm off-white background */}
      <section className="py-16 md:py-20 bg-[#FAF9F7]">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-0">
            {/* Project Overview Section */}
            <section className="border-b border-border py-12 first:pt-0">
              <div className="flex items-center justify-between mb-10">
                <h2 className="section-header">Project</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onGoToStep(1)}
                  className="text-stone hover:text-foreground -mr-2"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
              <dl className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="field-label">Location</dt>
                  <dd className="field-value sm:text-right">{projectOverview.location}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="field-label">Development Type</dt>
                  <dd className="field-value sm:text-right">{projectOverview.developmentType}</dd>
                </div>
                {projectOverview.numberOfHomes && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="field-label">Scale</dt>
                    <dd className="field-value sm:text-right">{projectOverview.numberOfHomes}</dd>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="field-label">Target Market</dt>
                  <dd className="field-value sm:text-right">
                    {Array.isArray(projectOverview.targetMarket)
                      ? projectOverview.targetMarket.join(", ")
                      : projectOverview.targetMarket}
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="field-label">Price Positioning</dt>
                  <dd className="field-value sm:text-right">{projectOverview.pricePositioning}</dd>
                </div>
                {projectOverview.additionalInfo && (
                  <div>
                    <dt className="field-label mb-2">Additional Notes</dt>
                    <dd className="field-value opacity-80 italic">{projectOverview.additionalInfo}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Site Character Section */}
            <section className="border-b border-border py-12">
              <div className="flex items-center justify-between mb-10">
                <h2 className="section-header">Place</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onGoToStep(2)}
                  className="text-stone hover:text-foreground -mr-2"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
              <dl className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="field-label">Site Qualities</dt>
                  <dd className="field-value sm:text-right">
                    {siteCharacter.qualities.map((q) => siteQualityLabels[q] || q).join(", ")}
                  </dd>
                </div>
                <div className="pb-2">
                  <dt className="field-label mb-3">Site Context</dt>
                  <dd className="border-l-2 border-[#B5281C]/30 pl-4 font-serif text-[16px] italic text-stone leading-relaxed whitespace-pre-wrap">
                    {siteCharacter.siteContext}
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="field-label">Desired Tone</dt>
                  <dd className="field-value sm:text-right">{siteCharacter.desiredTone}</dd>
                </div>
                {siteCharacter.attachments.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="field-label">Attachments</dt>
                    <dd className="field-value sm:text-right">
                      {siteCharacter.attachments.length} file{siteCharacter.attachments.length !== 1 ? "s" : ""} uploaded
                    </dd>
                  </div>
                )}
                {siteCharacter.additionalInfo && (
                  <div>
                    <dt className="field-label mb-2">Additional Notes</dt>
                    <dd className="field-value opacity-80 italic">{siteCharacter.additionalInfo}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Brand Ambition Section */}
            <section className="py-12">
              <div className="flex items-center justify-between mb-10">
                <h2 className="section-header">Direction</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onGoToStep(3)}
                  className="text-stone hover:text-foreground -mr-2"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
              <dl className="space-y-6">
                {brandAmbition.buyerFeeling && (
                  <div className="pb-2">
                    <dt className="field-label mb-3">Buyer Feeling</dt>
                    <dd className="border-l-2 border-[#B5281C]/30 pl-4 font-serif text-[16px] italic text-stone leading-relaxed">
                      {brandAmbition.buyerFeeling}
                    </dd>
                  </div>
                )}
                {brandAmbition.pointOfDifference && (
                  <div className="pb-2">
                    <dt className="field-label mb-3">Point of Difference</dt>
                    <dd className="border-l-2 border-[#B5281C]/30 pl-4 font-serif text-[16px] italic text-stone leading-relaxed">
                      {brandAmbition.pointOfDifference}
                    </dd>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="field-label">Brand Direction</dt>
                  <dd className="field-value sm:text-right">
                    {brandDirectionLabels[brandAmbition.direction] || brandAmbition.direction}
                  </dd>
                </div>
                {brandAmbition.wordsToAvoid && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="field-label">Words to Avoid</dt>
                    <dd className="field-value sm:text-right italic">{brandAmbition.wordsToAvoid}</dd>
                  </div>
                )}
                {brandAmbition.additionalInfo && (
                  <div>
                    <dt className="field-label mb-2">Additional Notes</dt>
                    <dd className="field-value opacity-80 italic">{brandAmbition.additionalInfo}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Navigation */}
            <div className="pt-8 flex flex-col sm:flex-row justify-between gap-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={onPrevious}
                className="h-14 px-6 text-base font-medium text-stone hover:text-foreground hover:bg-[#FAF9F7] transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>
              {isPaid || isTrialEligible || DISABLE_PAYWALL_FOR_TESTING ? (
                <Button
                  onClick={onGenerate}
                  className="h-14 px-10 text-base font-medium bg-[#B5281C] text-paper hover:bg-[#8C1E14] transition-all duration-200"
                >
                  <Sparkles className="w-5 h-5 mr-3" />
                  Generate Brand Concepts
                </Button>
              ) : (
                <>
                  <Script
                    src="https://cdn.jsdelivr.net/npm/@fungies/fungies-js@0.7.2"
                    strategy="afterInteractive"
                    onLoad={() => {
                      // Initialize() (not ScanDOM()) is what attaches the
                      // window.postMessage listener that dispatches
                      // `fungies:checkout:complete` / `fungies:checkout:close`
                      // on document and cleans up the overlay iframe on close.
                      // Guarded so we don't double-register on re-mounts.
                      if (!window.__fungiesInitialized) {
                        window.Fungies?.Fungies?.Initialize({ enableDataAttributes: true })
                        window.__fungiesInitialized = true
                      } else {
                        window.Fungies?.Fungies?.ScanDOM()
                      }
                    }}
                  />
                  <button
                    data-fungies-checkout-url={checkoutUrl}
                    data-fungies-mode="overlay"
                    data-fungies-custom-fields={customFields}
                    className="h-14 px-10 text-base font-medium bg-[#B5281C] text-paper hover:bg-[#8C1E14] transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate Brand Concepts -- $429 NZD
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
