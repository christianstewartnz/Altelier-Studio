"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"
import { getContrastColor } from "@/lib/color-utils"
import { WordmarkSVG } from "./wordmark-svg"
import { InstructionsOverlay } from "./instructions-overlay"

export type LogoComposition = {
  style:
    | "inline-clean"
    | "inline-ruled"
    | "stacked-ruled"
    | "stacked-punctuation"
    | "stacked-weighted"
    | "offset-subtitle"
    | "weight-contrast"
    | "scale-contrast"
    | "ultrawide"
    | "oversized-crop"
    | "mixed-weight-inline"
    | "left-editorial"
  lines: string[]
  punctuation: string
  punctuationPosition: "after-last-line-offset-right" | "between-lines" | "none"
  weight: "light" | "regular" | "bold"
  tracking: "tight" | "normal" | "wide" | "ultrawide"
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
  wordmarkColor: string
  refinementsAvailable?: number
}

export type TileData = { rect: DOMRect; color: string; scrollY: number }

type ResultsOverviewProps = {
  concepts: BrandConcept[]
  onViewConcept: (concept: BrandConcept, tileData?: TileData) => void
  onStartOver: () => void
  hasSeenInstructions: boolean
  onDismissInstructions: () => void
  contractionData?: TileData
  onContractionComplete?: () => void
  confirmedConceptId?: string
}

type ExpansionState = {
  concept: BrandConcept
  rect: DOMRect
  scrollY: number
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

const TRANSITION = [
  "top 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
  "left 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
  "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
  "height 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
].join(", ")

function ExpandingColorOverlay({ color, startRect, onComplete }: {
  color: string
  startRect: DOMRect
  onComplete: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const frame = requestAnimationFrame(() => {
      el.style.top = "0px"
      el.style.left = "0px"
      el.style.width = "100vw"
      el.style.height = "100vh"
    })
    const timer = setTimeout(onComplete, 820)
    return () => { cancelAnimationFrame(frame); clearTimeout(timer) }
  }, [onComplete])

  return (
    <div
      ref={ref}
      className="grain-texture"
      style={{
        position: "fixed",
        zIndex: 9999,
        top: startRect.top,
        left: startRect.left,
        width: startRect.width,
        height: startRect.height,
        backgroundColor: color,
        transition: TRANSITION,
      }}
    />
  )
}

function ContractingColorOverlay({ color, targetRect, onComplete }: {
  color: string
  targetRect: DOMRect
  onComplete: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const frame = requestAnimationFrame(() => {
      el.style.top = `${targetRect.top}px`
      el.style.left = `${targetRect.left}px`
      el.style.width = `${targetRect.width}px`
      el.style.height = `${targetRect.height}px`
    })
    const timer = setTimeout(onComplete, 820)
    return () => { cancelAnimationFrame(frame); clearTimeout(timer) }
  }, [onComplete])

  return (
    <div
      ref={ref}
      className="grain-texture"
      style={{
        position: "fixed",
        zIndex: 9999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: color,
        transition: TRANSITION,
      }}
    />
  )
}

