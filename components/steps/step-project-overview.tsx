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
  const isValid = data.location && data.developmentType && data.targetMarket && data.pricePositioning

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-20">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-5 text-balance">
            Tell us about your project
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            We&apos;ll use this to shape a distinctive brand direction.
          </p>
        </div>

        <div className="space-y-12">
          {/* Location */}
          <div className="space-y-3">
            <Label htmlFor="location" className="text-sm font-medium text-foreground">
              Project Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Paddington, Sydney"
              value={data.location}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
              className="h-14 px-5 bg-card border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Development Type */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">
              Development Type
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {developmentTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ ...data, developmentType: type })}
                  className={`px-5 py-4 rounded-2xl text-sm text-left transition-all duration-200 ${
                    data.developmentType === type
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Homes */}
          <div className="space-y-3">
            <Label htmlFor="numberOfHomes" className="text-sm font-medium text-foreground">
              Number of Homes / Scale
            </Label>
            <Input
              id="numberOfHomes"
              placeholder="e.g., 24 apartments, 120 lots, boutique 8-unit building"
              value={data.numberOfHomes}
              onChange={(e) => onChange({ ...data, numberOfHomes: e.target.value })}
              className="h-14 px-5 bg-card border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Target Market */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">
              Target Market
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {targetMarkets.map((market) => (
                <button
                  key={market}
                  type="button"
                  onClick={() => onChange({ ...data, targetMarket: market })}
                  className={`px-5 py-4 rounded-2xl text-sm text-left transition-all duration-200 ${
                    data.targetMarket === market
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  {market}
                </button>
              ))}
            </div>
          </div>

          {/* Price Positioning */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">
              Price Positioning
            </Label>
            <div className="flex flex-wrap gap-3">
              {pricePositionings.map((price) => (
                <button
                  key={price}
                  type="button"
                  onClick={() => onChange({ ...data, pricePositioning: price })}
                  className={`px-6 py-3.5 rounded-full text-sm transition-all duration-200 ${
                    data.pricePositioning === price
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-8 flex justify-end">
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
