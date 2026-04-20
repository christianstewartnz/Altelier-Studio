"use client"

import { useEffect, useState } from "react"
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
  const [userId, setUserId] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [isFreeTrial, setIsFreeTrial] = useState(false)
  const [projectBrief, setProjectBrief] = useState<{
    location?: string
    suburb?: string
    city?: string
    targetMarket?: string | string[]
    pricePositioning?: string
    siteContext?: string
    desiredTone?: string
    brandDirection?: string
    pointOfDifference?: string
    buyerFeeling?: string
  } | undefined>(undefined)

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
        attributes: data.attributes,
        refinementsAvailable: data.refinements_available ?? 3
      })

      // Load project paid_at + brief fields for refinement context
      const { data: project } = await supabase
        .from("projects")
        .select("paid_at, suburb_city, location, target_market, price_positioning, site_context, desired_tone, brand_direction, point_of_difference, buyer_feeling")
        .eq("id", projectId)
        .maybeSingle()

      setIsPaid(Boolean(project?.paid_at))

      if (project) {
        const locationStr = project.suburb_city || project.location || ""
        const locationParts = locationStr.split(",").map((p: string) => p.trim()).filter(Boolean)
        setProjectBrief({
          location: locationStr || undefined,
          suburb: locationParts[0] || locationStr || undefined,
          city: locationParts[1] || locationParts[0] || locationStr || undefined,
          targetMarket: (() => {
            const v = project.target_market
            if (!v) return undefined
            if (Array.isArray(v)) return v
            try { const p = JSON.parse(v); return Array.isArray(p) ? p : [v] } catch { return [v] }
          })(),
          pricePositioning: project.price_positioning || undefined,
          siteContext: project.site_context || undefined,
          desiredTone: project.desired_tone || undefined,
          brandDirection: project.brand_direction || undefined,
          pointOfDifference: project.point_of_difference || undefined,
          buyerFeeling: project.buyer_feeling || undefined,
        })
      }

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


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      projectBrief={projectBrief}
      userId={userId ?? undefined}
      onBack={() => router.push("/dashboard")}
      onGoToDashboard={() => router.push("/dashboard")}
      onSelect={() => router.push("/dashboard")}
      onRefine={() => {}}
      onGenerateVariations={() => {}}
      defaultIsSelected={true}
      isConfirmed={true}
      isPaid={isPaid}
      isFreeTrial={isFreeTrial}
    />
  )
}
