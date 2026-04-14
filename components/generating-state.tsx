"use client"

import { APP_NAME, APP_SUBTITLE } from "@/lib/config"

export function GeneratingState({ message }: { message: string }) {
  return (
    <>
    <style>{`
      @keyframes wave {
        0%, 100% { transform: translateY(0px); opacity: 0.4; }
        50% { transform: translateY(-8px); opacity: 1; }
      }
    `}</style>
    <div className="min-h-screen bg-background flex flex-col px-6">
      {/* Logo — top-left, consistent with other screens */}
      <div className="pt-8 pl-2">
        <div className="flex flex-col">
          <span className="font-serif text-2xl md:text-3xl tracking-tight text-[#1C1C1C]">{APP_NAME}</span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#6B6B6B] ml-6 -mt-0.5">{APP_SUBTITLE}</span>
        </div>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
        <div className="max-w-lg w-full">
          {/* Message */}
          <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight text-balance mb-10">
            {message}
          </h1>

          {/* Wave dot animation */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <span
              className="block w-2 h-2 rounded-full bg-foreground"
              style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0s" }}
            />
            <span
              className="block w-2 h-2 rounded-full bg-foreground"
              style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.2s" }}
            />
            <span
              className="block w-2 h-2 rounded-full bg-foreground"
              style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.4s" }}
            />
          </div>

          {/* Subline */}
          <p className="text-sm text-muted-foreground">
            Great work takes a moment.
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
