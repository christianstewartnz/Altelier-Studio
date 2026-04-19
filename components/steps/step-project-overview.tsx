"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight } from "lucide-react"
import type { ProjectOverviewData } from "@/app/page"

type StepProjectOverviewProps = {
  data: ProjectOverviewData
  onChange: (data: ProjectOverviewData) => void
  onNext: () => void
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

export function StepProjectOverview({ data, onChange, onNext }: StepProjectOverviewProps) {
  const isValid =
    data.location &&
    data.developmentType &&
    (Array.isArray(data.targetMarket)
      ? data.targetMarket.length > 0
      : !!data.targetMarket) &&
    data.pricePositioning

  return (
    <div className="animate-fade-up">
      {/* Hero Section — Editorial impact with grain texture */}
      <section className="bg-ink text-paper py-16 md:py-24 grain-texture">
        <div className="mx-auto max-w-3xl px-6 relative z-10">
          <div className="max-w-xl">
            <p className="step-label text-stone-light mb-6">Step 01</p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6 text-balance leading-[1.1]">
              Tell us about your project
            </h1>
            <p className="text-lg text-stone-light leading-relaxed max-w-md">
              The foundation for a distinctive brand direction starts here.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section — warm off-white background */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-16">
            {/* Location */}
            <div className="space-y-4">
              <Label htmlFor="location" className="field-label">
                Project Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., Paddington, Sydney"
                value={data.location}
                onChange={(e) => onChange({ ...data, location: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-terracotta transition-colors"
              />
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
                        ? "bg-ink text-paper border-ink"
                        : "bg-paper border-border text-foreground hover:border-terracotta"
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
                placeholder="e.g., 24 apartments, 120 lots, boutique 8-unit building"
                value={data.numberOfHomes}
                onChange={(e) => onChange({ ...data, numberOfHomes: e.target.value })}
                className="h-14 px-0 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-terracotta transition-colors"
              />
            </div>

            {/* Target Market */}
            <div className="space-y-6">
              <Label className="field-label">
                Target Market
                <span className="text-stone-light font-normal ml-2 text-[11px] normal-case tracking-normal">(Select all that apply)</span>
              </Label>
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
                          ? "bg-ink text-paper border-ink"
                          : "bg-paper border-border text-foreground hover:border-terracotta"
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
              <div className="flex flex-wrap gap-3">
                {pricePositionings.map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => onChange({ ...data, pricePositioning: price })}
                    className={`
                      px-6 py-3 text-sm transition-all duration-200 border
                      ${data.pricePositioning === price
                        ? "bg-ink text-paper border-ink"
                        : "bg-paper border-border text-foreground hover:border-terracotta"
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
