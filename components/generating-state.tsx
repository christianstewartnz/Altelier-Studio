"use client"

import { useState, useEffect } from "react"
import { Logo } from "@/components/logo"

const NAMES_MESSAGES = [
  "Reading your brief...",
  "Exploring naming directions...",
  "Finding names that fit...",
  "Shortlisting the strongest options...",
]

export function GeneratingState({ message, mode = "concepts" }: {
  message: string
  mode?: "names" | "concepts"
}) {
  const [namesMessageIndex, setNamesMessageIndex] = useState(0)

  useEffect(() => {
    if (mode !== "names") return
    const interval = setInterval(() => {
      setNamesMessageIndex(i => (i + 1) % NAMES_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [mode])

  const displayMessage = mode === "names" ? NAMES_MESSAGES[namesMessageIndex] : message
  return (
    <>
    <style>{`
      @keyframes wave {
        0%, 100% { transform: translateY(0px); opacity: 0.4; }
        50% { transform: translateY(-8px); opacity: 1; }
      }
    `}</style>
    <div className="min-h-screen bg-[#14110F] flex flex-col px-6">
      {/* Logo — top-left */}
      <div className="pt-8 pl-2">
        <Logo reversed height={44} />
      </div>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
        <div className="max-w-lg w-full">
          {/* Message */}
          <h1 className="font-serif text-4xl md:text-5xl text-[#FEFFEF] tracking-tight text-balance mb-10">
            {displayMessage}
          </h1>

          {/* Wave dot animation */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <span
              className="block w-2 h-2 rounded-full bg-[#B5281C]"
              style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0s" }}
            />
            <span
              className="block w-2 h-2 rounded-full bg-[#B5281C]"
              style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.2s" }}
            />
            <span
              className="block w-2 h-2 rounded-full bg-[#B5281C]"
              style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.4s" }}
            />
          </div>

          {/* Subline */}
          <p className="text-sm text-stone-light">
            Great work takes a moment.
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
