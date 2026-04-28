"use client"

const steps = [
  { number: 1, label: "Project" },
  { number: 2, label: "Place" },
  { number: 3, label: "Direction" },
  { number: 4, label: "Review" },
] as const

export type BriefWorkflowStepsProps = {
  currentStep: number
  onGoToStep: (step: number) => void
}

export function BriefWorkflowSteps({ currentStep, onGoToStep }: BriefWorkflowStepsProps) {
  return (
    <div className="mb-8 flex w-full flex-col items-center gap-4">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 md:hidden">
        <span className="text-sm text-[#B7ADA2] tabular-nums">
          <span className="font-medium text-[#FEFFEF]">{currentStep}</span>
          <span className="mx-1">/</span>
          <span>4</span>
        </span>
        <div className="flex w-full gap-1.5">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`h-0.5 min-w-0 flex-1 transition-all ${
                currentStep >= step.number ? "bg-[#B5281C]" : "bg-[#5C534C]"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="hidden w-full md:flex md:justify-center">
        <nav
          className="inline-flex max-w-full flex-wrap items-center justify-center gap-y-2"
          aria-label="Brief progress"
        >
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                type="button"
                onClick={() => step.number <= currentStep && onGoToStep(step.number)}
                disabled={step.number > currentStep}
                className={`
                  relative px-4 py-2 text-sm font-medium transition-all duration-200 lg:px-5
                  ${currentStep === step.number
                    ? "text-[#FEFFEF]"
                    : currentStep > step.number
                      ? "text-[#B7ADA2] hover:text-[#E7E0D8]"
                      : "cursor-not-allowed text-[#6B635C]"
                  }
                `}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`
                    flex h-6 w-6 shrink-0 items-center justify-center border text-xs font-medium transition-all
                    ${currentStep === step.number
                      ? "border-[#FEFFEF] bg-[#FEFFEF] text-[#3A342F]"
                      : currentStep > step.number
                        ? "border-[#B7ADA2] text-[#D1C7BD]"
                        : "border-[#5C534C] text-[#5C534C]"
                    }
                  `}
                  >
                    {currentStep > step.number ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </span>
                  {step.label}
                </span>

                {currentStep === step.number && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#B5281C] lg:left-5 lg:right-5" />
                )}
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`h-px w-6 shrink-0 lg:w-8 ${
                    currentStep > step.number ? "bg-[#8A7F72]" : "bg-[#5C534C]"
                  }`}
                />
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
