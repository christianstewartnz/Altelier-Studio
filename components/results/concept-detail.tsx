"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Script from "next/script"
import { ArrowLeft, Check, Download, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { AppHeader } from "@/components/app-header"
import { getContrastColor, getLuminance, getSortedColors } from "@/lib/color-utils"
import type { BrandConcept } from "./results-overview"
import { WordmarkSVG } from "./wordmark-svg"
import { RefinementModal } from "./refinement-modal"

// Close the Fungies overlay without a page reload.
// Tries the SDK method first; falls back to removing the iframe from the DOM.
function hexWithAlpha(hex: string, alpha: number): string {
  const c = hex.replace("#", "")
  if (c.length < 6) return hex
  const a = Math.min(255, Math.max(0, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, "0")
  return `#${c.slice(0, 6)}${a}`
}

function closeFungiesOverlay() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).Fungies?.Fungies?.Checkout?.close?.()
  } catch {}
  document
    .querySelectorAll('iframe[src*="fungies"], [data-fungies-overlay], .fungies-overlay')
    .forEach((el) => el.remove())
}

type DownloadBrandPackageButtonProps = {
  projectId: string
  conceptId: string
  userId?: string
  isPaid: boolean
  isFreeTrial: boolean
}

function DownloadBrandPackageButton({
  projectId,
  conceptId,
  userId,
  isPaid: isPaidProp,
  isFreeTrial,
}: DownloadBrandPackageButtonProps) {
  // Own local state so we can flip to paid without a page reload.
  const [isPaid, setIsPaid] = useState(isPaidProp)
  const [isLoading, setIsLoading] = useState(false)
  // Ensures payment handling runs at most once even if multiple signals fire.
  const detectedRef = useRef(false)

  // Sync upward: if the parent resolves isPaid=true after initial load, adopt it.
  useEffect(() => {
    if (isPaidProp) setIsPaid(true)
  }, [isPaidProp])

  // Listen for Fungies payment signals while unpaid.
  useEffect(() => {
    if (isPaid) return

    let pollInterval: ReturnType<typeof setInterval> | null = null
    let pollTimeout: ReturnType<typeof setTimeout> | null = null

    function onPaymentDetected() {
      if (detectedRef.current) return
      detectedRef.current = true

      // Close the overlay immediately -- no page reload needed.
      closeFungiesOverlay()

      // Poll paid_at until the webhook has written it (usually < 5 s).
      const supabase = createClient()
      pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from("projects")
          .select("paid_at")
          .eq("id", projectId)
          .maybeSingle()
        if (data?.paid_at) {
          if (pollInterval) clearInterval(pollInterval)
          setIsPaid(true)
        }
      }, 2000)

      // Give up polling after 5 minutes.
      pollTimeout = setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval)
      }, 300_000)
    }

    // Fungies SDK fires a custom DOM event on the document.
    document.addEventListener("fungies:checkout:complete", onPaymentDetected)

    // Fungies iframe also sends a postMessage -- catch both shapes seen in the wild.
    function onWindowMessage(e: MessageEvent) {
      const d = e.data
      if (
        d?.type === "fungies:checkout:complete" ||
        d?.event === "payment_success" ||
        d?.type === "payment_success"
      ) {
        onPaymentDetected()
      }
    }
    window.addEventListener("message", onWindowMessage)

    return () => {
      document.removeEventListener("fungies:checkout:complete", onPaymentDetected)
      window.removeEventListener("message", onWindowMessage)
      if (pollInterval) clearInterval(pollInterval)
      if (pollTimeout) clearTimeout(pollTimeout)
    }
  }, [isPaid, projectId])

  async function handleDownload() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Export failed")
      const a = document.createElement("a")
      a.href = data.downloadUrl
      a.download = "brand-package.zip"
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not generate your brand package. Please try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  // â"€â"€ Paid state -- also bypasses for non-trial accounts â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  if (isPaid || !isFreeTrial) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="h-14 px-10 text-base font-medium bg-[#14110F] text-paper hover:bg-[#14110F]-light transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Preparing download...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download Brand Package
            </>
          )}
        </button>
        <p className="text-sm text-stone">
          {isLoading
            ? "Generating your files, this may take a moment"
            : "Your brand package is ready to download"}
        </p>
      </div>
    )
  }

  // â"€â"€ Unpaid state -- Fungies checkout overlay â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const checkoutBaseUrl = isFreeTrial
    ? process.env.NEXT_PUBLIC_FUNGIES_TRIAL_OVERLAY_URL || ""
    : process.env.NEXT_PUBLIC_FUNGIES_OVERLAY_URL || ""

  const successUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/project/${projectId}/concept/${conceptId}?payment=success`
      : ""

  const checkoutUrl = (() => {
    if (!checkoutBaseUrl) return ""
    try {
      const url = new URL(checkoutBaseUrl)
      if (successUrl) url.searchParams.set("success_url", successUrl)
      return url.toString()
    } catch {
      return checkoutBaseUrl
    }
  })()

  const customFields = JSON.stringify({ project_id: projectId, user_id: userId || "" })

  return (
    <div className="flex flex-col items-center gap-2">
      <Script
        src="https://cdn.jsdelivr.net/npm/@fungies/fungies-js@0.7.2"
        strategy="afterInteractive"
        onLoad={() => {
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
        className="h-14 px-10 text-base font-medium bg-[#14110F] text-paper hover:bg-[#14110F]-light transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        Purchase to Download (70% off $179)
      </button>
      <p className="text-sm text-stone">
        {isFreeTrial
          ? "Unlock your brand package at the trial price"
          : "Unlock your brand package to download"}
      </p>
    </div>
  )
}

type ProjectBrief = {
  location?: string
  suburb?: string
  city?: string
  targetMarket?: string | string[]
  pricePositioning?: string
  siteContext?: string
  desiredTone?: string
  brandDirection?: string
  pointOfDifference?: string
  buyerFeeling?: string
}

type ConceptDetailProps = {
  concept: BrandConcept
  projectId: string
  allConcepts?: BrandConcept[]
  projectBrief?: ProjectBrief
  onBack: () => void
  onGoToDashboard: () => void
  onSelect: (concept: BrandConcept) => void
  onRefine: (concept: BrandConcept) => void
  onGenerateVariations: (concept: BrandConcept) => void
  defaultIsSelected?: boolean
  isConfirmed?: boolean
  userId?: string
  isPaid?: boolean
  isFreeTrial?: boolean
  tileData?: { rect: DOMRect; color: string; scrollY: number }
}

export function ConceptDetail({
  concept,
  projectId,
  allConcepts = [],
  projectBrief,
  onBack,
  onGoToDashboard,
  onSelect,
  onRefine,
  onGenerateVariations,
  defaultIsSelected,
  isConfirmed = false,
  userId,
  isPaid = false,
  isFreeTrial = false,
  tileData,
}: ConceptDetailProps) {
  const [currentConcept, setCurrentConcept] = useState(concept)
  const [refinementsAvailable, setRefinementsAvailable] = useState(concept.refinementsAvailable ?? 3)
  const [showRefinement, setShowRefinement] = useState(false)
  const [showConfirmSelection, setShowConfirmSelection] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [showCongratulations, setShowCongratulations] = useState(false)
  const [isSelected, setIsSelected] = useState(defaultIsSelected || false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [barVisible, setBarVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const lastScrollY = useRef(0)

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      const scrollingUp = currentY < lastScrollY.current
      const pastHero = currentY > window.innerHeight * 0.8
      setHeaderVisible(scrollingUp || pastHero)
      lastScrollY.current = currentY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setBarVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  const headingFont = currentConcept.fonts.heading
  const bodyFont = currentConcept.fonts.body
  const headingStyle: React.CSSProperties = { fontFamily: `'${headingFont}', serif` }

  const sortedColors = getSortedColors(currentConcept.colors)
  const darkestColor = sortedColors[0]
  const lightestColor = sortedColors[sortedColors.length - 1]
  const palette = currentConcept.colors
  const brochureCoverBg =
    palette.length > 4
      ? getLuminance(palette[1]!) >= getLuminance(palette[4]!) ? palette[1]! : palette[4]!
      : palette.length > 1
        ? palette[1]!
        : lightestColor
  const brochureMutedLabelColor =
    sortedColors.length > 2 ? sortedColors[Math.floor(sortedColors.length / 2)]! : sortedColors[1] ?? darkestColor
  const websiteHeroImageBg = palette.length > 3 ? palette[3]! : palette.length > 2 ? palette[2]! : palette[0]!
  const wordmark = currentConcept.wordmarkColor || getContrastColor(currentConcept.colors[0])
  const bodyStyle: React.CSSProperties = { fontFamily: `'${bodyFont}', sans-serif` }
  const APARTMENT_IMAGE = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"

  useEffect(() => {
    const families = [headingFont, bodyFont]
      .map(f => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700`)
      .join("&")
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    const existing = document.getElementById("concept-fonts") as HTMLLinkElement | null
    if (existing) {
      existing.href = href
    } else {
      const link = document.createElement("link")
      link.id = "concept-fonts"
      link.rel = "stylesheet"
      link.href = href
      document.head.appendChild(link)
    }
  }, [headingFont, bodyFont])

  async function handleApplyRefinements(updatedConcept: BrandConcept) {
    // Update concept first so the hero remounts with the new colours during the FLIP animation
    setCurrentConcept(updatedConcept)
    setShowRefinement(false)

    // Persist refined fields back to the database so subsequent
    // refinements (and page reloads) use the latest values.
    if (updatedConcept.id) {
      try {
        const supabase = createClient()
        await supabase
          .from("concepts")
          .update({
            brand_name: updatedConcept.brandName,
            tagline: updatedConcept.tagline,
            rationale: updatedConcept.rationale,
            voice_sample: updatedConcept.voiceSample,
            attributes: updatedConcept.attributes,
            color_rationale: updatedConcept.colorRationale,
            colors: updatedConcept.colors,
            wordmark_color: updatedConcept.wordmarkColor,
            fonts: updatedConcept.fonts,
            logo_composition: updatedConcept.logoComposition,
            location_added: updatedConcept.locationAdded ?? false,
            original_name_before_location: updatedConcept.originalNameBeforeLocation ?? null,
            original_display_with_location: updatedConcept.originalDisplayWithLocation ?? null,
          })
          .eq("id", updatedConcept.id)
      } catch (err) {
        console.error("Failed to persist refinement:", err)
      }
    }

    // Notify parent to update its concepts array so allConcepts stays fresh.
    onRefine(updatedConcept)
  }

  function handleBack() {
    if (!tileData) { onBack(); return }
    setIsExiting(true)
    setBarVisible(false)
    setTimeout(onBack, 380)
  }

  const heroTextColor = currentConcept.wordmarkColor || getContrastColor(currentConcept.colors[0])

  return (
    <div className="min-h-screen bg-[#FAF9F7]" style={{ fontFamily: `'${bodyFont}', sans-serif` }}>

      <AppHeader
        position="fixed"
        className="transition-opacity duration-300"
        style={{
          opacity: headerVisible ? 1 : 0,
          pointerEvents: headerVisible ? "auto" : "none",
        }}
        breadcrumbs={[{ label: "Explore" }]}
      />

      {/* Always-visible nav -- above header z-index so it stays clickable when header is visible */}
      {!showRefinement && (
        <button
          type="button"
          onClick={isConfirmed ? onGoToDashboard : handleBack}
          className="fixed top-0 z-[9998] flex min-h-[74px] items-center gap-2 text-sm transition-colors hover:text-[#B5281C] right-4 sm:right-6 lg:right-10"
          style={{ color: headerVisible ? "#4E473F" : heroTextColor }}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {isConfirmed ? "Dashboard" : "All Concepts"}
        </button>
      )}

      {/* â"€â"€ HERO -- primary colour fills screen â"€â"€ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: currentConcept.colors[0] }}
      >
        <div
          className="absolute inset-0 grain-texture"
          style={{ backgroundColor: currentConcept.colors[0] }}
        />

        {/* Content -- fades out on exit, fades in on entry */}
        <div
          className="animate-fade-in relative z-10 flex flex-col items-center text-center px-6 w-full max-w-4xl mx-auto pt-20 pb-20"
          style={{
            animationDuration: "0.5s",
            animationFillMode: "both",
            opacity: isExiting ? 0 : undefined,
            transition: isExiting ? "opacity 0.3s ease" : undefined,
          }}
        >
          <div className="w-full max-w-[560px] md:max-w-[680px] h-auto mb-16 flex items-center justify-center">
            <WordmarkSVG
              composition={currentConcept.logoComposition}
              color={currentConcept.wordmarkColor || "#FFFFFF"}
              headingFont={headingFont}
            />
          </div>

          <p className="font-serif italic text-xl md:text-2xl max-w-xl" style={{ color: heroTextColor, opacity: 0.8 }}>
            {currentConcept.tagline}
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-px h-16" style={{ backgroundColor: heroTextColor, opacity: 0.3 }} />
        </div>
      </section>

      {/* â"€â"€ BRAND RATIONALE â"€â"€ */}
      <section className="py-24 md:py-32 bg-[#FAF9F7]">
        <div className="mx-auto max-w-4xl px-6">
          <p className="section-label-accent mb-12">Brand Rationale</p>
          <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl text-foreground leading-snug mb-12 text-balance" style={headingStyle}>
            {currentConcept.tagline}
          </blockquote>
          <div className="text-base md:text-lg text-foreground/85 leading-relaxed">
            {currentConcept.rationale}
          </div>
        </div>
      </section>

      {/* â"€â"€ COLOUR PALETTE â"€â"€ */}
      <section className="py-24 md:py-32 bg-[#F8F8F8]">
        <div className="mx-auto max-w-6xl px-6">
          <p className="section-label-accent mb-12">Colour Palette</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {currentConcept.colors.map((color, index) => (
              <div key={index} className="flex flex-col">
                <div
                  className="aspect-square w-full mb-4"
                  style={{ backgroundColor: color }}
                />
                <p className="text-[11px] tracking-[0.2em] uppercase text-stone font-medium">
                  {color}
                </p>
              </div>
            ))}
          </div>
          {currentConcept.colorRationale && (
            <p className="mt-10 text-base text-stone leading-relaxed max-w-2xl">
              {currentConcept.colorRationale}
            </p>
          )}
        </div>
      </section>

      {/* â"€â"€ TYPOGRAPHY â"€â"€ */}
      <section className="py-24 md:py-32 bg-[#FAF9F7]">
        <div className="mx-auto max-w-6xl px-6">
          <p className="section-label-accent mb-12">Typography</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            <div>
              <p
                className="text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground tracking-tight"
                style={{ fontFamily: `"${headingFont}", serif` }}
              >
                {currentConcept.brandName}
              </p>
              <p className="text-[12px] tracking-[0.15em] uppercase text-stone-light">{headingFont} -- Heading</p>
            </div>
            <div>
              <p
                className="text-xl md:text-2xl lg:text-3xl mb-6 text-foreground/85 italic leading-relaxed"
                style={{ fontFamily: `"${bodyFont}", sans-serif` }}
              >
                {currentConcept.tagline}
              </p>
              <p className="text-[12px] tracking-[0.15em] uppercase text-stone-light">{bodyFont} -- Body</p>
            </div>
          </div>
        </div>
      </section>

      {/* â"€â"€ IDENTITY â"€â"€ */}
      <section className="py-24 md:py-32 bg-[#F8F8F8]">
        <div className="mx-auto max-w-6xl px-6">
          <p className="section-label-accent mb-12">Identity</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center justify-center p-12 min-h-[200px]" style={{ backgroundColor: currentConcept.colors[0] }}>
              <p className="field-label mb-8" style={{ color: currentConcept.wordmarkColor }}>Primary Wordmark</p>
              <div className="flex items-center justify-center" style={{ width: "240px", height: "100px" }}>
                <WordmarkSVG composition={currentConcept.logoComposition} headingFont={headingFont} color={currentConcept.wordmarkColor} />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-12 min-h-[200px]" style={{ backgroundColor: currentConcept.wordmarkColor }}>
              <p className="field-label mb-8" style={{ color: currentConcept.colors[0] }}>Reversed</p>
              <div className="flex items-center justify-center" style={{ width: "240px", height: "100px" }}>
                <WordmarkSVG composition={currentConcept.logoComposition} headingFont={headingFont} color={currentConcept.colors[0]} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â"€â"€ BRAND ATTRIBUTES â"€â"€ */}
      <section className="py-24 md:py-32 bg-[#FAF9F7]">
        <div className="mx-auto max-w-6xl px-6">
          <p className="section-label-accent mb-12">Brand Attributes</p>
          <div className="flex flex-wrap gap-4">
            {currentConcept.attributes.map((attr) => (
              <div key={attr} className="px-6 py-4 border border-border bg-[#F8F8F8] text-[11px] tracking-[0.2em] uppercase font-medium text-ink">
                {attr}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â"€â"€ APPLICATIONS â"€â"€ */}
      <section className="py-20 md:py-28 bg-[#F8F8F8]">
        <div className="mx-auto max-w-6xl px-6">
          <p className="section-label-accent mb-12">Applications</p>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Brochure Cover */}
            <div className="group">
              <div
                className="aspect-[3/4] overflow-hidden flex flex-col transition-transform duration-300 group-hover:scale-[1.02]"
                style={{ backgroundColor: brochureCoverBg }}
              >
                <div className="flex items-center justify-center p-6 flex-shrink-0" style={{ height: '30%' }}>
                  <WordmarkSVG
                    composition={currentConcept.logoComposition}
                    color={wordmark}
                    headingFont={headingFont}
                  />
                </div>
                <div className="mx-4 overflow-hidden flex-shrink-0" style={{ height: '35%' }}>
                  <img src={APARTMENT_IMAGE} alt="Development preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col items-center justify-center p-4 flex-1">
                  <p
                    className="text-xs tracking-[0.2em] uppercase mb-2"
                    style={{
                      ...bodyStyle,
                      color: brochureMutedLabelColor,
                      opacity: 0.85,
                    }}
                  >
                    For Sale
                  </p>
                  <p
                    className="text-sm text-center italic leading-snug"
                    style={{
                      ...bodyStyle,
                      color: darkestColor,
                    }}
                  >
                    {currentConcept.tagline}
                  </p>
                </div>
              </div>
              <p className="text-sm text-stone mt-4 text-center">Brochure Cover</p>
            </div>

            {/* Development Signage */}
            <div className="group">
              <div
                className="aspect-[3/4] overflow-hidden flex flex-col transition-transform duration-300 group-hover:scale-[1.02]"
                style={{ backgroundColor: palette[0] }}
              >
                <div className="p-5 flex-shrink-0" style={{ height: '35%' }}>
                  <p
                    className="text-xs tracking-[0.25em] uppercase mb-3"
                    style={{ ...bodyStyle, color: wordmark }}
                  >
                    Now Selling
                  </p>
                  <div style={{ width: '80%' }}>
                    <WordmarkSVG
                      composition={currentConcept.logoComposition}
                      color={wordmark}
                      headingFont={headingFont}
                    />
                  </div>
                </div>
                <div className="mx-4 overflow-hidden flex-shrink-0" style={{ height: '35%' }}>
                  <img src={APARTMENT_IMAGE} alt="Development preview" className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-end">
                  <p
                    className="text-base font-medium mb-1"
                    style={{ ...headingStyle, color: wordmark }}
                  >
                    {currentConcept.brandName}
                  </p>
                  <p
                    className="text-xs italic"
                    style={{ ...bodyStyle, color: wordmark, opacity: 0.75 }}
                  >
                    {currentConcept.tagline}
                  </p>
                </div>
              </div>
              <p className="text-sm text-stone mt-4 text-center">Development Signage</p>
            </div>

            {/* Website Hero */}
            <div className="group">
              <div className="aspect-[3/4] overflow-hidden flex flex-col transition-transform duration-300 group-hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                  style={{
                    backgroundColor: palette[0],
                    borderBottom: `1px solid ${hexWithAlpha(wordmark, 0.25)}`,
                  }}
                >
                  <div style={{ width: '45%' }}>
                    <WordmarkSVG
                      composition={currentConcept.logoComposition}
                      color={wordmark}
                      headingFont={headingFont}
                    />
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[9px] tracking-wide" style={{ ...bodyStyle, color: wordmark }}>
                      Floor Plans
                    </span>
                    <span className="text-[9px] tracking-wide" style={{ ...bodyStyle, color: wordmark }}>
                      Price List
                    </span>
                  </div>
                </div>
                <div
                  className="mx-4 mt-4 overflow-hidden flex-shrink-0"
                  style={{ height: '40%', backgroundColor: websiteHeroImageBg }}
                >
                  <img src={APARTMENT_IMAGE} alt="Development preview" className="w-full h-full object-cover" />
                </div>
                <div
                  className="p-4 flex-1 flex flex-col justify-center"
                  style={{ backgroundColor: lightestColor }}
                >
                  <p
                    className="text-base font-medium mb-1"
                    style={{ ...headingStyle, color: darkestColor }}
                  >
                    {currentConcept.brandName}
                  </p>
                  <p
                    className="text-xs italic"
                    style={{ ...bodyStyle, color: darkestColor, opacity: 0.9 }}
                  >
                    {currentConcept.tagline}
                  </p>
                </div>
              </div>
              <p className="text-sm text-stone mt-4 text-center">Website Hero</p>
            </div>
          </div>
        </div>
      </section>

      {/* â"€â"€ VOICE SAMPLE â"€â"€ */}
      {currentConcept.voiceSample?.trim() && (
        <section className="pt-24 pb-44 md:pt-32 md:pb-56 bg-[#FAF9F7]">
          <div className="mx-auto max-w-4xl px-6">
            <p className="section-label-accent mb-12">Voice Sample</p>
            <div className="relative pl-8 md:pl-12">
              <span className="absolute left-0 top-0 font-serif text-6xl md:text-8xl text-[#B5281C] leading-none">&ldquo;</span>
              <blockquote className="font-serif italic text-xl md:text-2xl text-foreground/85 leading-relaxed">
                {currentConcept.voiceSample}
              </blockquote>
            </div>
          </div>
        </section>
      )}

      {/* â"€â"€ STICKY BOTTOM BAR â"€â"€ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8F8F8] border-t border-border transition-transform duration-500"
        style={{ transform: barVisible ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-center gap-3">
            {!isSelected && (
              <>
                <button
                  onClick={() => setShowRefinement(true)}
                  disabled={refinementsAvailable === 0}
                  className="px-6 py-3 bg-transparent border border-ink text-ink text-[12px] tracking-[0.15em] uppercase font-medium transition-colors duration-200 hover:bg-[#14110F] hover:text-paper disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Refine this concept
                </button>
                <button
                  onClick={() => setShowConfirmSelection(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#14110F] text-paper text-[12px] tracking-[0.15em] uppercase font-medium transition-colors duration-200 hover:bg-[#B5281C]"
                >
                  <Check className="w-4 h-4" />
                  <span className="hidden md:inline">Select this concept</span>
                  <span className="md:hidden">Select</span>
                </button>
              </>
            )}
            {isSelected && (
              <DownloadBrandPackageButton
                projectId={projectId}
                conceptId={currentConcept.id}
                userId={userId}
                isPaid={isPaid}
                isFreeTrial={isFreeTrial}
              />
            )}
        </div>
      </div>

      {/* â"€â"€ REFINEMENT MODAL â"€â"€ */}
      {showRefinement && (
        <RefinementModal
          concept={currentConcept}
          allConcepts={allConcepts}
          projectBrief={projectBrief}
          refinementsRemaining={refinementsAvailable}
          onClose={() => setShowRefinement(false)}
          onApplyRefinements={handleApplyRefinements}
          onRefinementGenerated={(remaining) => setRefinementsAvailable(remaining)}
        />
      )}

      {/* â"€â"€ CONFIRM SELECTION MODAL â"€â"€ */}
      {showConfirmSelection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-[#FAF9F7] p-8 w-full max-w-md border border-border">
            <h2 className="font-serif text-2xl text-foreground tracking-tight mb-3">
              Ready to commit?
            </h2>
            <p className="text-stone text-sm leading-relaxed mb-6">
              Once you select this concept you will no longer be able to refine
              it or view the other concept options. Make sure you are happy with
              your chosen direction before proceeding.
            </p>
            <div
              className="flex items-start gap-3 p-4 bg-[#F8F8F8] border border-border mb-6 cursor-pointer"
              onClick={() => setConfirmChecked(!confirmChecked)}
            >
              <div
                className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  confirmChecked ? "border-ink bg-[#14110F]" : "border-border"
                }`}
              >
                {confirmChecked && (
                  <svg className="w-3 h-3 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-foreground">
                I understand this selection is final and I am ready to proceed
                with this brand concept.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmSelection(false); setConfirmChecked(false) }}
                className="flex-1 h-14 text-sm font-medium border border-border hover:bg-[#F8F8F8] transition-all"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setShowConfirmSelection(false)
                  setShowCongratulations(true)
                  setIsSelected(true)
                  onSelect(currentConcept)
                }}
                disabled={!confirmChecked}
                className="flex-1 h-14 text-sm font-medium bg-[#14110F] text-paper hover:bg-[#14110F]-light disabled:opacity-40 transition-all"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â"€â"€ CONGRATULATIONS MODAL â"€â"€ */}
      {showCongratulations && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-[#FAF9F7] p-8 w-full max-w-md border border-border relative">
            <button
              onClick={() => setShowCongratulations(false)}
              className="absolute top-4 right-4 text-stone hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <p className="section-label-accent mb-4">Brand Selected</p>
              <h2 className="font-serif text-3xl text-foreground tracking-tight mb-2">
                Congratulations
              </h2>
              <p className="text-stone text-sm leading-relaxed">
                Your brand concept is confirmed. Download your complete brand
                package below.
              </p>
            </div>
            <div
              className="p-6 flex items-center justify-center mb-6"
              style={{ backgroundColor: currentConcept.colors[0] }}
            >
              <div style={{ width: "80%" }}>
                <WordmarkSVG
                  composition={currentConcept.logoComposition}
                  color={currentConcept.wordmarkColor}
                  headingFont={currentConcept.fonts.heading}
                />
              </div>
            </div>
            <p
              className="text-center text-lg italic text-stone mb-6"
              style={{ fontFamily: `'${currentConcept.fonts.body}', sans-serif` }}
            >
              {currentConcept.tagline}
            </p>
            <DownloadBrandPackageButton
              projectId={projectId}
              conceptId={currentConcept.id}
              userId={userId}
              isPaid={isPaid}
              isFreeTrial={isFreeTrial}
            />
          </div>
        </div>
      )}
    </div>
  )
}
