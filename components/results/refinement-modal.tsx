"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { BrandConcept, LogoComposition } from "./results-overview"
import { WordmarkSVG } from "./wordmark-svg"
import { getContrastColor } from "@/lib/color-utils"

type RefinementResults = {
  names?: string[]
  taglines?: string[]
  colorPalettes?: Array<{
    colors: string[]
    wordmarkColor: string
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
  refinementsRemaining: number
  onClose: () => void
  onApplyRefinements: (updatedConcept: BrandConcept) => void
}

const REFINEMENT_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "tagline", label: "Marketing Tagline" },
  { id: "colors", label: "Colour Palette" },
  { id: "fonts", label: "Font Pairing" },
  { id: "logo", label: "Logo Composition" }
]

export function RefinementModal({
  concept,
  refinementsRemaining,
  onClose,
  onApplyRefinements
}: RefinementModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [contextInputs, setContextInputs] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [refinementResults, setRefinementResults] = useState<RefinementResults | null>(null)
  const [selections, setSelections] = useState<RefinementSelections>({})

  function toggleItem(id: string) {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function handleRefine() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          selectedItems,
          contextInputs
        })
      })
      const data = await response.json()
      setRefinementResults(data)
    } catch (error) {
      console.error("Refinement failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleApply() {
    const updatedConcept = { ...concept }

    if (selections.name) {
      updatedConcept.brandName = selections.name
      const newLines = selections.name.includes(" ")
        ? selections.name.split(" ").slice(0, 2)
        : [selections.name, updatedConcept.logoComposition.lines[1] || ""]
      updatedConcept.logoComposition = {
        ...updatedConcept.logoComposition,
        lines: newLines
      }
    }

    if (selections.tagline) updatedConcept.tagline = selections.tagline
    if (selections.colorPalette) {
      updatedConcept.colors = selections.colorPalette.colors
      updatedConcept.wordmarkColor = selections.colorPalette.wordmarkColor
    }
    if (selections.fonts) updatedConcept.fonts = selections.fonts
    if (selections.logoComposition) {
      updatedConcept.logoComposition = selections.logoComposition
    }

    onApplyRefinements(updatedConcept)
  }

  const allSelectionsComplete = selectedItems.every(item => {
    if (item === "name") return !!selections.name
    if (item === "tagline") return !!selections.tagline
    if (item === "colors") return !!selections.colorPalette
    if (item === "fonts") return !!selections.fonts
    if (item === "logo") return !!selections.logoComposition
    return true
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-border">

        {/* LOADING STATE */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-16">
            <p className="font-serif text-2xl text-foreground tracking-tight mb-8 text-center">
              Refining your concept...
            </p>
            <style>{`
              @keyframes wave {
                0%, 100% { transform: translateY(0px); opacity: 0.4; }
                50% { transform: translateY(-8px); opacity: 1; }
              }
            `}</style>
            <div className="flex items-center justify-center gap-2">
              <span className="block w-2 h-2 rounded-full bg-foreground"
                style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0s" }} />
              <span className="block w-2 h-2 rounded-full bg-foreground"
                style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.2s" }} />
              <span className="block w-2 h-2 rounded-full bg-foreground"
                style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.4s" }} />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-6">
              This usually takes 15-20 seconds
            </p>
          </div>
        )}

        {/* REQUEST STATE */}
        {!isLoading && !refinementResults && (
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-foreground tracking-tight">
                Refine This Concept
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Concept preview */}
            <div className="flex items-center gap-4 mb-2">
              <div
                className="rounded-xl px-4 py-2 flex items-center justify-center"
                style={{ backgroundColor: concept.colors[0], width: "120px" }}
              >
                <WordmarkSVG
                  composition={concept.logoComposition}
                  color={concept.wordmarkColor}
                  headingFont={concept.fonts.heading}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {concept.brandName}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  {concept.conceptTitle}
                </p>
              </div>
            </div>

            {/* Refinements remaining */}
            <p className="text-xs text-muted-foreground mb-6">
              {refinementsRemaining} refinement
              {refinementsRemaining !== 1 ? "s" : ""} remaining
            </p>

            <div className="border-t border-border mb-6" />

            {/* Options */}
            <p className="text-sm font-medium text-foreground mb-4">
              What would you like to refine?
            </p>

            <div className="space-y-1">
              {REFINEMENT_OPTIONS.map(option => {
                const isSelected = selectedItems.includes(option.id)
                return (
                  <div key={option.id}>
                    <div
                      className="flex items-center gap-3 py-3 border-b border-border/50 cursor-pointer"
                      onClick={() => toggleItem(option.id)}
                    >
                      <div className={`size-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "border-foreground bg-foreground"
                          : "border-border"
                      }`}>
                        {isSelected && (
                          <svg className="size-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-foreground">
                        {option.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="pl-8 py-3 border-b border-border/50">
                        <Textarea
                          placeholder={`What don't you like about the current ${option.label.toLowerCase()}? (Optional)`}
                          value={contextInputs[option.id] || ""}
                          onChange={e => setContextInputs(prev => ({
                            ...prev,
                            [option.id]: e.target.value
                          }))}
                          rows={2}
                          className="px-4 py-3 bg-secondary border-border rounded-2xl text-sm placeholder:text-muted-foreground/60 resize-none"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Refine button */}
            <Button
              onClick={handleRefine}
              disabled={selectedItems.length === 0}
              className="w-full h-14 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all duration-200 mt-8"
            >
              Refine Concept
            </Button>
          </div>
        )}

        {/* RESULTS STATE */}
        {!isLoading && refinementResults && (
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif text-2xl text-foreground tracking-tight">
                Your Refinement Options
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Select your preferred option for each refined element
            </p>

            <div className="space-y-8">

              {/* NAME OPTIONS */}
              {refinementResults.names && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                      Name
                    </span>
                    <span className="text-xs text-muted-foreground italic">
                      Current: {concept.brandName}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {refinementResults.names.map((name, i) => (
                      <div
                        key={i}
                        onClick={() => setSelections(prev => ({ ...prev, name }))}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selections.name === name
                            ? "border-foreground bg-secondary"
                            : "border-border bg-card hover:border-foreground/40"
                        }`}
                      >
                        <p
                          className="text-2xl text-foreground"
                          style={{ fontFamily: `'${concept.fonts.heading}', serif` }}
                        >
                          {name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAGLINE OPTIONS */}
              {refinementResults.taglines && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                      Tagline
                    </span>
                    <span className="text-xs text-muted-foreground italic">
                      Current: {concept.tagline}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {refinementResults.taglines.map((tagline, i) => (
                      <div
                        key={i}
                        onClick={() => setSelections(prev => ({ ...prev, tagline }))}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selections.tagline === tagline
                            ? "border-foreground bg-secondary"
                            : "border-border bg-card hover:border-foreground/40"
                        }`}
                      >
                        <p
                          className="text-base italic text-foreground"
                          style={{ fontFamily: `'${concept.fonts.body}', sans-serif` }}
                        >
                          {tagline}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COLOUR PALETTE OPTIONS */}
              {refinementResults.colorPalettes && (
                <div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                        Colour Palette
                      </span>
                      <span className="text-xs text-muted-foreground italic">
                        Current
                      </span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      {concept.colors.map((color, i) => (
                        <div
                          key={i}
                          className="size-8 rounded-full border border-border/30 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {refinementResults.colorPalettes.map((palette, i) => (
                      <div
                        key={i}
                        onClick={() => setSelections(prev => ({
                          ...prev,
                          colorPalette: palette
                        }))}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selections.colorPalette === palette
                            ? "border-foreground bg-secondary"
                            : "border-border bg-card hover:border-foreground/40"
                        }`}
                      >
                        <div className="flex gap-2 mb-3">
                          {palette.colors.map((color, ci) => (
                            <div
                              key={ci}
                              className="size-8 rounded-full border border-border/30 shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div
                          className="rounded-lg px-3 py-2 flex items-center justify-center"
                          style={{ backgroundColor: palette.colors[0] }}
                        >
                          <WordmarkSVG
                            composition={concept.logoComposition}
                            color={palette.wordmarkColor}
                            headingFont={concept.fonts.heading}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FONT PAIRING OPTIONS */}
              {refinementResults.fontPairings && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                      Font Pairing
                    </span>
                    <span className="text-xs text-muted-foreground italic">
                      Current: {concept.fonts.heading}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {refinementResults.fontPairings.map((pairing, i) => (
                      <div
                        key={i}
                        onClick={() => setSelections(prev => ({
                          ...prev,
                          fonts: pairing
                        }))}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selections.fonts === pairing
                            ? "border-foreground bg-secondary"
                            : "border-border bg-card hover:border-foreground/40"
                        }`}
                      >
                        <p
                          className="text-xl text-foreground mb-1"
                          style={{ fontFamily: `'${pairing.heading}', serif` }}
                        >
                          {concept.brandName}
                        </p>
                        <p
                          className="text-sm text-muted-foreground italic"
                          style={{ fontFamily: `'${pairing.body}', sans-serif` }}
                        >
                          {concept.tagline}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {pairing.heading} / {pairing.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LOGO COMPOSITION OPTIONS */}
              {refinementResults.logoCompositions && (
                <div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                        Logo Composition
                      </span>
                      <span className="text-xs text-muted-foreground italic">
                        Current
                      </span>
                    </div>
                    <div
                      className="rounded-xl px-4 py-3 flex items-center justify-center mb-3"
                      style={{ backgroundColor: concept.colors[0] }}
                    >
                      <WordmarkSVG
                        composition={concept.logoComposition}
                        color={concept.wordmarkColor}
                        headingFont={concept.fonts.heading}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {refinementResults.logoCompositions.map((comp, i) => (
                      <div
                        key={i}
                        onClick={() => setSelections(prev => ({
                          ...prev,
                          logoComposition: comp
                        }))}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selections.logoComposition === comp
                            ? "border-foreground bg-secondary"
                            : "border-border bg-card hover:border-foreground/40"
                        }`}
                      >
                        <div
                          className="rounded-xl px-4 py-3 flex items-center justify-center"
                          style={{ backgroundColor: concept.colors[0] }}
                        >
                          <WordmarkSVG
                            composition={comp}
                            color={concept.wordmarkColor}
                            headingFont={concept.fonts.heading}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Apply button */}
            <Button
              onClick={handleApply}
              disabled={!allSelectionsComplete}
              className="w-full h-14 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all duration-200 mt-8"
            >
              Apply Refinements
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
