"use client"

import { useState, useEffect } from "react"
import { Download, Loader2 } from "lucide-react"
import { initFungies, getFungies } from "@/lib/fungies"

type ExportButtonProps = {
  conceptId: string
  projectId: string
  userId?: string
}

export function ExportButton({ conceptId, projectId, userId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [alreadyPurchased, setAlreadyPurchased] = useState(false)
  const [error, setError] = useState("")

  // Initialise Fungies SDK on mount
  useEffect(() => {
    initFungies()
  }, [])

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
        if (data.alreadyPurchased) {
          setAlreadyPurchased(true)
        }
      } catch {
        // silently fail
      }
    }
    checkPurchase()
  }, [conceptId, projectId])

  function openOverlay() {
    const checkoutUrl = process.env.NEXT_PUBLIC_FUNGIES_OVERLAY_URL
    if (!checkoutUrl) {
      setError("Checkout unavailable. Please try again.")
      return
    }

    const successUrl = `${window.location.origin}${window.location.pathname}?payment=success`
    const fullUrl = `${checkoutUrl}&success_url=${encodeURIComponent(successUrl)}`

    const Fungies = getFungies()
    if (Fungies?.Checkout?.open) {
      Fungies.Checkout.open({
        checkoutUrl: fullUrl,
        settings: { mode: "overlay" },
        customFields: {
          concept_id: conceptId,
          project_id: projectId,
          user_id: userId || ""
        }
      })

      // Listen for checkout completion
      document.addEventListener("fungies:checkout:complete", () => {
        setAlreadyPurchased(true)
      }, { once: true })

    } else {
      // Fallback to new tab
      window.open(fullUrl, "_blank")
    }
  }

  async function handleDownload() {
    if (alreadyPurchased) {
      alert("Export coming soon — files will download here")
      return
    }

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
        openOverlay()
        setLoading(false)
        return
      }

      setError("Something went wrong. Please try again.")
    } catch {
      setError("Something went wrong. Please try again.")
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="h-14 px-10 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Download className="size-5" />
        )}
        {alreadyPurchased ? "Download Brand Package" : "Purchase & Download — $429 NZD"}
      </button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {alreadyPurchased && (
        <p className="text-sm text-muted-foreground">
          Your brand package is ready to download
        </p>
      )}
    </div>
  )
}
