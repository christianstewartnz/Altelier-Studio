"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
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
  // True when the user is on an unused free trial — we bypass the Fungies
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
    // Trial-eligible users never open the Fungies overlay here, so we
    // don't need the post-checkout polling or SDK listeners.
    if (isPaid || isTrialEligible) return

    const redirectToSuccess = () => {
      if (redirectedRef.current) return
      redirectedRef.current = true
      window.location.href = `/project/${projectId}?payment=success`
    }

    // Primary signal: the SDK's checkout-complete event.
    // NOTE: Fungies SDK v0.7.2 only dispatches this event if Initialize()
    // has been called — ScanDOM() alone isn't enough. The Script's onLoad
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-5 text-balance">
            Review your brief
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            Before we generate concepts, take a moment to review.
          </p>
        </div>

        <div className="space-y-8">
          {/* Project Overview Section */}
          <section className="bg-card rounded-3xl p-6 md:p-8 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-foreground">Project</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onGoToStep(1)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-4 mr-2" />
                Edit
              </Button>
            </div>
            <dl className="grid gap-4">
              <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-border/50">
                <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Location</dt>
                <dd className="text-sm text-foreground font-medium">{projectOverview.location}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-border/50">
                <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Development Type</dt>
                <dd className="text-sm text-foreground font-medium">{projectOverview.developmentType}</dd>
              </div>
              {projectOverview.numberOfHomes && (
                <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-border/50">
                  <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Scale</dt>
                  <dd className="text-sm text-foreground font-medium">{projectOverview.numberOfHomes}</dd>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-border/50">
                <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Target Market</dt>
                <dd className="text-sm text-foreground font-medium">
                  {Array.isArray(projectOverview.targetMarket)
                    ? projectOverview.targetMarket.join(", ")
                    : projectOverview.targetMarket}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between py-3">
                <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Price Positioning</dt>
                <dd className="text-sm text-foreground font-medium">{projectOverview.pricePositioning}</dd>
              </div>
              {projectOverview.additionalInfo && (
                <div className="pt-4 border-t border-border/50">
                  <dt className="text-sm text-muted-foreground mb-2">Additional Notes</dt>
                  <dd className="text-sm text-foreground/80 italic">{projectOverview.additionalInfo}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Site Character Section */}
          <section className="bg-card rounded-3xl p-6 md:p-8 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-foreground">Place</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onGoToStep(2)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-4 mr-2" />
                Edit
              </Button>
            </div>
            <dl className="grid gap-4">
              <div className="py-3 border-b border-border/50">
                <dt className="text-sm text-muted-foreground mb-3">Site Qualities</dt>
                <dd className="flex flex-wrap gap-2">
                  {siteCharacter.qualities.map((quality) => (
                    <span
                      key={quality}
                      className="px-3 py-1.5 bg-secondary text-foreground text-sm rounded-full"
                    >
                      {siteQualityLabels[quality] || quality}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="py-3 border-b border-border/50">
                <dt className="text-sm text-muted-foreground mb-2">
                  What makes this specific site or address unique?
                </dt>
                <dd className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {siteCharacter.siteContext}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-border/50">
                <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Desired Tone</dt>
                <dd className="text-sm text-foreground font-medium">{siteCharacter.desiredTone}</dd>
              </div>
              {siteCharacter.attachments.length > 0 && (
                <div className="py-3">
                  <dt className="text-sm text-muted-foreground mb-2">Attachments</dt>
                  <dd className="text-sm text-foreground">
                    {siteCharacter.attachments.length} file{siteCharacter.attachments.length !== 1 ? "s" : ""} uploaded
                  </dd>
                </div>
              )}
              {siteCharacter.additionalInfo && (
                <div className="pt-4 border-t border-border/50">
                  <dt className="text-sm text-muted-foreground mb-2">Additional Notes</dt>
                  <dd className="text-sm text-foreground/80 italic">{siteCharacter.additionalInfo}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Brand Ambition Section */}
          <section className="bg-card rounded-3xl p-6 md:p-8 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-foreground">Direction</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onGoToStep(3)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-4 mr-2" />
                Edit
              </Button>
            </div>
            <dl className="grid gap-4">
              {brandAmbition.buyerFeeling && (
                <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-border/50">
                  <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Buyer Feeling</dt>
                  <dd className="text-sm text-foreground font-medium sm:text-right sm:max-w-xs">
                    {brandAmbition.buyerFeeling}
                  </dd>
                </div>
              )}
              {brandAmbition.pointOfDifference && (
                <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-border/50">
                  <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Point of Difference</dt>
                  <dd className="text-sm text-foreground font-medium sm:text-right sm:max-w-xs">
                    {brandAmbition.pointOfDifference}
                  </dd>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-border/50">
                <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Brand Direction</dt>
                <dd className="text-sm text-foreground font-medium">
                  {brandDirectionLabels[brandAmbition.direction] || brandAmbition.direction}
                </dd>
              </div>
              {brandAmbition.wordsToAvoid && (
                <div className="flex flex-col sm:flex-row sm:justify-between py-3">
                  <dt className="text-sm text-muted-foreground mb-1 sm:mb-0">Words to Avoid</dt>
                  <dd className="text-sm text-foreground/80 italic">{brandAmbition.wordsToAvoid}</dd>
                </div>
              )}
              {brandAmbition.additionalInfo && (
                <div className="pt-4 border-t border-border/50">
                  <dt className="text-sm text-muted-foreground mb-2">Additional Notes</dt>
                  <dd className="text-sm text-foreground/80 italic">{brandAmbition.additionalInfo}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Navigation */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between gap-4">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="h-14 px-6 rounded-2xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <ArrowLeft className="size-5 mr-2" />
              Previous
            </Button>
            {isPaid || isTrialEligible ? (
              <Button
                onClick={onGenerate}
                className="h-14 px-10 rounded-2xl text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="size-5 mr-2" />
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
                  className="h-14 px-10 rounded-2xl text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Sparkles className="size-5" />
                  Generate Brand Concepts — $429 NZD
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
