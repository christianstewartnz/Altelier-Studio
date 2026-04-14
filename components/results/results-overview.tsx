"use client"

import { useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"
import { getContrastColor } from "@/lib/color-utils"
import { WordmarkSVG } from "./wordmark-svg"

export type LogoComposition = {
  style: "inline-clean" | "inline-ruled" | "stacked-ruled" | "stacked-punctuation" | "stacked-weighted" | "offset-subtitle"
  lines: string[]
  punctuation: string
  punctuationPosition: "after-last-line-offset-right" | "between-lines" | "none"
  weight: "light" | "regular" | "bold"
  tracking: "tight" | "normal" | "wide"
  case: "upper" | "title" | "lower"
}

export type BrandConcept = {
  id: string
  conceptTitle: string
  brandName: string
  tagline: string
  summary: string
  colors: string[]
  logoText: string
  logoComposition: LogoComposition
  attributes: string[]
  rationale: string
  colorRationale: string
  fonts: { heading: string; body: string }
  voiceSample: string
}

type ResultsOverviewProps = {
  concepts: BrandConcept[]
  onViewConcept: (concept: BrandConcept) => void
  onStartOver: () => void
}

export function ResultsOverview({ concepts, onViewConcept, onStartOver }: ResultsOverviewProps) {
  useEffect(() => {
    const allFonts = concepts.flatMap((c) => [c.fonts.heading, c.fonts.body])
    const uniqueFonts = [...new Set(allFonts)]
    const fontQuery = uniqueFonts
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;700`)
      .join("&")
    const existingLink = document.getElementById("results-fonts")
    if (existingLink) existingLink.remove()
    const link = document.createElement("link")
    link.id = "results-fonts"
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`
    document.head.appendChild(link)
  }, [concepts])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-serif text-2xl md:text-3xl tracking-tight text-[#1C1C1C]">{APP_NAME}</span>
              <span className="text-[10px] tracking-[0.25em] uppercase text-[#6B6B6B] ml-6 -mt-0.5">{APP_SUBTITLE}</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={onStartOver}
              className="text-muted-foreground hover:text-foreground"
            >
              Start New Project
            </Button>
          </div>
        </div>
      </header>

      <main className="pb-24">
        <div className="mx-auto max-w-6xl px-6 pt-20 md:pt-28 animate-in fade-in duration-700">
          {/* Header */}
          <div className="mb-16 md:mb-20 text-center">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground tracking-tight mb-5 text-balance">
              Your Brand Directions
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
              We&apos;ve developed three distinct identity concepts based on your brief.
            </p>
          </div>

          {/* Concept Cards */}
          <div className="grid gap-8 md:gap-10">
            {concepts.map((concept, index) => {
              return (
              <article
                key={concept.id}
                className="group relative bg-card border border-border rounded-3xl p-8 md:p-12 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 150}ms`, animationFillMode: "both" }}
                onClick={() => onViewConcept(concept)}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12">
                  {/* Left: Content */}
                  <div className="flex-1 min-w-0">
                    {/* Concept Title */}
                    <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
                      {concept.conceptTitle}
                    </p>

                    {/* Brand Name */}
                    <h2
                      className="text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight mb-3"
                      style={{ fontFamily: `'${concept.fonts.heading}', serif` }}
                    >
                      {concept.brandName}
                    </h2>

                    {/* Tagline */}
                    <p
                      className="text-lg md:text-xl text-muted-foreground italic mb-6"
                      style={{ fontFamily: `'${concept.fonts.body}', sans-serif` }}
                    >
                      {concept.tagline}
                    </p>

                    {/* Summary */}
                    <p
                      className="text-muted-foreground leading-relaxed mb-8 max-w-xl"
                      style={{ fontFamily: `'${concept.fonts.body}', sans-serif` }}
                    >
                      {concept.summary}
                    </p>

                    {/* Attributes */}
                    <div className="flex flex-wrap gap-2">
                      {concept.attributes.map((attr) => (
                        <span
                          key={attr}
                          className="px-4 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full"
                        >
                          {attr}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Visual Elements */}
                  <div className="flex flex-col items-start lg:items-end gap-6 lg:min-w-[200px]">
                    {/* Color Palette */}
                    <div className="flex gap-2">
                      {concept.colors.map((color, i) => (
                        <div
                          key={i}
                          className="size-10 md:size-12 rounded-full border border-border/50 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    {/* Logo Preview */}
                    <div
                      className="rounded-xl overflow-hidden flex items-center justify-center p-3"
                      style={{
                        backgroundColor: concept.colors[0],
                        width: "180px"
                      }}
                    >
                      <WordmarkSVG
                        composition={concept.logoComposition}
                        color={getContrastColor(concept.colors[0])}
                        headingFont={concept.fonts.heading}
                      />
                    </div>

                    {/* CTA */}
                    <Button
                      variant="ghost"
                      className="group/btn text-muted-foreground hover:text-foreground"
                    >
                      View Concept
                      <ArrowRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </article>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
