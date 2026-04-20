"use client"

import { ArrowLeft } from "lucide-react"

type WorkflowHeaderProps = {
  currentStep: number
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

export function WorkflowHeader({ currentStep, onGoToStep, onStartOver, onOpenInstructions }: WorkflowHeaderProps) {
  return (
    <header className="sticky top-0 z-[70] bg-ink text-paper grain-texture">
      <div className="mx-auto max-w-6xl px-6 relative z-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo — top left */}
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl md:text-3xl tracking-tight">Atelier</span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-stone-light font-medium">Studio</span>
          </div>

          {/* Progress Steps — Desktop */}
          <nav className="hidden md:flex items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => step.number <= currentStep && onGoToStep(step.number)}
                  disabled={step.number > currentStep}
                  className={`
                    relative px-5 py-2 text-sm font-medium transition-all duration-200
                    ${currentStep === step.number
                      ? "text-paper"
                      : currentStep > step.number
                        ? "text-stone-light hover:text-paper"
                        : "text-stone cursor-not-allowed"
                    }
                  `}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`
                      flex items-center justify-center w-6 h-6 text-xs font-medium border transition-all
                      ${currentStep === step.number
                        ? "border-paper bg-paper text-ink"
                        : currentStep > step.number
                          ? "border-stone-light text-stone-light"
                          : "border-stone text-stone"
                      }
                    `}>
                      {currentStep > step.number ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </span>
                    {step.label}
                  </span>

                  {/* Active indicator line — terracotta accent */}
                  {currentStep === step.number && (
                    <span className="absolute bottom-0 left-5 right-5 h-[2px] bg-terracotta" />
                  )}
                </button>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={`w-8 h-px ${
                    currentStep > step.number ? "bg-stone-light" : "bg-stone"
                  }`} />
                )}
              </div>
            ))}
          </nav>

          {/* Mobile Step Indicator */}
          <div className="md:hidden flex items-center gap-3">
            <span className="text-sm text-stone-light">
              <span className="text-paper font-medium">{currentStep}</span>
              <span className="mx-1">/</span>
              <span>4</span>
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {onOpenInstructions && (
              <button
                onClick={onOpenInstructions}
                title="Brief instructions"
                className="w-7 h-7 flex items-center justify-center border border-stone text-stone-light text-xs font-medium hover:border-stone-light hover:text-paper transition-colors"
              >
                ?
              </button>
            )}
            <button
              onClick={onStartOver}
              className="flex items-center gap-2 text-sm text-stone-light hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="md:hidden pb-4">
          <div className="flex gap-1.5">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`h-0.5 flex-1 transition-all ${
                  currentStep >= step.number ? "bg-terracotta" : "bg-stone"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
