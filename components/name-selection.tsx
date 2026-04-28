"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"

type NameOption = {
  name: string
  rationale: string
  territory: string
}

type NameSelectionProps = {
  projectName: string
  names: NameOption[]
  onNameSelected: (chosen: NameOption) => void
  isGenerating: boolean
}

export function NameSelection({ projectName, names, onNameSelected, isGenerating }: NameSelectionProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<NameOption | null>(null)

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <AppHeader
        breadcrumbs={[{ label: "Names" }]}
        actions={(
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-[#4E473F] transition-colors hover:text-[#B5281C]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Dashboard
          </button>
        )}
      />

      {/* Hero */}
      <section className="py-12 md:py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <p className="section-label-accent mb-4">CHOOSE YOUR NAME</p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-foreground mb-4">
            Nine directions for {projectName}
          </h1>
          <p className="text-base text-muted-foreground max-w-xl">
            Select the name that feels most true to your project. We&apos;ll build three complete brand concepts around your choice.
          </p>
        </div>
      </section>

      {/* Name grid */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {names.map((option, i) => {
              const isSelected = selected?.name === option.name && selected?.territory === option.territory
              return (
                <button
                  key={`${option.territory}-${i}`}
                  onClick={() => setSelected(option)}
                  className={[
                    "text-left p-8 border transition-all duration-150",
                    isSelected
                      ? "bg-[#14110F] text-paper border-[#B5281C]"
                      : "bg-[#F8F8F8] border-border hover:border-[#B5281C]",
                  ].join(" ")}
                >
                  <p className={[
                    "font-serif text-3xl mb-3",
                    isSelected ? "text-paper" : "text-foreground",
                  ].join(" ")}>
                    {option.name}
                  </p>
                  <p className={[
                    "text-sm italic leading-relaxed",
                    isSelected ? "text-paper/70" : "text-muted-foreground",
                  ].join(" ")}>
                    {option.rationale}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => selected && onNameSelected(selected)}
            disabled={!selected || isGenerating}
            className={[
              "w-full h-14 text-base font-medium transition-all duration-200 flex items-center justify-center gap-3",
              selected && !isGenerating
                ? "bg-[#14110F] text-paper hover:bg-[#14110F]/90"
                : "bg-[#14110F]/40 text-paper/50 cursor-not-allowed",
            ].join(" ")}
          >
            {isGenerating ? (
              <>
                <span className="flex gap-1.5 items-center">
                  <span
                    className="block w-1.5 h-1.5 rounded-full bg-[#F8F8F8]/60"
                    style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0s" }}
                  />
                  <span
                    className="block w-1.5 h-1.5 rounded-full bg-[#F8F8F8]/60"
                    style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.2s" }}
                  />
                  <span
                    className="block w-1.5 h-1.5 rounded-full bg-[#F8F8F8]/60"
                    style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.4s" }}
                  />
                </span>
                Building your brand concepts...
              </>
            ) : (
              "Build My Brand â†’"
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
