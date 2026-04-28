"use client"

import { BriefWorkflowSteps } from "@/components/steps/brief-workflow-steps"

type BriefStepHeroProps = {
  step: string
  title: string
  description: string
  currentStep: number
  onGoToStep: (step: number) => void
}

export function BriefStepHero({ step, title, description, currentStep, onGoToStep }: BriefStepHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#3A342F] pt-3 pb-16 text-paper md:pt-4 md:pb-24">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(82,74,67,0.98)_0%,rgba(61,54,49,0.96)_55%,rgba(51,45,40,0.98)_100%)]" />

      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <BriefWorkflowSteps currentStep={currentStep} onGoToStep={onGoToStep} />
        <div className="max-w-xl">
          <p className="step-label mb-6 text-[#D1C7BD]">{step}</p>
          <h1 className="mb-6 font-serif text-4xl leading-[1.1] tracking-tight text-balance text-paper md:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-[#E7E0D8]">
            {description}
          </p>
        </div>
      </div>
    </section>
  )
}
