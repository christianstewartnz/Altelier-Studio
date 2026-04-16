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
  const supabase = createClient()
  const [concept, setConcept] = useState<BrandConcept | null>(null)
  const [loading, setLoading] = useState(true)
  const [refinementsRemaining, setRefinementsRemaining] = useState(3)
  const [userId, setUserId] = useState<string | null>(null)

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
      setLoading(false)
    }
    loadConcept()
  }, [conceptId])

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
      projectId={params.id as string}
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
    />
  )
}
