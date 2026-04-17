"use client"

import { useState, useEffect, useRef } from "react"
import { Download, Loader2 } from "lucide-react"

type ExportButtonProps = {
  conceptId: string
  projectId: string
  userId?: string
}

export function ExportButton({ conceptId, projectId, userId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [alreadyPurchased, setAlreadyPurchased] = useState(false)
  const [proceed, setProceed] = useState(false)
  const [error, setError] = useState("")
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Load Fungies SDK script
  useEffect(() => {
    const existing = document.getElementById("fungies-sdk")
    if (!existing) {
      const script = document.createElement("script")
      script.id = "fungies-sdk"
      script.src = "https://cdn.jsdelivr.net/npm/@fungies/fungies-js@0.7.2"
      script.defer = true
      script.setAttribute("data-auto-init", "")
      document.body.appendChild(script)
    }

    // Listen for checkout completion
    const handleComplete = () => setAlreadyPurchased(true)
    document.addEventListener("fungies:checkout:complete", handleComplete)
    return () => {
      document.removeEventListener("fungies:checkout:complete", handleComplete)
    }
  }, [])

  // Scan DOM when proceed button renders
  useEffect(() => {
    if (proceed) {
      setTimeout(() => {
        // @ts-ignore
        if (window.Fungies?.ScanDOM) window.Fungies.ScanDOM()
      }, 100)
    }
  }, [proceed])

  // Check URL params for payment result on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("payment") === "success") {
      setAlreadyPurchased(true)
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  // Check if already purchased on mount
  useEffect(() => {
    async function checkPurchase() {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conceptId, projectId, checkOnly: true })
        })
        const data = await response.json()
        if (data.alreadyPurchased) setAlreadyPurchased(true)
      } catch {
        // silently fail
      }
    }
    checkPurchase()
  }, [conceptId, projectId])

  async function handleInitialClick() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId, projectId })
      })

      const data = await response.json()

      if (data.alreadyPurchased) {
        setAlreadyPurchased(true)
        setLoading(false)
        return
      }

      if (data.proceed) {
        setProceed(true)
        setLoading(false)
        return
      }

      setError("Something went wrong. Please try again.")
    } catch {
      setError("Something went wrong. Please try again.")
    }

    setLoading(false)
  }

  const checkoutUrl = process.env.NEXT_PUBLIC_FUNGIES_OVERLAY_URL || ""
  const customFieldsJson = JSON.stringify({
    concept_id: conceptId,
    project_id: projectId,
    user_id: userId || ""
  })
  const successUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?payment=success`
    : ""

  if (alreadyPurchased) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => alert("Export coming soon — files will download here")}
          className="h-14 px-10 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Download className="size-5" />
          Download Brand Package
        </button>
        <p className="text-sm text-muted-foreground">
          Your brand package is ready to download
        </p>
      </div>
    )
  }

  if (proceed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          ref={buttonRef}
          className="h-14 px-10 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 flex items-center justify-center gap-2"
          data-fungies-checkout-url={`${checkoutUrl}&success_url=${encodeURIComponent(successUrl)}`}
          data-fungies-mode="overlay"
          data-fungies-custom-fields={customFieldsJson}
        >
          <Download className="size-5" />
          Purchase & Download — $429 NZD
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleInitialClick}
        disabled={loading}
        className="h-14 px-10 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Download className="size-5" />
        )}
        Purchase & Download — $429 NZD
      </button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
