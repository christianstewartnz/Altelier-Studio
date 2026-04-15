"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Check, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"
import { getContrastColor, getSortedColors } from "@/lib/color-utils"
import type { BrandConcept } from "./results-overview"
import { WordmarkSVG } from "./wordmark-svg"

type ConceptDetailProps = {
  concept: BrandConcept
  onBack: () => void
  onSelect: (concept: BrandConcept) => void
  onRefine: (concept: BrandConcept) => void
  onGenerateVariations: (concept: BrandConcept) => void
  refinementsRemaining: number
  onRefinementUsed: () => void
}

export function ConceptDetail({ 
  concept, 
  onBack, 
  onSelect, 
  onRefine, 
  onGenerateVariations,
  refinementsRemaining,
  onRefinementUsed,
}: ConceptDetailProps) {
  const [currentConcept, setCurrentConcept] = useState(concept)
  const [showRefinement, setShowRefinement] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const headingFont = currentConcept.fonts.heading
  const bodyFont = currentConcept.fonts.body

  const headingStyle: React.CSSProperties = { fontFamily: `'${headingFont}', serif` }

  const sortedColors = getSortedColors(currentConcept.colors)
  const darkestColor = sortedColors[0]
  const lightestColor = sortedColors[sortedColors.length - 1]
  const secondLightestColor = sortedColors[sortedColors.length - 2]
  const midColor = sortedColors[Math.floor(sortedColors.length / 2)]
  const APARTMENT_IMAGE = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"

  function handleApplyRefinements(updatedConcept: BrandConcept) {
    setShowRefinement(false)
    setIsApplying(true)
    onRefinementUsed()
    setTimeout(() => {
      setCurrentConcept(updatedConcept)
      setIsApplying(false)
    }, 1500)
  }

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

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: `'${bodyFont}', sans-serif` }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span className="text-sm">Back to concepts</span>
            </button>
            <div className="flex flex-col items-center">
              <span
                className="text-xl tracking-tight text-[#1C1C1C]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {APP_NAME}
              </span>
              <span
                className="text-[8px] tracking-[0.25em] uppercase text-[#6B6B6B] ml-4 -mt-0.5"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                {APP_SUBTITLE}
              </span>
            </div>
            <div className="w-[100px]" />
          </div>
        </div>
      </header>

      <main className="pb-24">
        {/* SECTION 1 — HERO */}
        <section className="relative py-24 md:py-32 overflow-hidden animate-in fade-in duration-700">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundColor: currentConcept.colors[0] }}
          />
          <div className="mx-auto max-w-5xl px-6 text-center relative">
            {/* Concept Title */}
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-8">
              {currentConcept.conceptTitle}
            </p>

            {/* Brand Name */}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl text-foreground tracking-tight mb-6"
              style={headingStyle}
            >
              {currentConcept.brandName}
            </h1>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-muted-foreground italic max-w-2xl mx-auto">
              {currentConcept.tagline}
            </p>

            {/* Logo Visual */}
            <div className="mt-16 flex justify-center">
              <div
                className="rounded-2xl overflow-hidden flex items-center justify-center p-4"
                style={{
                  backgroundColor: currentConcept.colors[0],
                  width: "320px",
                  height: "120px",
                }}
              >
                <WordmarkSVG
                  composition={currentConcept.logoComposition}
                  headingFont={headingFont}
                  color={currentConcept.wordmarkColor || getContrastColor(currentConcept.colors[0])}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — RATIONALE */}
        <section className="py-20 md:py-28 border-t border-border animate-in fade-in duration-700" style={{ animationDelay: "100ms" }}>
          <div className="mx-auto max-w-3xl px-6">
            <h2
              className="text-2xl md:text-3xl text-foreground tracking-tight mb-8"
              style={headingStyle}
            >
              The Rationale
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>{currentConcept.rationale}</p>
              {currentConcept.voiceSample?.trim() ? (
                <blockquote className="font-serif text-xl italic text-muted-foreground border-l-2 border-primary pl-6 mt-6">
                  {currentConcept.voiceSample}
                </blockquote>
              ) : null}
            </div>
          </div>
        </section>

        {/* SECTION 3 — COLOUR SYSTEM */}
        <section className="py-20 md:py-28 border-t border-border bg-card animate-in fade-in duration-700" style={{ animationDelay: "200ms" }}>
          <div className="mx-auto max-w-5xl px-6">
            <h2
              className="text-2xl md:text-3xl text-foreground tracking-tight mb-12 text-center"
              style={headingStyle}
            >
              Colour System
            </h2>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {currentConcept.colors.map((color, index) => (
                <div key={index} className="flex flex-col items-center gap-4">
                  <div 
                    className="size-24 md:size-32 rounded-2xl shadow-lg border border-border/30"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-muted-foreground font-mono uppercase">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — TYPOGRAPHY */}
        <section className="py-20 md:py-28 border-t border-border animate-in fade-in duration-700" style={{ animationDelay: "300ms" }}>
          <div className="mx-auto max-w-5xl px-6">
            <h2
              className="text-2xl md:text-3xl text-foreground tracking-tight mb-12 text-center"
              style={headingStyle}
            >
              Typography
            </h2>
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Heading Style */}
              <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
                  Heading
                </p>
                <p
                  className="text-4xl md:text-5xl text-foreground tracking-tight mb-4"
                  style={{ fontFamily: `'${currentConcept.fonts.heading}', serif` }}
                >
                  {currentConcept.brandName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentConcept.fonts.heading} — Light, Regular, Medium
                </p>
              </div>

              {/* Body Style */}
              <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
                  Body
                </p>
                <p
                  className="text-lg text-foreground leading-relaxed mb-4"
                  style={{ fontFamily: `'${currentConcept.fonts.body}', sans-serif` }}
                >
                  {currentConcept.tagline}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentConcept.fonts.body} — Regular, Medium
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — IDENTITY */}
        <section className="py-20 md:py-28 border-t border-border bg-card animate-in fade-in duration-700" style={{ animationDelay: "400ms" }}>
          <div className="mx-auto max-w-5xl px-6">
            <h2
              className="text-2xl md:text-3xl text-foreground tracking-tight mb-12 text-center"
              style={headingStyle}
            >
              Identity
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Primary Wordmark — light background */}
              <div
                className="flex flex-col items-center justify-center p-12 rounded-2xl min-h-[200px]"
                style={{ backgroundColor: currentConcept.colors[0] }}
              >
                <p
                  className="text-xs tracking-[0.2em] uppercase mb-8"
                  style={{ color: currentConcept.wordmarkColor }}
                >
                  Primary Wordmark
                </p>
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center p-4"
                  style={{ width: "240px", height: "100px" }}
                >
                  <WordmarkSVG
                    composition={currentConcept.logoComposition}
                    headingFont={headingFont}
                    color={currentConcept.wordmarkColor}
                  />
                </div>
              </div>

              {/* Reversed Wordmark — dark background */}
              <div 
                className="flex flex-col items-center justify-center p-12 rounded-2xl min-h-[200px]"
                style={{ backgroundColor: currentConcept.wordmarkColor }}
              >
                <p 
                  className="text-xs tracking-[0.2em] uppercase mb-8"
                  style={{ color: currentConcept.colors[0] }}
                >
                  Reversed
                </p>
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center p-4"
                  style={{ width: "240px", height: "100px" }}
                >
                  <WordmarkSVG
                    composition={currentConcept.logoComposition}
                    headingFont={headingFont}
                    color={currentConcept.colors[0]}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 — APPLICATIONS */}
        <section className="py-20 md:py-28 border-t border-border animate-in fade-in duration-700" style={{ animationDelay: "500ms" }}>
          <div className="mx-auto max-w-6xl px-6">
            <h2
              className="text-2xl md:text-3xl text-foreground tracking-tight mb-12 text-center"
              style={headingStyle}
            >
              Applications
            </h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Brochure Cover */}
              <div className="group">
                <div 
                  className="aspect-[3/4] rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ backgroundColor: lightestColor }}
                >
                  {/* Logo area - top third */}
                  <div className="flex items-center justify-center p-6 flex-shrink-0" style={{ height: '30%' }}>
                    <WordmarkSVG
                      composition={currentConcept.logoComposition}
                      color={getContrastColor(lightestColor)}
                      headingFont={currentConcept.fonts.heading}
                    />
                  </div>

                  {/* Apartment image - middle */}
                  <div className="mx-4 rounded-xl overflow-hidden flex-shrink-0" style={{ height: '35%' }}>
                    <img 
                      src={APARTMENT_IMAGE}
                      alt="Development preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Text area - bottom */}
                  <div className="flex flex-col items-center justify-center p-4 flex-1">
                    <p 
                      className="text-xs tracking-[0.2em] uppercase mb-2"
                      style={{ 
                        color: getContrastColor(lightestColor),
                        fontFamily: 'Inter, sans-serif',
                        opacity: 0.7
                      }}
                    >
                      For Sale
                    </p>
                    <p 
                      className="text-sm text-center italic leading-snug"
                      style={{ 
                        color: getContrastColor(lightestColor),
                        fontFamily: `'${currentConcept.fonts.body}', sans-serif`
                      }}
                    >
                      {currentConcept.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Brochure Cover
                </p>
              </div>

              {/* Development Signage */}
              <div className="group">
                <div 
                  className="aspect-[3/4] rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ backgroundColor: darkestColor }}
                >
                  {/* Top section - NOW SELLING + Logo */}
                  <div className="p-5 flex-shrink-0" style={{ height: '35%' }}>
                    <p 
                      className="text-xs tracking-[0.25em] uppercase mb-3"
                      style={{ 
                        color: getContrastColor(darkestColor),
                        fontFamily: 'Inter, sans-serif',
                        opacity: 0.7
                      }}
                    >
                      Now Selling
                    </p>
                    <div style={{ width: '80%' }}>
                      <WordmarkSVG
                        composition={currentConcept.logoComposition}
                        color={getContrastColor(darkestColor)}
                        headingFont={currentConcept.fonts.heading}
                      />
                    </div>
                  </div>

                  {/* Apartment image - middle */}
                  <div className="mx-4 rounded-xl overflow-hidden flex-shrink-0" style={{ height: '35%' }}>
                    <img 
                      src={APARTMENT_IMAGE}
                      alt="Development preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Text area - bottom */}
                  <div className="p-5 flex-1 flex flex-col justify-end">
                    <p 
                      className="text-base font-medium mb-1"
                      style={{ 
                        color: getContrastColor(darkestColor),
                        fontFamily: `'${currentConcept.fonts.heading}', serif`
                      }}
                    >
                      {currentConcept.brandName}
                    </p>
                    <p 
                      className="text-xs italic"
                      style={{ 
                        color: getContrastColor(darkestColor),
                        fontFamily: `'${currentConcept.fonts.body}', sans-serif`,
                        opacity: 0.8
                      }}
                    >
                      {currentConcept.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Development Signage
                </p>
              </div>

              {/* Website Hero */}
              <div className="group">
                <div 
                  className="aspect-[3/4] rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ backgroundColor: secondLightestColor }}
                >
                  {/* Nav bar */}
                  <div 
                    className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                    style={{ 
                      backgroundColor: darkestColor,
                      borderBottom: `1px solid ${getContrastColor(darkestColor)}20`
                    }}
                  >
                    <div style={{ width: '45%' }}>
                      <WordmarkSVG
                        composition={currentConcept.logoComposition}
                        color={getContrastColor(darkestColor)}
                        headingFont={currentConcept.fonts.heading}
                      />
                    </div>
                    <div className="flex gap-3">
                      <span 
                        className="text-[9px] tracking-wide"
                        style={{ 
                          color: getContrastColor(darkestColor),
                          fontFamily: 'Inter, sans-serif',
                          opacity: 0.7
                        }}
                      >
                        Floor Plans
                      </span>
                      <span 
                        className="text-[9px] tracking-wide"
                        style={{ 
                          color: getContrastColor(darkestColor),
                          fontFamily: 'Inter, sans-serif',
                          opacity: 0.7
                        }}
                      >
                        Price List
                      </span>
                    </div>
                  </div>

                  {/* Apartment image */}
                  <div className="mx-4 mt-4 rounded-xl overflow-hidden flex-shrink-0" style={{ height: '40%' }}>
                    <img 
                      src={APARTMENT_IMAGE}
                      alt="Development preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content area */}
                  <div className="p-4 flex-1 flex flex-col justify-center">
                    <p 
                      className="text-base font-medium mb-1"
                      style={{ 
                        color: getContrastColor(secondLightestColor),
                        fontFamily: `'${currentConcept.fonts.heading}', serif`
                      }}
                    >
                      {currentConcept.brandName}
                    </p>
                    <p 
                      className="text-xs italic"
                      style={{ 
                        color: getContrastColor(secondLightestColor),
                        fontFamily: `'${currentConcept.fonts.body}', sans-serif`,
                        opacity: 0.8
                      }}
                    >
                      {currentConcept.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Website Hero
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — BRAND ATTRIBUTES */}
        <section className="py-20 md:py-28 border-t border-border bg-card animate-in fade-in duration-700" style={{ animationDelay: "600ms" }}>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2
              className="text-2xl md:text-3xl text-foreground tracking-tight mb-10"
              style={headingStyle}
            >
              Brand Attributes
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {currentConcept.attributes.map((attr) => (
                <span
                  key={attr}
                  className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {attr}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8 — ACTIONS */}
        <section className="py-20 md:py-28 border-t border-border animate-in fade-in duration-700" style={{ animationDelay: "700ms" }}>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2
              className="text-2xl md:text-3xl text-foreground tracking-tight mb-4"
              style={headingStyle}
            >
              Ready to move forward?
            </h2>
            <p className="text-muted-foreground mb-10">
              Select this concept to refine, or explore other options.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => onSelect(currentConcept)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
              >
                <Check className="mr-2 size-4" />
                Select This Concept
              </Button>
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowRefinement(true)}
                  disabled={refinementsRemaining === 0}
                  className="rounded-full px-8"
                >
                  <RefreshCw className="mr-2 size-4" />
                  Refine This Direction
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {refinementsRemaining} refinement{refinementsRemaining !== 1 ? 's' : ''} remaining
                </p>
              </div>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => onGenerateVariations(currentConcept)}
                className="rounded-full px-8"
              >
                <Sparkles className="mr-2 size-4" />
                Generate Variations
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