export function ResultsOverview({
  concepts,
  onViewConcept,
  onStartOver,
  hasSeenInstructions,
  onDismissInstructions,
  contractionData,
  onContractionComplete,
  confirmedConceptId,
}: ResultsOverviewProps) {
  const visibleConcepts = confirmedConceptId
    ? concepts.filter(c => c.id === confirmedConceptId)
    : concepts
  const [expandingId, setExpandingId] = useState<string | null>(null)
  const [expansion, setExpansion] = useState<ExpansionState | null>(null)
  const [showContraction, setShowContraction] = useState(!!contractionData)
  const colorBoxRefs = useRef<(HTMLDivElement | null)[]>([])

  // Always start at top on mount (covers both fresh load and back-navigation)
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const allFonts = visibleConcepts.flatMap((c) => [c.fonts.heading, c.fonts.body])
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

  function handleTileClick(concept: BrandConcept, index: number) {
    const colorBox = colorBoxRefs.current[index]
    if (!colorBox) { onViewConcept(concept); return }
    const rect = colorBox.getBoundingClientRect()
    const scrollY = window.scrollY
    setExpandingId(concept.id)
    setExpansion({ concept, rect, scrollY })
  }

  return (
    <div className="min-h-screen bg-cream">
      {!hasSeenInstructions && (
        <InstructionsOverlay onDismiss={onDismissInstructions} />
      )}

      {/* Expansion overlay */}
      {expansion && (
        <ExpandingColorOverlay
          color={expansion.concept.colors[0]}
          startRect={expansion.rect}
          onComplete={() => {
            onViewConcept(expansion.concept, {
              rect: expansion.rect,
              color: expansion.concept.colors[0],
              scrollY: expansion.scrollY,
            })
            setExpansion(null)
          }}
        />
      )}

      {/* Contraction overlay — reverse of entry */}
      {showContraction && contractionData && (
        <ContractingColorOverlay
          color={contractionData.color}
          targetRect={contractionData.rect}
          onComplete={() => {
            setShowContraction(false)
            onContractionComplete?.()
          }}
        />
      )}

      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-ink text-paper grain-texture">
        <div className="mx-auto max-w-[1600px] px-6 relative z-10">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl md:text-3xl tracking-tight">{APP_NAME}</span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-stone-light font-medium">{APP_SUBTITLE}</span>
            </div>
            <button
              onClick={onStartOver}
              className="flex items-center gap-2 text-sm text-stone-light hover:text-paper transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Section heading */}
      <div className="mx-auto max-w-[1600px] px-4 pt-16 pb-12">
        <p className="section-label-accent mb-4">Brand Concepts</p>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-balance leading-[1.1]">
          {confirmedConceptId ? "Your selected brand concept" : "Three directions for your consideration"}
        </h1>
      </div>

      {/* Concept Tiles */}
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-[1600px] px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {visibleConcepts.map((concept, index) => {
              const isDimmed = expandingId !== null && expandingId !== concept.id
              const isExpanding = expandingId === concept.id

              return (
                <article
                  key={concept.id}
                  className="animate-fade-up group flex flex-col bg-paper border border-border overflow-hidden cursor-pointer"
                  style={{
                    animationDelay: `${index * 0.15}s`,
                    animationFillMode: "both",
                    opacity: isDimmed ? 0 : 1,
                    transform: isDimmed ? "scale(0.95)" : "scale(1)",
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                    pointerEvents: expandingId ? "none" : "auto",
                  }}
                  onClick={() => handleTileClick(concept, index)}
                >
                  {/* Top Section — primary colour with ref for getBoundingClientRect */}
                  <div
                    ref={el => { colorBoxRefs.current[index] = el }}
                    className="grain-texture flex items-center justify-center p-8 relative z-10"
                    style={{
                      backgroundColor: concept.colors[0],
                      minHeight: "300px",
                      opacity: isExpanding ? 0 : 1,
                      transition: "opacity 0.1s ease",
                    }}
                  >
                    <div className="w-4/5 flex items-center justify-center">
                      <WordmarkSVG
                        composition={concept.logoComposition}
                        color={concept.wordmarkColor || getContrastColor(concept.colors[0])}
                        headingFont={concept.fonts.heading}
                      />
                    </div>
                  </div>

                  {/* Middle Section — colour palette bands */}
                  <div className="flex flex-col">
                    {concept.colors.map((color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="h-10 w-full flex items-center justify-end px-4"
                        style={{ backgroundColor: color }}
                      >
                        <span
                          className="text-[10px] tracking-[0.2em] uppercase font-medium"
                          style={{ color: isLightColor(color) ? "#3D2412" : "#FFFFFF" }}
                        >
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Section — typography specimen & CTA */}
                  <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <p className="text-[11px] tracking-[0.2em] uppercase font-medium text-stone">
                        {concept.conceptTitle}
                      </p>

                      <div className="space-y-1">
                        <p
                          className="text-lg font-medium text-foreground"
                          style={{ fontFamily: `"${concept.fonts.heading}", serif` }}
                        >
                          {concept.fonts.heading}
                        </p>
                        <p
                          className="text-sm text-stone"
                          style={{ fontFamily: `"${concept.fonts.body}", sans-serif` }}
                        >
                          {concept.fonts.body}
                        </p>
                      </div>

                      <p
                        className="font-serif italic text-base text-foreground/80"
                        style={{ fontFamily: `"${concept.fonts.body}", sans-serif` }}
                      >
                        {concept.tagline}
                      </p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleTileClick(concept, index) }}
                      className="
                        group/btn flex items-center justify-between w-full
                        px-5 py-4 bg-transparent border border-ink text-ink
                        text-[12px] tracking-[0.15em] uppercase font-medium
                        transition-all duration-200
                        hover:bg-ink hover:text-paper
                      "
                    >
                      <span>Explore this concept</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
