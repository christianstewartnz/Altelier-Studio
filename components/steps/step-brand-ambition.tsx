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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-5 text-balance">
            What direction speaks to you?
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            Choose the brand territory that feels closest to your vision.
          </p>
        </div>

        <div className="space-y-12">
          <div className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="buyerFeeling" className="text-sm font-medium text-foreground">
                What should buyers feel when they first hear the name?
              </Label>
              <Input
                id="buyerFeeling"
                name="buyerFeeling"
                type="text"
                placeholder="e.g. Arrived. Proud. Like they've discovered something others haven't. Like it was made for them."
                value={data.buyerFeeling}
                onChange={(e) => onChange({ ...data, buyerFeeling: e.target.value })}
                className="h-14 px-5 bg-card border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="pointOfDifference" className="text-sm font-medium text-foreground">
                How is this development different from others nearby?
              </Label>
              <Input
                id="pointOfDifference"
                name="pointOfDifference"
                type="text"
                placeholder={`e.g. Only boutique development on this street.
Larger section sizes than comparable projects nearby.`}
                value={data.pointOfDifference}
                onChange={(e) => onChange({ ...data, pointOfDifference: e.target.value })}
                className="h-14 px-5 bg-card border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Brand Directions */}
          <div className="space-y-4">
            <div className="grid gap-4">
              {brandDirections.map((direction) => {
                const isSelected = data.direction === direction.id
                return (
                  <button
                    key={direction.id}
                    type="button"
                    onClick={() => onChange({ ...data, direction: direction.id })}
                    className={`relative text-left p-6 md:p-8 rounded-3xl transition-all duration-300 ${
                      isSelected
                        ? "bg-card border-2 border-primary shadow-lg scale-[1.01]"
                        : "bg-card border border-border hover:border-primary/40 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`font-serif text-xl md:text-2xl mb-2 ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}>
                          {direction.title}
                        </h3>
                        <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-3">
                          {direction.description}
                        </p>
                        <p className="text-xs text-muted-foreground/70 italic">
                          {direction.visual}
                        </p>
                      </div>
                      <div className={`flex-shrink-0 size-7 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      }`}>
                        {isSelected && <Check className="size-4" />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Words to Avoid */}
          <div className="space-y-3">
            <Label htmlFor="wordsToAvoid" className="text-sm font-medium text-foreground">
              Words to Avoid
              <span className="text-muted-foreground font-normal ml-2">(Optional)</span>
            </Label>
            <Input
              id="wordsToAvoid"
              placeholder="e.g., luxe, exclusive, paradise, oasis"
              value={data.wordsToAvoid}
              onChange={(e) => onChange({ ...data, wordsToAvoid: e.target.value })}
              className="h-14 px-5 bg-card border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="text-xs text-muted-foreground">
              List any words or phrases you&apos;d prefer we don&apos;t use in naming or messaging.
            </p>
          </div>

          {/* References & Additional Thoughts */}
          <div className="space-y-3">
            <Label htmlFor="additionalInfo" className="text-sm font-medium text-foreground">
              References & Additional Thoughts
              <span className="text-muted-foreground font-normal ml-2">(Optional)</span>
            </Label>
            <Textarea
              id="additionalInfo"
              placeholder="Share any brands, projects or aesthetics you admire, plus any other thoughts, constraints or preferences we should know before generating."
              value={data.additionalInfo}
              onChange={(e) => onChange({ ...data, additionalInfo: e.target.value })}
              rows={4}
              className="px-5 py-4 bg-card border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Navigation */}
          <div className="pt-8 flex justify-between">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="h-14 px-6 rounded-2xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <ArrowLeft className="size-5 mr-2" />
              Previous
            </Button>
            <Button
              onClick={onNext}
              disabled={!isValid}
              className="h-14 px-8 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all duration-200"
            >
              Continue
              <ArrowRight className="size-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
