"use client"

import { BriefStepHero } from "@/components/steps/brief-step-hero"
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
      <BriefStepHero
        step="Step 03"
        title="What direction speaks to you?"
        description="Choose the brand territory that feels closest to your vision."
      />

      {/* Form Section -- warm off-white background */}
      <section className="py-16 md:py-20 bg-[#FAF9F7]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-16">
            {/* Buyer Feeling */}
            <div className="space-y-4">
              <Label htmlFor="buyerFeeling" className="field-label">
                What should buyers feel when they first hear the name?
              </Label>
              <Input
                id="buyerFeeling"
                placeholder="e.g. Like they finally cracked this suburb without compromising. Proud of the address without being pretentious about it. Like they made a smart, considered choice."
                value={data.buyerFeeling}
                onChange={(e) => onChange({ ...data, buyerFeeling: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-[#B5281C] transition-colors"
              />
              <p className="text-sm text-stone mt-2">
                This is the most important field in the brief. Don&apos;t describe the development -- describe the emotion. What should a buyer feel the moment they first hear the name?
              </p>
            </div>

            {/* Point of Difference */}
            <div className="space-y-4">
              <Label htmlFor="pointOfDifference" className="field-label">
                How is this development different from others nearby?
              </Label>
              <Input
                id="pointOfDifference"
                placeholder="e.g. Only 8 homes on a street of 200. Larger sections than any comparable project nearby. The only development in this suburb with a communal garden."
                value={data.pointOfDifference}
                onChange={(e) => onChange({ ...data, pointOfDifference: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-[#B5281C] transition-colors"
              />
              <p className="text-sm text-stone mt-2">
                What would make someone choose this over the development on the next street? Be specific -- &lsquo;better quality&rsquo; and &lsquo;great location&rsquo; don&apos;t count.
              </p>
            </div>

            {/* Brand Directions */}
            <div className="space-y-6">
              <Label className="field-label">
                Choose a Direction
              </Label>
              <p className="text-sm text-stone -mt-3">
                Choose the territory that feels closest to your vision. This is a creative starting point -- the AI will develop it specifically for your project.
              </p>
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
                          ? "bg-[#14110F] text-paper border-ink"
                          : "bg-[#F8F8F8] border-border hover:border-[#B5281C]"
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
                            ? "border-paper bg-[#F8F8F8] text-ink"
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
                placeholder="e.g. luxury, exclusive, premium, prestige, paradise, oasis, haven"
                value={data.wordsToAvoid}
                onChange={(e) => onChange({ ...data, wordsToAvoid: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-[#B5281C] transition-colors"
              />
              <p className="text-sm text-stone mt-2">
                Adding words to avoid pushes the AI toward more unexpected, ownable naming. What terms feel overused or wrong for this project?
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
                placeholder="e.g. We love the branding Time & Place did for Aura in Brisbane. The project has a strong architectural story -- the faÃ§ade uses raw concrete and brass detailing. The developer wants something that will still feel relevant in 20 years."
                value={data.additionalInfo}
                onChange={(e) => onChange({ ...data, additionalInfo: e.target.value })}
                rows={4}
                className="px-0 py-4 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-[#B5281C] transition-colors resize-none"
              />
              <p className="text-sm text-stone mt-2">
                Brands you admire, architectural references, developer preferences, or anything else that gives us creative direction. The more context the better.
              </p>
            </div>

            {/* Navigation */}
            <div className="pt-8 flex justify-between border-t border-border">
              <Button
                variant="ghost"
                onClick={onPrevious}
                className="h-14 px-6 text-base font-medium text-stone hover:text-foreground hover:bg-[#FAF9F7] transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>
              <Button
                onClick={onNext}
                disabled={!isValid}
                className="h-14 px-10 text-base font-medium bg-[#14110F] text-paper hover:bg-[#14110F]-light disabled:opacity-40 transition-all duration-200 group"
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
