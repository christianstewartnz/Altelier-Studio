"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { BrandConcept, LogoComposition } from "./results-overview"
import { WordmarkSVG } from "./wordmark-svg"

type RefinementResults = {
  names?: string[]
  taglines?: string[]
  colorPalettes?: Array<{
    colors: string[]
    wordmarkColor: string
    colorRationale?: string
  }>
  fontPairings?: Array<{ heading: string; body: string }>
  logoCompositions?: LogoComposition[]
}

type RefinementSelections = {
  name?: string
  tagline?: string
  colorPalette?: { colors: string[]; wordmarkColor: string }
  fonts?: { heading: string; body: string }
  logoComposition?: LogoComposition
}

type RefinementModalProps = {
  concept: BrandConcept
  allConcepts?: BrandConcept[]
  refinementsRemaining: number
  onClose: () => void
  onApplyRefinements: (updatedConcept: BrandConcept) => void
  onRefinementGenerated: (remaining: number) => void
}

const REFINEMENT_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "tagline", label: "Marketing Tagline" },
  { id: "colors", label: "Colour Palette" },
  { id: "fonts", label: "Font Pairing" },
  { id: "logo", label: "Logo Composition" }
]

const ELEMENT_LABELS: Record<string, string> = {
  name: "Name",
  tagline: "Tagline",
  colors: "Palette",
  fonts: "Fonts",
  logo: "Logo"
}

