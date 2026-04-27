"use client"

import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"

type WorkflowHeaderProps = {
  currentStep: number
  projectName?: string
  onGoToStep: (step: number) => void
  onStartOver: () => void
  onLogout?: () => void
  onOpenInstructions?: () => void
}

const steps = [
  { number: 1, label: "Project" },
  { number: 2, label: "Place" },
  { number: 3, label: "Direction" },
  { number: 4, label: "Review" }
]

export function WorkflowHeader({
  currentStep,
  projectName,
  onGoToStep,
  onStartOver,
  onOpenInstructions,
}: WorkflowHeaderProps) {
  return (
    <AppHeader
      breadcrumbs={[
        { label: "Projects", href: "/dashboard" },
        { label: projectName || "Project Brief" },
      ]}
      center={(
        <nav className="flex items-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => step.number <= currentStep && onGoToStep(step.number)}
                disabled={step.number > currentStep}
                className={`
                  relative px-5 py-2 text-sm font-medium transition-all duration-200
                  ${currentStep === step.number
                    ? "text-[#14110F]"
                    : currentStep > step.number
                      ? "text-[#7A7268] hover:text-[#14110F]"
                      : "text-[#C8C2BC] cursor-not-allowed"
                  }
                `}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`
                    flex h-6 w-6 items-center justify-center border text-xs font-medium transition-all
                    ${currentStep === step.number
                      ? "border-[#14110F] bg-[#14110F] text-[#FEFFEF]"
                      : currentStep > step.number
                        ? "border-[#7A7268] text-[#7A7268]"
                        : "border-[#C8C2BC] text-[#C8C2BC]"
                    }
                  `}>
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
                  <span className="absolute bottom-0 left-5 right-5 h-[2px] bg-[#B5281C]" />
                )}
              </button>

              {index < steps.length - 1 && (
                <div className={`h-px w-8 ${
                  currentStep > step.number ? "bg-[#C8C2BC]" : "bg-[#E0DAD3]"
                }`} />
              )}
            </div>
          ))}
        </nav>
      )}
      actions={(
        <div className="flex items-center gap-3">
          {onOpenInstructions && (
            <button
              onClick={onOpenInstructions}
              title="Brief instructions"
              className="flex h-7 w-7 items-center justify-center border border-[#7A7268] text-xs font-medium text-[#7A7268] transition-colors hover:border-[#14110F] hover:text-[#14110F]"
            >
              ?
            </button>
          )}
          <button
            onClick={onStartOver}
            className="flex items-center gap-2 text-sm text-[#7A7268] transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      )}
    >
      <div className="flex items-center justify-between gap-4 pb-4 md:hidden">
        <span className="text-sm text-[#7A7268]">
          <span className="font-medium text-[#14110F]">{currentStep}</span>
          <span className="mx-1">/</span>
          <span>4</span>
        </span>

        <div className="flex flex-1 gap-1.5">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`h-0.5 flex-1 transition-all ${
                currentStep >= step.number ? "bg-[#B5281C]" : "bg-[#E0DAD3]"
              }`}
            />
          ))}
        </div>
      </div>
    </AppHeader>
  )
}
