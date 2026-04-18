"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ConceptDetail } from "@/components/results/concept-detail"
import type { BrandConcept } from "@/components/results/results-overview"

export default function ConceptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const conceptId = params.conceptId as string
  const projectId = params.id as string
  const supabase = createClient()
  const [concept, setConcept] = useState<BrandConcept | null>(null)
  const [loading, setLoading] = useState(true)
  const [refinementsRemaining, setRefinementsRemaining] = useState(3)
  const [userId, setUserId] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [isFreeTrial, setIsFreeTrial] = useState(false)

  // Guards handlePaymentDetected so it runs at most once per mount even if
  // both the SDK event and the poll interval fire in the same tick.
  const paymentDetectedRef = useRef(false)

  useEffect(() => {
    async function loadConcept() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const { data, error } = await supabase
        .from("concepts")
        .select("*")
        .eq("id", conceptId)
        .single()

      if (error || !data) {
        router.push("/dashboard")
        return
      }

      setConcept({
        id: data.id,
        conceptTitle: data.concept_title,
        brandName: data.brand_name,
        tagline: data.tagline,
        summary: data.summary || "",
        rationale: data.rationale,
        colors: data.colors,
        wordmarkColor: data.wordmark_color,
        colorRationale: data.color_rationale,
        fonts: data.fonts,
        logoText: data.logo_text || data.brand_name,
        logoComposition: data.logo_composition,
        voiceSample: data.voice_sample,
        attributes: data.attributes
      })

      // Load project paid_at + profile trial flag so the download button
      // can pick the right Fungies overlay URL and whether to show it at all.
      const { data: project } = await supabase
        .from("projects")
        .select("paid_at")
        .eq("id", projectId)
        .maybeSingle()

      setIsPaid(Boolean(project?.paid_at))

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_free_trial")
          .eq("id", user.id)
          .single()
        if (profile) setIsFreeTrial(Boolean(profile.is_free_trial))
      }

      setLoading(false)
    }

    loadConcept()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId, projectId])

  // Mirrors step-review.tsx: listen for the SDK's checkout:complete event as
  // the primary signal, and poll paid_at every 3 s as a safety net in case
  // the postMessage is missed. When either fires, hard-navigate the parent
  // window to the same URL minus `?payment=success` — the page unload
  // disposes of the Fungies overlay iframe as a side effect, and the fresh
  // mount reads paid_at from the DB so `isPaid` starts true and the paid
  // download UI renders immediately. Programmatic `Checkout.close()` is
  // unreliable here because by the time the poll picks up paid_at the
  // checkout iframe has already navigated to our own success_url.
  useEffect(() => {
    if (isPaid) return

    const handlePaymentDetected = () => {
      if (paymentDetectedRef.current) return
      paymentDetectedRef.current = true
      const url = new URL(window.location.href)
      url.searchParams.delete("payment")
      window.location.href = url.toString()
    }

    document.addEventListener("fungies:checkout:complete", handlePaymentDetected)

    const pollInterval = window.setInterval(async () => {
      if (paymentDetectedRef.current) return
      const { data } = await supabase
        .from("projects")
        .select("paid_at")
        .eq("id", projectId)
        .maybeSingle()
      if (data?.paid_at) {
        handlePaymentDetected()
      }
    }, 3000)

    return () => {
      document.removeEventListener("fungies:checkout:complete", handlePaymentDetected)
      window.clearInterval(pollInterval)
    }
  }, [projectId, isPaid])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center 
      justify-center">
        <style>{`
          @keyframes wave {
            0%, 100% { transform: translateY(0px); opacity: 0.4; }
            50% { transform: translateY(-8px); opacity: 1; }
          }
        `}</style>
        <div className="flex gap-2">
          <span className="block w-2 h-2 rounded-full bg-foreground"
            style={{ animation: "wave 1.2s ease-in-out infinite",
            animationDelay: "0s" }} />
          <span className="block w-2 h-2 rounded-full bg-foreground"
            style={{ animation: "wave 1.2s ease-in-out infinite",
            animationDelay: "0.2s" }} />
          <span className="block w-2 h-2 rounded-full bg-foreground"
            style={{ animation: "wave 1.2s ease-in-out infinite",
            animationDelay: "0.4s" }} />
        </div>
      </div>
    )
  }

  if (!concept) return null

  return (
    <ConceptDetail
      concept={concept}
      projectId={projectId}
      userId={userId ?? undefined}
      onBack={() => router.push("/dashboard")}
      onSelect={() => router.push("/dashboard")}
      onRefine={() => {}}
      onGenerateVariations={() => {}}
      refinementsRemaining={refinementsRemaining}
      onRefinementUsed={() => 
        setRefinementsRemaining(prev => prev - 1)
      }
      defaultIsSelected={true}
      isPaid={isPaid}
      isFreeTrial={isFreeTrial}
    />
  )
}
