"use client"

import { useState, useEffect } from "react"
import { Download, Loader2 } from "lucide-react"

declare global {
  interface Window {
    Fungies?: {
      ScanDOM: () => void
    }
  }
}

type ExportButtonProps = {
  conceptId: string
  projectId: string
  userId?: string
}

export function ExportButton({ conceptId, projectId, userId }: ExportButtonProps) {
  const [checking, setChecking] = useState(true)
  const [alreadyPurchased, setAlreadyPurchased] = useState(false)

  const checkoutBaseUrl = process.env.NEXT_PUBLIC_FUNGIES_OVERLAY_URL || ""
  const successUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?payment=success`
      : ""
  const checkoutUrl = (() => {
    if (!checkoutBaseUrl) return ""
    try {
      const url = new URL(checkoutBaseUrl)
      if (successUrl) {
        url.searchParams.set("success_url", successUrl)
      }
      return url.toString()
    } catch {
      return checkoutBaseUrl
    }
  })()

  const customFields = JSON.stringify({
    concept_id: conceptId,
    project_id: projectId,
    user_id: userId || ""
  })

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
      } finally {
        setChecking(false)
      }
    }
    checkPurchase()
  }, [conceptId, projectId])

  // Load the Fungies script on mount
  useEffect(() => {
    const scriptSrc = "https://cdn.jsdelivr.net/npm/@fungies/fungies-js@0.7.2"
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptSrc}"]`
    )

    if (existingScript) {
      return
    }

    const script = document.createElement("script")
    script.src = scriptSrc
    script.defer = true
    script.setAttribute("data-auto-init", "")
    document.body.appendChild(script)
  }, [])

  // Call ScanDOM once the purchase check is done and the button is in the DOM
  useEffect(() => {
    if (checking) return
    if (alreadyPurchased) return
    if (!checkoutUrl) return

    let attempts = 0
    const maxAttempts = 50

    const interval = setInterval(() => {
      attempts++
      if (window.Fungies?.ScanDOM) {
        clearInterval(interval)
        window.Fungies.ScanDOM()
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [checking, alreadyPurchased, checkoutUrl])

  if (checking) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          disabled
          className="h-14 px-10 rounded-2xl text-base font-medium bg-foreground text-background disabled:opacity-40 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Loader2 className="size-5 animate-spin" />
          Purchase & Download — $429 NZD
        </button>
      </div>
    )
  }

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

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        data-fungies-checkout-url={checkoutUrl}
        data-fungies-mode="overlay"
        data-fungies-custom-fields={customFields}
        className="h-14 px-10 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Download className="size-5" />
        Purchase & Download — $429 NZD
      </button>
    </div>
  )
}
