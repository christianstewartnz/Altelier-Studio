"use client"

import { BriefStepHero } from "@/components/steps/brief-step-hero"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight } from "lucide-react"
import type { ProjectOverviewData } from "@/app/page"

type StepProjectOverviewProps = {
  data: ProjectOverviewData
  onChange: (data: ProjectOverviewData) => void
  onNext: () => void
  currentStep: number
  onGoToStep: (step: number) => void
}

const developmentTypes = [
  "Residential Apartments",
  "Townhouses",
  "Mixed-Use Development",
  "Boutique Residences",
  "Luxury Villas",
  "Commercial Office",
  "Master-Planned Community",
  "Retirement Living"
]

const targetMarkets = [
  "Young Professionals",
  "Families",
  "Downsizers",
  "Investors",
  "Executive Buyers",
  "First Home Buyers",
  "Retirees",
  "International Buyers"
]

const pricePositionings = [
  "Entry Level",
  "Mid Market",
  "Premium",
  "Luxury",
  "Ultra Luxury"
]

export function StepProjectOverview({ data, onChange, onNext, currentStep, onGoToStep }: StepProjectOverviewProps) {
  const isValid =
    data.location &&
    data.developmentType &&
    (Array.isArray(data.targetMarket)
      ? data.targetMarket.length > 0
      : !!data.targetMarket) &&
    data.pricePositioning

  return (
    <div className="animate-fade-up">
      <BriefStepHero
        step="Step 01"
        title="Tell us about your project"
        description="The foundation for a distinctive brand direction starts here."
        currentStep={currentStep}
        onGoToStep={onGoToStep}
      />

      {/* Form Section -- warm off-white background */}
      <section className="py-16 md:py-20 bg-[#FAF9F7]">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-16">
            {/* Location */}
            <div className="space-y-4">
              <Label htmlFor="location" className="field-label">
                Project Location
              </Label>
              <Input
                id="location"
                placeholder="e.g. Remuera, Auckland or Paddington, Sydney"
                value={data.location}
                onChange={(e) => onChange({ ...data, location: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-[#B5281C] transition-colors"
              />
              <p className="text-sm text-stone mt-2">
                Include the suburb and city -- the more specific the location, the more place-specific your brand will feel.
              </p>
            </div>

            {/* Development Type */}
            <div className="space-y-6">
              <Label className="field-label">
                Development Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {developmentTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onChange({ ...data, developmentType: type })}
                    className={`
                      px-5 py-4 text-sm text-left transition-all duration-200 border
                      ${data.developmentType === type
                        ? "bg-[#14110F] text-paper border-ink"
                        : "bg-[#F8F8F8] border-border text-foreground hover:border-[#B5281C]"
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Homes */}
            <div className="space-y-4">
              <Label htmlFor="numberOfHomes" className="field-label">
                Number of Homes / Scale
              </Label>
              <Input
                id="numberOfHomes"
                placeholder="e.g. 8 boutique townhouses, 50 one and two bedroom apartments, 30 standalone homes"
                value={data.numberOfHomes}
                onChange={(e) => onChange({ ...data, numberOfHomes: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-[#B5281C] transition-colors"
              />
              <p className="text-sm text-stone mt-2">
                Scale shapes brand personality -- a boutique 4-home collection feels different to a 120-lot subdivision.
              </p>
            </div>

            {/* Target Market */}
            <div className="space-y-6">
              <Label className="field-label">
                Target Market
                <span className="text-stone-light font-normal ml-2 text-[11px] normal-case tracking-normal">(Select all that apply)</span>
              </Label>
              <p className="text-sm text-stone -mt-3">
                Select all that apply. If you have a primary buyer in mind, they should be first.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {targetMarkets.map((market) => {
                  const isSelected = (Array.isArray(data.targetMarket)
                    ? data.targetMarket
                    : [data.targetMarket]
                  ).includes(market)

                  return (
                    <button
                      key={market}
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(data.targetMarket)
                          ? data.targetMarket
                          : data.targetMarket
                            ? [data.targetMarket]
                            : []
                        const updated = current.includes(market)
                          ? current.filter((m) => m !== market)
                          : [...current, market]
                        onChange({ ...data, targetMarket: updated })
                      }}
                      className={`
                        px-5 py-4 text-sm text-left transition-all duration-200 border
                        ${isSelected
                          ? "bg-[#14110F] text-paper border-ink"
                          : "bg-[#F8F8F8] border-border text-foreground hover:border-[#B5281C]"
                        }
                      `}
                    >
                      {market}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price Positioning */}
            <div className="space-y-6">
              <Label className="field-label">
                Price Positioning
              </Label>
              <p className="text-sm text-stone -mt-3">
                Be honest -- over-positioning creates a brand that doesn&apos;t match the product.
              </p>
              <div className="flex flex-wrap gap-3">
                {pricePositionings.map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => onChange({ ...data, pricePositioning: price })}
                    className={`
                      px-6 py-3 text-sm transition-all duration-200 border
                      ${data.pricePositioning === price
                        ? "bg-[#14110F] text-paper border-ink"
                        : "bg-[#F8F8F8] border-border text-foreground hover:border-[#B5281C]"
                      }
                    `}
                  >
                    {price}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="pt-8 flex justify-end border-t border-border">
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
