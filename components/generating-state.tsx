"use client"

import { useEffect, useState } from "react"

const generationPhases = [
  "Developing naming territories",
  "Exploring brand concepts",
  "Refining brand directions",
  "Curating visual cues",
  "Finalizing your brief"
]

export function GeneratingState() {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % generationPhases.length)
    }, 2000)

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 95))
    }, 60)

    return () => {
      clearInterval(phaseInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center animate-in fade-in duration-700">
        {/* Logo */}
        <div className="mb-16">
          <span className="font-serif text-3xl tracking-tight text-foreground">Atelier</span>
        </div>

        {/* Animated Dots */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2 rounded-full bg-primary animate-pulse"
              style={{
                animationDelay: `${i * 200}ms`,
                animationDuration: "1.5s"
              }}
            />
          ))}
        </div>

        {/* Phase Text */}
        <div className="h-8 mb-8">
          <p 
            key={currentPhase}
            className="text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {generationPhases[currentPhase]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Subtext */}
        <p className="mt-8 text-sm text-muted-foreground/60">
          This typically takes about 30 seconds
        </p>
      </div>
    </div>
  )
}
