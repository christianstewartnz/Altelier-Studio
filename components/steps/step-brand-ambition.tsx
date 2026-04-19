"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import type { BrandAmbitionData } from "@/app/page"

type StepBrandAmbitionProps = {
  data: BrandAmbitionData
  onChange: (data: BrandAmbitionData) => void
  onNext: () => void
  onPrevious: () => void
}

const brandDirections = [
  {
    id: "premium-refined",
    title: "Premium & Refined",
    description: "Elegant sophistication with attention to detail and quality materials. Appeals to discerning buyers seeking understated luxury.",
    visual: "Muted tones, serif typography, minimal ornamentation"
  },
  {
    id: "modern-architectural",
    title: "Modern & Architectural",
    description: "Clean lines, bold forms, and contemporary design language. Speaks to those who appreciate design-forward living.",
    visual: "Monochromatic palette, geometric forms, sans-serif type"
  },
  {
    id: "warm-local",
    title: "Warm & Local",
    description: "Connected to place and community with an authentic, welcoming character. Resonates with families and local buyers.",
    visual: "Earthy tones, organic textures, approachable typography"
  },
  {
    id: "calm-coastal",
    title: "Calm & Coastal",
    description: "Relaxed, natural, and inspired by water and light. Perfect for beachside or waterfront developments.",
    visual: "Blue-green palette, light and airy, flowing forms"
  },
  {
    id: "bold-contemporary",
    title: "Bold & Contemporary",
    description: "Dynamic, confident, and unapologetically modern. Attracts buyers seeking a statement address.",
    visual: "Strong contrasts, striking graphics, impactful imagery"
  },
  {
    id: "timeless-understated",
    title: "Timeless & Understated",
    description: "Classic elegance that transcends trends. Appeals to buyers seeking lasting value and quiet confidence.",
    visual: "Neutral palette, classic proportions, refined details"
  }
]

export function StepBrandAmbition({ data, onChange, onNext, onPrevious }: StepBrandAmbitionProps) {
  const isValid = data.direction && data.buyerFeeling && data.pointOfDifference

  return (
    <div className="animate-fade-up">
      {/* Hero Section — with grain texture */}
      <section className="bg-ink text-paper py-16 md:py-24 grain-texture">
        <div className="mx-auto max-w-3xl px-6 relative z-10">
          <div className="max-w-xl">
            <p className="step-label text-stone-light mb-6">Step 03</p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6 text-balance leading-[1.1]">
              What direction speaks to you?
            </h1>
            <p className="text-lg text-stone-light leading-relaxed max-w-md">
              Choose the brand territory that feels closest to your vision.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section — warm off-white background */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-16">
            {/* Buyer Feeling */}
            <div className="space-y-4">
              <Label htmlFor="buyerFeeling" className="field-label">
                What should buyers feel when they first hear the name?
              </Label>
              <Input
                id="buyerFeeling"
                placeholder="e.g. Arrived. Proud. Like they've discovered something others haven't."
                value={data.buyerFeeling}
                onChange={(e) => onChange({ ...data, buyerFeeling: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-terracotta transition-colors"
              />
            </div>

            {/* Point of Difference */}
            <div className="space-y-4">
              <Label htmlFor="pointOfDifference" className="field-label">
                How is this development different from others nearby?
              </Label>
              <Input
                id="pointOfDifference"
                placeholder="e.g. Only boutique development on this street. Larger section sizes than comparable projects."
                value={data.pointOfDifference}
                onChange={(e) => onChange({ ...data, pointOfDifference: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-terracotta transition-colors"
              />
            </div>

            {/* Brand Directions */}
            <div className="space-y-6">
              <Label className="field-label">
                Choose a Direction
              </Label>
              <div className="grid gap-4">
                {brandDirections.map((direction) => {
                  const isSelected = data.direction === direction.id
                  return (
                    <button
                      key={direction.id}
                      type="button"
                      onClick={() => onChange({ ...data, direction: direction.id })}
                      className={`
                        relative text-left p-6 md:p-8 transition-all duration-300 border-2
                        ${isSelected
                          ? "bg-ink text-paper border-ink"
                          : "bg-paper border-border hover:border-terracotta"
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`font-serif text-xl md:text-2xl mb-2 ${
                            isSelected ? "text-paper" : "text-foreground"
                          }`}>
                            {direction.title}
                          </h3>
                          <p className={`text-sm md:text-base leading-relaxed mb-3 ${
                            isSelected ? "text-stone-light" : "text-stone"
                          }`}>
                            {direction.description}
                          </p>
                          <p className="text-xs italic text-stone-light">
                            {direction.visual}
                          </p>
                        </div>
                        <div className={`flex-shrink-0 w-7 h-7 border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-paper bg-paper text-ink"
                            : "border-border"
                        }`}>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Words to Avoid */}
            <div className="space-y-4">
              <Label htmlFor="wordsToAvoid" className="field-label">
                Words to Avoid
                <span className="text-stone-light font-normal ml-2 text-[11px] normal-case tracking-normal">(Optional)</span>
              </Label>
              <Input
                id="wordsToAvoid"
                placeholder="e.g., luxe, exclusive, paradise, oasis"
                value={data.wordsToAvoid}
                onChange={(e) => onChange({ ...data, wordsToAvoid: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-terracotta transition-colors"
              />
              <p className="text-xs text-stone">
                List any words or phrases you&apos;d prefer we don&apos;t use in naming or messaging.
              </p>
            </div>

            {/* References & Additional Thoughts */}
            <div className="space-y-4">
              <Label htmlFor="additionalInfo" className="field-label">
                References & Additional Thoughts
                <span className="text-stone-light font-normal ml-2 text-[11px] normal-case tracking-normal">(Optional)</span>
              </Label>
              <Textarea
                id="additionalInfo"
                placeholder="Share any brands, projects or aesthetics you admire, plus any other thoughts, constraints or preferences we should know before generating."
                value={data.additionalInfo}
                onChange={(e) => onChange({ ...data, additionalInfo: e.target.value })}
                rows={4}
                className="px-0 py-4 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-terracotta transition-colors resize-none"
              />
            </div>

            {/* Navigation */}
            <div className="pt-8 flex justify-between border-t border-border">
              <Button
                variant="ghost"
                onClick={onPrevious}
                className="h-14 px-6 text-base font-medium text-stone hover:text-foreground hover:bg-cream transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>
              <Button
                onClick={onNext}
                disabled={!isValid}
                className="h-14 px-10 text-base font-medium bg-ink text-paper hover:bg-ink-light disabled:opacity-40 transition-all duration-200 group"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