export function RefinementModal({
  concept,
  allConcepts = [],
  refinementsRemaining,
  onClose,
  onApplyRefinements,
  onRefinementGenerated
}: RefinementModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [contextInputs, setContextInputs] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [refinementResults, setRefinementResults] = useState<RefinementResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selections, setSelections] = useState<RefinementSelections>({})
  const [keepCurrentItems, setKeepCurrentItems] = useState<Set<string>>(new Set())
  const [closing, setClosing] = useState(false)

  const elementsLabel = selectedItems.map(id => ELEMENT_LABELS[id] || id).join(" & ")

  useEffect(() => {
    if (!refinementResults?.fontPairings?.length) return
    const families = refinementResults.fontPairings
      .flatMap(p => [p.heading, p.body])
      .filter((f, i, arr) => arr.indexOf(f) === i)
      .map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700`)
      .join("&")
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    const id = "refinement-result-fonts"
    const existing = document.getElementById(id) as HTMLLinkElement | null
    if (existing) {
      existing.href = href
    } else {
      const link = document.createElement("link")
      link.id = id
      link.rel = "stylesheet"
      link.href = href
      document.head.appendChild(link)
    }
  }, [refinementResults])

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 520)
  }

  function toggleItem(id: string) {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function handleRefine() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, conceptId: concept.id, selectedItems, contextInputs, allConcepts })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        return
      }
      onRefinementGenerated(data.refinementsRemaining ?? refinementsRemaining - 1)
      setRefinementResults(data)
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  function selectAlternative(category: string, value: unknown) {
    setKeepCurrentItems(prev => { const s = new Set(prev); s.delete(category); return s })
    // "colors" → colorPalette, "logo" → logoComposition to match RefinementSelections type
    const key = category === "colors" ? "colorPalette" : category === "logo" ? "logoComposition" : category
    setSelections(prev => ({ ...prev, [key]: value }))
  }

  function selectKeepCurrent(category: string) {
    setKeepCurrentItems(prev => new Set(prev).add(category))
    setSelections(prev => {
      const next = { ...prev }
      if (category === "name") delete next.name
      if (category === "tagline") delete next.tagline
      if (category === "colors") delete next.colorPalette
      if (category === "fonts") delete next.fonts
      if (category === "logo") delete next.logoComposition
      return next
    })
  }

  function handleApply() {
    const updatedConcept = { ...concept }

    if (!keepCurrentItems.has("name") && selections.name) {
      updatedConcept.brandName = selections.name
      const newLines = selections.name.includes(" ")
        ? selections.name.split(" ").slice(0, 2)
        : [selections.name, updatedConcept.logoComposition.lines[1] || ""]
      updatedConcept.logoComposition = { ...updatedConcept.logoComposition, lines: newLines }
    }
    if (!keepCurrentItems.has("tagline") && selections.tagline) updatedConcept.tagline = selections.tagline
    if (!keepCurrentItems.has("colors") && selections.colorPalette) {
      updatedConcept.colors = selections.colorPalette.colors
      updatedConcept.wordmarkColor = selections.colorPalette.wordmarkColor
    }
    if (!keepCurrentItems.has("fonts") && selections.fonts) updatedConcept.fonts = selections.fonts
    if (!keepCurrentItems.has("logo") && selections.logoComposition) {
      updatedConcept.logoComposition = selections.logoComposition
    }

    onApplyRefinements(updatedConcept)
  }

  const allSelectionsComplete = selectedItems.every(item => {
    if (keepCurrentItems.has(item)) return true
    if (item === "name") return !!selections.name
    if (item === "tagline") return !!selections.tagline
    if (item === "colors") return !!selections.colorPalette
    if (item === "fonts") return !!selections.fonts
    if (item === "logo") return !!selections.logoComposition
    return true
  })

  function resultCardCls(selected: boolean) {
    return `p-7 border-2 cursor-pointer transition-all duration-200 ${
      selected
        ? "border-terracotta bg-paper"
        : "border-transparent bg-paper hover:border-stone/40 hover:-translate-y-0.5"
    }`
  }

  function selectedBadge(selected: boolean) {
    return selected
      ? <span className="text-[10px] tracking-[0.18em] uppercase text-terracotta flex-shrink-0">Selected</span>
      : null
  }

  // ── SELECTION STATE — full-bleed split screen ─────────────────────────────
  if (!isLoading && !error && !refinementResults) {
    const panelTransition = { duration: closing ? 0.5 : 0.6, ease: "easeInOut" as const }
    return (
      <div className="fixed inset-0 z-50 flex overflow-hidden">

        {/* LEFT: Color panel — slides in from the left */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: closing ? "-100%" : 0 }}
          transition={panelTransition}
          className="w-1/2 flex-shrink-0 grain-texture flex flex-col items-center justify-center px-12"
          style={{ backgroundColor: concept.colors[0] }}
        >
          <div className="w-full max-w-[260px] mb-8 flex items-center justify-center">
            <WordmarkSVG
              composition={concept.logoComposition}
              color={concept.wordmarkColor}
              headingFont={concept.fonts.heading}
            />
          </div>
          <p
            className="font-serif italic text-lg text-center leading-snug"
            style={{ color: concept.wordmarkColor, opacity: 0.75 }}
          >
            {concept.tagline}
          </p>
        </motion.div>

        {/* RIGHT: Refinement options — slides in from the right */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: closing ? "100%" : 0 }}
          transition={panelTransition}
          className="w-1/2 bg-ink text-paper flex flex-col"
        >
          {/* Close */}
          <div className="flex justify-end px-8 pt-7 pb-2 flex-shrink-0">
            <button
              onClick={handleClose}
              className="text-stone-light hover:text-paper transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable options */}
          <div className="flex-1 overflow-y-auto px-10 pt-2 pb-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-terracotta mb-5">
              {refinementsRemaining} refinement{refinementsRemaining !== 1 ? "s" : ""} remaining
            </p>
            <h2 className="font-serif text-3xl tracking-tight leading-snug mb-8">
              What would you<br />like to refine?
            </h2>

            <div className="border-t border-ink-light/60 mb-0" />
            <div className="space-y-0">
              {REFINEMENT_OPTIONS.map(option => {
                const isSelected = selectedItems.includes(option.id)
                return (
                  <div key={option.id}>
                    <div
                      className="flex items-center gap-4 py-5 border-b border-ink-light/60 cursor-pointer group"
                      onClick={() => toggleItem(option.id)}
                    >
                      <div className={`size-4 border flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "border-terracotta bg-terracotta"
                          : "border-stone-light group-hover:border-paper"
                      }`}>
                        {isSelected && (
                          <svg className="size-2.5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm tracking-wide transition-colors ${isSelected ? "text-paper" : "text-stone-light group-hover:text-paper"}`}>
                        {option.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="py-4 border-b border-ink-light/60 bg-ink-light/30 -mx-10 px-10">
                        <Textarea
                          placeholder={`What don't you like about the current ${option.label.toLowerCase()}? (optional)`}
                          value={contextInputs[option.id] || ""}
                          onChange={e => setContextInputs(prev => ({ ...prev, [option.id]: e.target.value }))}
                          rows={2}
                          className="bg-transparent border border-ink-light/60 text-paper text-sm placeholder:text-stone-light/50 resize-none focus:border-stone-light transition-colors w-full"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Refine button */}
          <div className="px-10 pb-10 pt-5 flex-shrink-0 border-t border-ink-light">
            <button
              onClick={handleRefine}
              disabled={selectedItems.length === 0}
              className="w-full h-14 text-sm font-medium tracking-[0.12em] uppercase bg-paper text-ink hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
            >
              Refine Concept
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── LOADING STATE — full-screen bg-ink ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-ink grain-texture flex flex-col items-center justify-center">
        <style>{`
          @keyframes refine-wave {
            0%, 100% { transform: translateY(0px); opacity: 0.3; }
            50% { transform: translateY(-7px); opacity: 1; }
          }
        `}</style>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center px-8"
        >
          <p className="font-serif text-4xl tracking-tight text-paper mb-10 leading-snug">
            {elementsLabel
              ? `Refining ${elementsLabel.toLowerCase()}...`
              : "Generating alternatives..."}
          </p>
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <span className="block w-2 h-2 bg-terracotta"
              style={{ animation: "refine-wave 1.2s ease-in-out infinite", animationDelay: "0s" }} />
            <span className="block w-2 h-2 bg-terracotta"
              style={{ animation: "refine-wave 1.2s ease-in-out infinite", animationDelay: "0.2s" }} />
            <span className="block w-2 h-2 bg-terracotta"
              style={{ animation: "refine-wave 1.2s ease-in-out infinite", animationDelay: "0.4s" }} />
          </div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-stone-light">
            Usually 15–20 seconds
          </p>
        </motion.div>
      </div>
    )
  }

  // ── ERROR STATE ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-ink grain-texture flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <p className="section-label-accent mb-3">Something went wrong</p>
          <h2 className="font-serif text-3xl tracking-tight text-paper mb-6 leading-snug">{error}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => { setError(null); setRefinementResults(null) }}
              className="flex-1 h-14 text-sm font-medium tracking-[0.08em] uppercase border-2 border-paper/40 text-paper hover:border-paper transition-colors duration-200 cursor-pointer"
            >
              Go Back
            </button>
            <button
              onClick={handleRefine}
              className="flex-1 h-14 text-sm font-medium tracking-[0.08em] uppercase bg-paper text-ink hover:bg-cream transition-colors duration-200 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULTS STATE — full-screen bg-ink with grain ─────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-ink grain-texture flex flex-col">

      {/* Sticky header */}
      <div className="flex-shrink-0 border-b border-ink-light px-8 py-6 flex items-start justify-between">
        <div>
          <p className="section-label-accent mb-2">New directions</p>
          <h2 className="font-serif text-3xl tracking-tight text-paper leading-snug">
            New directions for {elementsLabel}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-stone-light hover:text-paper transition-colors cursor-pointer flex-shrink-0 ml-6 mt-1"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 pt-8 pb-6 max-w-2xl mx-auto">
          <div className="space-y-12">

            {/* NAME OPTIONS */}
            {refinementResults?.names && refinementResults.names.length > 0 && (
              <div>
                <p className="section-label-accent mb-5">Name</p>
                <div className="space-y-3">
                  <div
                    onClick={() => selectKeepCurrent("name")}
                    className={resultCardCls(keepCurrentItems.has("name"))}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] tracking-[0.18em] uppercase text-stone">Keep current</p>
                      {selectedBadge(keepCurrentItems.has("name"))}
                    </div>
                    <p
                      className="text-3xl text-ink tracking-tight"
                      style={{ fontFamily: `'${concept.fonts.heading}', serif` }}
                    >
                      {concept.brandName}
                    </p>
                  </div>
                  {refinementResults.names.map((name, i) => (
                    <div
                      key={i}
                      onClick={() => selectAlternative("name", name)}
                      className={resultCardCls(selections.name === name && !keepCurrentItems.has("name"))}
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="text-3xl text-ink tracking-tight"
                          style={{ fontFamily: `'${concept.fonts.heading}', serif` }}
                        >
                          {name}
                        </p>
                        {selectedBadge(selections.name === name && !keepCurrentItems.has("name"))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAGLINE OPTIONS */}
            {refinementResults?.taglines && refinementResults.taglines.length > 0 && (
              <div>
                <p className="section-label-accent mb-5">Tagline</p>
                <div className="space-y-3">
                  <div
                    onClick={() => selectKeepCurrent("tagline")}
                    className={resultCardCls(keepCurrentItems.has("tagline"))}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] tracking-[0.18em] uppercase text-stone">Keep current</p>
                      {selectedBadge(keepCurrentItems.has("tagline"))}
                    </div>
                    <p
                      className="text-xl italic text-ink leading-snug"
                      style={{ fontFamily: `'${concept.fonts.body}', sans-serif` }}
                    >
                      &ldquo;{concept.tagline}&rdquo;
                    </p>
                  </div>
                  {refinementResults.taglines.map((tagline, i) => (
                    <div
                      key={i}
                      onClick={() => selectAlternative("tagline", tagline)}
                      className={resultCardCls(selections.tagline === tagline && !keepCurrentItems.has("tagline"))}
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="text-xl italic text-ink leading-snug"
                          style={{ fontFamily: `'${concept.fonts.body}', sans-serif` }}
                        >
                          &ldquo;{tagline}&rdquo;
                        </p>
                        {selectedBadge(selections.tagline === tagline && !keepCurrentItems.has("tagline"))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COLOUR PALETTE OPTIONS */}
            {refinementResults?.colorPalettes && refinementResults.colorPalettes.length > 0 && (
              <div>
                <p className="section-label-accent mb-5">Colour Palette</p>
                <div className="space-y-3">
                  <div
                    onClick={() => selectKeepCurrent("colors")}
                    className={resultCardCls(keepCurrentItems.has("colors"))}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-[10px] tracking-[0.18em] uppercase text-stone">Keep current</p>
                      {selectedBadge(keepCurrentItems.has("colors"))}
                    </div>
                    <div className="flex gap-2 mb-4">
                      {concept.colors.map((color, i) => (
                        <div key={i} className="w-10 h-10 border border-stone/20" style={{ backgroundColor: color }} title={color} />
                      ))}
                    </div>
                    <div className="flex items-center justify-center" style={{ backgroundColor: concept.colors[0], height: "88px" }}>
                      <div style={{ width: "60%" }}>
                        <WordmarkSVG composition={concept.logoComposition} color={concept.wordmarkColor} headingFont={concept.fonts.heading} />
                      </div>
                    </div>
                  </div>

                  {refinementResults.colorPalettes.map((palette, i) => {
                    const isSelected = selections.colorPalette === palette && !keepCurrentItems.has("colors")
                    return (
                      <div
                        key={i}
                        onClick={() => selectAlternative("colors", palette)}
                        className={resultCardCls(isSelected)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-2">
                            {palette.colors.map((color, ci) => (
                              <div key={ci} className="w-10 h-10" style={{ backgroundColor: color }} title={color} />
                            ))}
                          </div>
                          {selectedBadge(isSelected)}
                        </div>
                        <div className="flex items-center justify-center mb-3" style={{ backgroundColor: palette.colors[0], height: "88px" }}>
                          <div style={{ width: "60%" }}>
                            <WordmarkSVG composition={concept.logoComposition} color={palette.wordmarkColor} headingFont={concept.fonts.heading} />
                          </div>
                        </div>
                        {palette.colorRationale && (
                          <p className="text-[12px] text-stone leading-relaxed">{palette.colorRationale}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* FONT PAIRING OPTIONS */}
            {refinementResults?.fontPairings && refinementResults.fontPairings.length > 0 && (
              <div>
                <p className="section-label-accent mb-5">Font Pairing</p>
                <div className="space-y-3">
                  <div
                    onClick={() => selectKeepCurrent("fonts")}
                    className={resultCardCls(keepCurrentItems.has("fonts"))}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] tracking-[0.18em] uppercase text-stone">Keep current</p>
                      {selectedBadge(keepCurrentItems.has("fonts"))}
                    </div>
                    <p
                      className="text-3xl text-ink leading-tight mb-2"
                      style={{ fontFamily: `'${concept.fonts.heading}', serif` }}
                    >
                      {concept.brandName}
                    </p>
                    <p
                      className="text-base text-stone italic mb-3"
                      style={{ fontFamily: `'${concept.fonts.body}', sans-serif` }}
                    >
                      {concept.tagline}
                    </p>
                    <p className="text-[11px] text-stone tracking-[0.1em]">
                      {concept.fonts.heading} / {concept.fonts.body}
                    </p>
                  </div>

                  {refinementResults.fontPairings.map((pairing, i) => {
                    const isSelected = selections.fonts === pairing && !keepCurrentItems.has("fonts")
                    return (
                      <div
                        key={i}
                        onClick={() => selectAlternative("fonts", pairing)}
                        className={resultCardCls(isSelected)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <p
                            className="text-3xl text-ink leading-tight"
                            style={{ fontFamily: `'${pairing.heading}', serif` }}
                          >
                            {concept.brandName}
                          </p>
                          {selectedBadge(isSelected)}
                        </div>
                        <p
                          className="text-base text-stone italic mb-3"
                          style={{ fontFamily: `'${pairing.body}', sans-serif` }}
                        >
                          {concept.tagline}
                        </p>
                        <p className="text-[11px] text-stone tracking-[0.1em]">
                          {pairing.heading} / {pairing.body}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* LOGO COMPOSITION OPTIONS */}
            {refinementResults?.logoCompositions && refinementResults.logoCompositions.length > 0 && (
              <div>
                <p className="section-label-accent mb-5">Logo Composition</p>
                <div className="space-y-3">
                  <div
                    onClick={() => selectKeepCurrent("logo")}
                    className={resultCardCls(keepCurrentItems.has("logo"))}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] tracking-[0.18em] uppercase text-stone">Keep current</p>
                      {selectedBadge(keepCurrentItems.has("logo"))}
                    </div>
                    <div
                      className="flex items-center justify-center"
                      style={{ backgroundColor: concept.colors[0], height: "100px" }}
                    >
                      <div style={{ width: "60%" }}>
                        <WordmarkSVG composition={concept.logoComposition} color={concept.wordmarkColor} headingFont={concept.fonts.heading} />
                      </div>
                    </div>
                  </div>

                  {refinementResults.logoCompositions.map((comp, i) => {
                    const isSelected = selections.logoComposition === comp && !keepCurrentItems.has("logo")
                    return (
                      <div
                        key={i}
                        onClick={() => selectAlternative("logo", comp)}
                        className={resultCardCls(isSelected)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1" />
                          {selectedBadge(isSelected)}
                        </div>
                        <div
                          className="flex items-center justify-center"
                          style={{ backgroundColor: concept.colors[0], height: "100px" }}
                        >
                          <div style={{ width: "60%" }}>
                            <WordmarkSVG composition={comp} color={concept.wordmarkColor} headingFont={concept.fonts.heading} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Sticky apply button */}
      <div className="flex-shrink-0 border-t border-ink-light px-8 py-5">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleApply}
            disabled={!allSelectionsComplete}
            className="w-full h-14 text-sm font-medium tracking-[0.12em] uppercase bg-paper text-ink hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
          >
            Apply {elementsLabel}
          </button>
        </div>
      </div>

    </div>
  )
}
