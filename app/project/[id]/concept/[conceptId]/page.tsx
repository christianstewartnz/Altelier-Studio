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

  // Guard post-payment polling so it only runs once even under strict-mode
  // double-effects or re-renders.
  const paymentReturnHandled = useRef(false)

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
      // can pick the right Fungies overlay URL and whether to show it at
      // all.
      const { data: project } = await supabase
        .from("projects")
        .select("paid_at")
        .eq("id", projectId)
        .maybeSingle()

      const initiallyPaid = Boolean(project?.paid_at)
      setIsPaid(initiallyPaid)

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_free_trial")
          .eq("id", user.id)
          .single()
        if (profile) setIsFreeTrial(Boolean(profile.is_free_trial))
      }

      setLoading(false)

      // Post-checkout return: the Fungies overlay redirects here with
      // ?payment=success. The SDK's checkout:complete event and our webhook
      // can arrive in either order, so we both listen AND poll paid_at.
      const urlParams = new URLSearchParams(window.location.search)
      const isPaymentReturn = urlParams.get("payment") === "success"

      if (isPaymentReturn && !initiallyPaid && !paymentReturnHandled.current) {
        paymentReturnHandled.current = true
        void handlePaymentReturn()
      }
    }

    async function handlePaymentReturn() {
      window.history.replaceState({}, "", window.location.pathname)

      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(res => setTimeout(res, 2000))
        const { data } = await supabase
          .from("projects")
          .select("paid_at")
          .eq("id", projectId)
          .single()
        if (data?.paid_at) {
          setIsPaid(true)
          return
        }
      }

      alert(
        "We're still confirming your payment. Please refresh in a moment — if this persists, contact support."
      )
    }

    loadConcept()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId, projectId])

  // Fungies SDK also fires a DOM event on successful checkout. Catching
  // that lets us flip the UI the instant the overlay closes, without
  // waiting for the next poll tick.
  useEffect(() => {
    function onCheckoutComplete() {
      setIsPaid(true)
    }
    document.addEventListener("fungies:checkout:complete", onCheckoutComplete)
    return () => {
      document.removeEventListener("fungies:checkout:complete", onCheckoutComplete)
    }
  }, [])

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
