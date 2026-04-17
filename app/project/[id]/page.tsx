"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { StepProjectOverview } from "@/components/steps/step-project-overview"
import { StepSiteCharacter } from "@/components/steps/step-site-character"
import { StepBrandAmbition } from "@/components/steps/step-brand-ambition"
import { StepReview } from "@/components/steps/step-review"
import { GeneratingState } from "@/components/generating-state"
import { WorkflowHeader } from "@/components/workflow-header"
import { ResultsOverview, type BrandConcept } from "@/components/results/results-overview"
import { ConceptDetail } from "@/components/results/concept-detail"
import type { 
  ProjectOverviewData, 
  SiteCharacterData, 
  BrandAmbitionData 
} from "@/app/page"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingMessage, setGeneratingMessage] = useState("Reading your brief...")
  const [showResults, setShowResults] = useState(false)
  const [selectedConcept, setSelectedConcept] = useState<BrandConcept | null>(null)
  const [concepts, setConcepts] = useState<BrandConcept[]>([])
  const [hasSeenInstructions, setHasSeenInstructions] = useState(false)
  const [refinementsRemaining, setRefinementsRemaining] = useState(3)
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(false)

  // Guard so the post-payment auto-generate only ever fires once per mount.
  const autoGenerateTriggered = useRef(false)

  const [projectOverview, setProjectOverview] = useState<ProjectOverviewData>({
    location: "",
    developmentType: "",
    numberOfHomes: "",
    targetMarket: [],
    pricePositioning: "",
    additionalInfo: ""
  })

  const [siteCharacter, setSiteCharacter] = useState<SiteCharacterData>({
    qualities: [],
    desiredTone: "",
    siteContext: "",
    attachments: [],
    additionalInfo: ""
  })

  const [brandAmbition, setBrandAmbition] = useState<BrandAmbitionData>({
    buyerFeeling: "",
    pointOfDifference: "",
    direction: "",
    wordsToAvoid: "",
    additionalInfo: ""
  })

  useEffect(() => {
    async function loadProject() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single()

      if (error || !project) {
        router.push("/dashboard")
        return
      }

      setProjectName(project.project_name)
      setIsPaid(Boolean(project.paid_at))

      // Pre-fill location from suburb_city
      setProjectOverview(prev => ({
        ...prev,
        location: project.suburb_city || project.location || "",
        developmentType: project.development_type || "",
        numberOfHomes: project.number_of_homes || "",
        targetMarket: project.target_market 
          ? (Array.isArray(project.target_market) 
            ? project.target_market 
            : [project.target_market])
          : [],
        pricePositioning: project.price_positioning || "",
        additionalInfo: project.additional_info || ""
      }))

      setSiteCharacter(prev => ({
        ...prev,
        qualities: project.site_qualities || [],
        desiredTone: project.desired_tone || "",
        siteContext: project.site_context || ""
      }))

      setBrandAmbition(prev => ({
        ...prev,
        buyerFeeling: project.buyer_feeling || "",
        pointOfDifference: project.point_of_difference || "",
        direction: project.brand_direction || "",
        wordsToAvoid: project.words_to_avoid || "",
        additionalInfo: project.additional_info || ""
      }))

      // Load existing concepts if any
      const { data: existingConcepts } = await supabase
        .from("concepts")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })

      if (existingConcepts && existingConcepts.length > 0) {
        const mapped = existingConcepts.map((c: any) => ({
          id: c.id,
          conceptTitle: c.concept_title,
          brandName: c.brand_name,
          tagline: c.tagline,
          summary: c.summary || "",
          rationale: c.rationale,
          colors: c.colors,
          wordmarkColor: c.wordmark_color,
          colorRationale: c.color_rationale,
          fonts: c.fonts,
          logoText: c.logo_text || c.brand_name,
          logoComposition: c.logo_composition,
          voiceSample: c.voice_sample,
          attributes: c.attributes
        }))
        setConcepts(mapped)
        setShowResults(true)
      }

      setLoading(false)

      // Handle post-payment redirect:
      // If we have ?payment=success, poll until paid_at is set on the project
      // (the webhook can lag the Fungies redirect by a few seconds), then
      // kick off generation automatically.
      const hasConcepts = Boolean(existingConcepts && existingConcepts.length > 0)
      const params = new URLSearchParams(window.location.search)
      const isPaymentReturn = params.get("payment") === "success"

      if (isPaymentReturn && !hasConcepts && !autoGenerateTriggered.current) {
        autoGenerateTriggered.current = true
        void handlePaymentReturn(Boolean(project.paid_at))
      } else if (Boolean(project.paid_at) && !hasConcepts && !autoGenerateTriggered.current) {
        // Covers the case where a user paid earlier but closed the tab
        // before generation finished — show the paid Generate button
        // in the review step by leaving isPaid=true; no auto-fire here.
      }
    }

    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handlePaymentReturn(alreadyPaid: boolean) {
    // Clear the query param immediately so refreshes don't retrigger.
    window.history.replaceState({}, "", window.location.pathname)

    let confirmed = alreadyPaid
    if (!confirmed) {
      // Poll for up to ~20s waiting for the webhook.
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(res => setTimeout(res, 2000))
        const { data } = await supabase
          .from("projects")
          .select("paid_at")
          .eq("id", projectId)
          .single()
        if (data?.paid_at) {
          confirmed = true
          break
        }
      }
    }

    if (!confirmed) {
      alert(
        "We're still confirming your payment. Please refresh in a moment — if this persists, contact support."
      )
      return
    }

    setIsPaid(true)
    await handleGenerate()
  }

  async function saveStepToDatabase(step: number) {
    const updates: any = {}

    if (step === 1) {
      updates.location = projectOverview.location
      updates.development_type = projectOverview.developmentType
      updates.number_of_homes = projectOverview.numberOfHomes
      updates.target_market = projectOverview.targetMarket
      updates.price_positioning = projectOverview.pricePositioning
      updates.additional_info = projectOverview.additionalInfo
    }

    if (step === 2) {
      updates.site_qualities = siteCharacter.qualities
      updates.desired_tone = siteCharacter.desiredTone
      updates.site_context = siteCharacter.siteContext
    }

    if (step === 3) {
      updates.buyer_feeling = brandAmbition.buyerFeeling
      updates.point_of_difference = brandAmbition.pointOfDifference
      updates.brand_direction = brandAmbition.direction
      updates.words_to_avoid = brandAmbition.wordsToAvoid
      updates.additional_info = brandAmbition.additionalInfo
    }

    await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
  }

  const handleNext = async () => {
    await saveStepToDatabase(currentStep)
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleGoToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    const messages = [
      "Reading your brief...",
      "Identifying creative territories...",
      "Developing concept one...",
      "Developing concept two...",
      "Developing concept three...",
      "Refining the details..."
    ]

    let messageIndex = 0
    setGeneratingMessage(messages[0])

    const messageInterval = setInterval(() => {
      messageIndex = Math.min(messageIndex + 1, messages.length - 1)
      setGeneratingMessage(messages[messageIndex])
    }, 6000)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          projectOverview,
          siteCharacter,
          brandAmbition
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        clearInterval(messageInterval)
        if (response.status === 402 || response.status === 403) {
          alert("Payment is required before concepts can be generated.")
        } else if (response.status === 429) {
          alert("You have reached your daily generation limit. Please try again tomorrow.")
        } else {
          alert(err.error || "Generation failed. Please try again.")
        }
        setIsGenerating(false)
        return
      }

      const data = await response.json()
      clearInterval(messageInterval)

      // Save concepts to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const conceptsToInsert = data.concepts.map((c: BrandConcept) => ({
          project_id: projectId,
          user_id: user.id,
          concept_title: c.conceptTitle,
          brand_name: c.brandName,
          tagline: c.tagline,
          summary: c.summary,
          rationale: c.rationale,
          colors: c.colors,
          wordmark_color: c.wordmarkColor,
          color_rationale: c.colorRationale,
          fonts: c.fonts,
          logo_text: c.logoText,
          logo_composition: c.logoComposition,
          voice_sample: c.voiceSample,
          attributes: c.attributes,
          is_selected: false
        }))

        const { data: savedConcepts } = await supabase
          .from("concepts")
          .insert(conceptsToInsert)
          .select()

        if (savedConcepts) {
          const mapped = savedConcepts.map((c: any, i: number) => ({
            ...data.concepts[i],
            id: c.id
          }))
          setConcepts(mapped)
        } else {
          setConcepts(data.concepts)
        }

        // Update project status to in_progress
        await supabase
          .from("projects")
          .update({ status: "in_progress" })
          .eq("id", projectId)
      }

      setShowResults(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error: any) {
      console.error("Generation failed:", error)
      clearInterval(messageInterval)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewConcept = (concept: BrandConcept) => {
    setSelectedConcept(concept)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBackToResults = () => {
    setSelectedConcept(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSelectConcept = async (concept: BrandConcept) => {
    // Update concept as selected in Supabase
    await supabase
      .from("concepts")
      .update({ is_selected: false })
      .eq("project_id", projectId)

    await supabase
      .from("concepts")
      .update({ is_selected: true })
      .eq("id", concept.id)

    // Update project status to completed
    await supabase
      .from("projects")
      .update({ status: "completed" })
      .eq("id", projectId)
  }

  const handleStartOver = () => {
    router.push("/dashboard")
  }

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

  if (isGenerating) {
    return <GeneratingState message={generatingMessage} />
  }

  if (selectedConcept) {
    return (
      <ConceptDetail
        concept={selectedConcept}
        projectId={projectId}
        userId={userId ?? undefined}
        onBack={handleBackToResults}
        onSelect={handleSelectConcept}
        onRefine={() => {}}
        onGenerateVariations={() => {}}
        refinementsRemaining={refinementsRemaining}
        onRefinementUsed={() => 
          setRefinementsRemaining(prev => prev - 1)
        }
      />
    )
  }

  if (showResults) {
    return (
      <ResultsOverview
        concepts={concepts}
        onViewConcept={handleViewConcept}
        onStartOver={handleStartOver}
        hasSeenInstructions={hasSeenInstructions}
        onDismissInstructions={() => setHasSeenInstructions(true)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <WorkflowHeader
        currentStep={currentStep}
        onGoToStep={handleGoToStep}
        onStartOver={handleStartOver}
        onLogout={async () => {
          const supabase = createClient()
          await supabase.auth.signOut()
          router.push("/login")
        }}
      />
      <main className="pb-24">
        <div className="relative">
          {currentStep === 1 && (
            <StepProjectOverview
              data={projectOverview}
              onChange={setProjectOverview}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <StepSiteCharacter
              data={siteCharacter}
              onChange={setSiteCharacter}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {currentStep === 3 && (
            <StepBrandAmbition
              data={brandAmbition}
              onChange={setBrandAmbition}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {currentStep === 4 && (
            <StepReview
              projectOverview={projectOverview}
              siteCharacter={siteCharacter}
              brandAmbition={brandAmbition}
              onGoToStep={handleGoToStep}
              onPrevious={handlePrevious}
              onGenerate={handleGenerate}
              projectId={projectId}
              userId={userId ?? undefined}
              isPaid={isPaid}
            />
          )}
        </div>
      </main>

      {process.env.NODE_ENV !== "production" && isPaid && !isGenerating && !showResults && !selectedConcept && (
        <button
          onClick={async () => {
            setProjectOverview({
              location: "Ponsonby, Auckland, New Zealand",
              developmentType: "Residential Apartments",
              numberOfHomes: "12 boutique apartments",
              targetMarket: ["Young Professionals", "Investors"],
              pricePositioning: "Premium",
              additionalInfo: ""
            })
            setSiteCharacter({
              qualities: ["views", "urban", "architectural"],
              desiredTone: "Bold and contemporary",
              siteContext: "Corner site on Ponsonby Road with elevated views over the city. Ground floor retail tenancy creating activation at street level.",
              attachments: [],
              additionalInfo: ""
            })
            setBrandAmbition({
              buyerFeeling: "Arrived. Like they own the best address in Auckland.",
              pointOfDifference: "Only boutique development on Ponsonby Road with ground floor cafe. Architectural design by award winning firm.",
              direction: "bold-contemporary",
              wordsToAvoid: "luxury, exclusive, premium",
              additionalInfo: ""
            })
            await handleGenerate()
          }}
          className="fixed bottom-6 right-6 z-50 bg-red-500 text-white text-xs px-4 py-2 rounded-full shadow-lg hover:bg-red-600 transition-all opacity-70 hover:opacity-100"
        >
          DEV: Quick Generate
        </button>
      )}
    </div>
  )
}
