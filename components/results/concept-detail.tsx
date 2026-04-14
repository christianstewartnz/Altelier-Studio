"use client"

import { useEffect } from "react"
import { ArrowLeft, Check, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"
import { getContrastColor } from "@/lib/color-utils"
import type { BrandConcept } from "./results-overview"
import { WordmarkSVG } from "./wordmark-svg"

type ConceptDetailProps = {
  concept: BrandConcept
  onBack: () => void
  onSelect: (concept: BrandConcept) => void
  onRefine: (concept: BrandConcept) => void
  onGenerateVariations: (concept: BrandConcept) => void
}

export function ConceptDetail({ 
  concept, 
  onBack, 
  onSelect, 
  onRefine, 
  onGenerateVariations 
}: ConceptDetailProps) {
  const headingFont = concept.fonts.heading
  const bodyFont = concept.fonts.body

  const headingStyle: React.CSSProperties = { fontFamily: `'${headingFont}', serif` }

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
            style={{ backgroundColor: concept.colors[0] }}
          />
          <div className="mx-auto max-w-5xl px-6 text-center relative">
            {/* Concept Title */}
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-8">
              {concept.conceptTitle}
            </p>

            {/* Brand Name */}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl text-foreground tracking-tight mb-6"
              style={headingStyle}
            >
              {concept.brandName}
            </h1>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-muted-foreground italic max-w-2xl mx-auto">
              {concept.tagline}
            </p>

            {/* Logo Visual */}
            <div className="mt-16 flex justify-center">
              <div
                className="rounded-2xl overflow-hidden flex items-center justify-center p-4"
                style={{
                  backgroundColor: concept.colors[0],
                  width: "320px",
                  height: "120px",
                }}
              >
                <WordmarkSVG
                  composition={concept.logoComposition}
                  headingFont={headingFont}
                  color={getContrastColor(concept.colors[0])}
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
              <p>{concept.rationale}</p>
              {concept.voiceSample?.trim() ? (
                <blockquote className="font-serif text-xl italic text-muted-foreground border-l-2 border-primary pl-6 mt-6">
                  {concept.voiceSample}
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
              {concept.colors.map((color, index) => (
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
                  style={headingStyle}
                >
                  Elegant Living
                </p>
                <p className="text-sm text-muted-foreground">
                  {headingFont} — Light, Regular, Medium
                </p>
              </div>

              {/* Body Style */}
              <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
                  Body
                </p>
                <p className="text-lg text-foreground leading-relaxed mb-4">
                  Thoughtfully designed spaces that connect residents with nature, 
                  light, and a sense of enduring quality.
                </p>
                <p className="text-sm text-muted-foreground">
                  {bodyFont} — Regular, Medium
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
              {/* Primary Wordmark — colors[4] background */}
              <div
                className="flex flex-col items-center justify-center p-12 rounded-2xl min-h-[200px]"
                style={{ backgroundColor: concept.colors[4] }}
              >
                <p
                  className="text-xs tracking-[0.2em] uppercase mb-8"
                  style={{ color: getContrastColor(concept.colors[4]) }}
                >
                  Primary Wordmark
                </p>
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center p-4"
                  style={{ width: "240px", height: "100px" }}
                >
                  <WordmarkSVG
                    composition={concept.logoComposition}
                    headingFont={headingFont}
                    color={concept.colors[0]}
                  />
                </div>
              </div>

              {/* Reversed Wordmark — colors[0] background */}
              <div 
                className="flex flex-col items-center justify-center p-12 rounded-2xl min-h-[200px]"
                style={{ backgroundColor: concept.colors[0] }}
              >
                <p 
                  className="text-xs tracking-[0.2em] uppercase mb-8 opacity-70"
                  style={{ color: concept.colors[4] }}
                >
                  Reversed
                </p>
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center p-4"
                  style={{ width: "240px", height: "100px" }}
                >
                  <WordmarkSVG
                    composition={concept.logoComposition}
                    headingFont={headingFont}
                    color={concept.colors[4]}
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
                  className="aspect-[3/4] rounded-2xl p-8 flex flex-col justify-between transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ backgroundColor: concept.colors[0] }}
                >
                  <div>
                    <p 
                      className="text-xs tracking-[0.2em] uppercase opacity-60 mb-2"
                      style={{ color: getContrastColor(concept.colors[0]) }}
                    >
                      {concept.conceptTitle}
                    </p>
                  </div>
                  <div>
                    <p 
                      className="text-3xl tracking-tight mb-2"
                      style={{ ...headingStyle, color: getContrastColor(concept.colors[0]) }}
                    >
                      {concept.brandName}
                    </p>
                    <p 
                      className="text-sm italic opacity-70"
                      style={{ color: getContrastColor(concept.colors[0]) }}
                    >
                      {concept.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">Brochure Cover</p>
              </div>

              {/* Development Signage */}
              <div className="group">
                <div 
                  className="aspect-[3/4] rounded-2xl p-8 flex items-center justify-center bg-[#1C1C1C] transition-transform duration-300 group-hover:scale-[1.02]"
                >
                  <div className="text-center">
                    <span 
                      className="text-4xl tracking-wide block mb-3"
                      style={{ ...headingStyle, color: concept.colors[4] }}
                    >
                      {concept.logoText}
                    </span>
                    <div className="flex justify-center gap-1.5 mt-4">
                      {concept.colors.slice(0, 3).map((color, i) => (
                        <div 
                          key={i}
                          className="size-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">Development Signage</p>
              </div>

              {/* Website Hero */}
              <div className="group">
                <div 
                  className="aspect-[3/4] rounded-2xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.02] border border-border"
                  style={{ backgroundColor: concept.colors[4] }}
                >
                  {/* Nav */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                    <span 
                      className="text-sm"
                      style={{ ...headingStyle, color: concept.colors[0] }}
                    >
                      {concept.logoText}
                    </span>
                    <div className="flex gap-3">
                      <div 
                        className="w-8 h-1 rounded-full opacity-40"
                        style={{ backgroundColor: concept.colors[0] }}
                      />
                      <div 
                        className="w-8 h-1 rounded-full opacity-40"
                        style={{ backgroundColor: concept.colors[0] }}
                      />
                    </div>
                  </div>
                  {/* Hero */}
                  <div className="p-6 pt-12">
                    <p 
                      className="text-xs tracking-[0.15em] uppercase opacity-50 mb-3"
                      style={{ color: concept.colors[0] }}
                    >
                      Now Selling
                    </p>
                    <p 
                      className="text-2xl tracking-tight mb-2"
                      style={{ ...headingStyle, color: concept.colors[0] }}
                    >
                      {concept.brandName}
                    </p>
                    <p 
                      className="text-xs opacity-60 mb-6"
                      style={{ color: concept.colors[0] }}
                    >
                      {concept.tagline}
                    </p>
                    <div 
                      className="inline-block px-4 py-2 rounded-full text-xs"
                      style={{ 
                        backgroundColor: concept.colors[0],
                        color: getContrastColor(concept.colors[0])
                      }}
                    >
                      Register Interest
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">Website Hero</p>
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
              {concept.attributes.map((attr) => (
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
                onClick={() => onSelect(concept)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
              >
                <Check className="mr-2 size-4" />
                Select This Concept
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onRefine(concept)}
                className="rounded-full px-8"
              >
                <RefreshCw className="mr-2 size-4" />
                Refine This Direction
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => onGenerateVariations(concept)}
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
