"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

type WorkflowHeaderProps = {
  currentStep: number
  onGoToStep: (step: number) => void
  onStartOver: () => void
}

const steps = [
  { number: 1, label: "Project" },
  { number: 2, label: "Place" },
  { number: 3, label: "Direction" },
  { number: 4, label: "Review" }
]

export function WorkflowHeader({ currentStep, onGoToStep, onStartOver }: WorkflowHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo - Asymmetrical composition */}
          <div className="flex flex-col">
            <span className="font-serif text-2xl md:text-3xl tracking-tight text-[#1C1C1C]">Atelier</span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#6B6B6B] ml-6 -mt-0.5">Studio</span>
          </div>

          {/* Progress Steps - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => onGoToStep(step.number)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    currentStep === step.number
                      ? "text-foreground"
                      : currentStep > step.number
                      ? "text-primary hover:text-primary/80"
                      : "text-muted-foreground/50 cursor-not-allowed"
                  }`}
                  disabled={currentStep < step.number}
                >
                  <span className={`flex items-center justify-center size-6 rounded-full text-xs font-medium transition-all ${
                    currentStep === step.number
                      ? "bg-foreground text-background"
                      : currentStep > step.number
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground/50"
                  }`}>
                    {currentStep > step.number ? (
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </span>
                  <span className="text-sm font-medium">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-px mx-1 ${
                    currentStep > step.number ? "bg-primary/40" : "bg-border"
                  }`} />
                )}
              </div>
            ))}
          </nav>

          {/* Mobile Step Indicator */}
          <div className="md:hidden flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Step {currentStep}</span>
            <span>/</span>
            <span>4</span>
          </div>

          {/* Start Over */}
          {currentStep > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onStartOver}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="size-4 mr-2" />
              <span className="hidden sm:inline">Start Over</span>
            </Button>
          )}
          {currentStep === 1 && <div className="w-[100px]" />}
        </div>

        {/* Mobile Progress Bar */}
        <div className="md:hidden mt-4">
          <div className="flex gap-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`h-1 flex-1 rounded-full transition-all ${
                  currentStep >= step.number ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
