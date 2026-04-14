"use client"

import { useState } from "react"
import { StepProjectOverview } from "@/components/steps/step-project-overview"
import { StepSiteCharacter } from "@/components/steps/step-site-character"
import { StepBrandAmbition } from "@/components/steps/step-brand-ambition"
import { StepReview } from "@/components/steps/step-review"
import { GeneratingState } from "@/components/generating-state"
import { WorkflowHeader } from "@/components/workflow-header"
import { ResultsOverview, type BrandConcept } from "@/components/results/results-overview"
import { ConceptDetail } from "@/components/results/concept-detail"

// Sample generated concepts (would come from AI in production)
const sampleConcepts: BrandConcept[] = [
  {
    id: "1",
    conceptTitle: "Architectural Calm",
    brandName: "Stillwater",
    tagline: "Where tranquility meets design",
    summary: "A serene identity rooted in architectural precision and natural harmony. Clean lines and muted tones create an atmosphere of understated luxury.",
    colors: ["#2C3E50", "#7F8C8D", "#BDC3C7", "#ECF0F1", "#FFFFFF"],
    logoText: "Stillwater",
    attributes: ["Serene", "Architectural", "Premium", "Timeless", "Refined"],
    rationale: "Stillwater draws from the concept of calm, reflective surfaces—evoking both the literal stillness of water and the metaphorical peace of a well-designed space. The name suggests a sanctuary from the noise of everyday life, a place where architectural precision meets natural tranquility.",
    colorRationale: "The palette moves from deep slate through sophisticated greys to pristine white, mirroring the transition from solid earth to open sky. These tones suggest permanence, quality materials, and the kind of understated luxury that never dates.",
    fonts: { heading: "Cormorant Garamond", body: "Inter" },
    voiceSample: "At Stillwater, we believe the finest homes are those that feel inevitable—spaces where every line serves a purpose and every material speaks of permanence. This is architecture as meditation."
  },
  {
    id: "2",
    conceptTitle: "Coastal Heritage",
    brandName: "Saltwood",
    tagline: "Crafted by nature, designed for life",
    summary: "An identity that celebrates the connection between coastal living and artisanal craftsmanship. Warm, organic tones evoke weathered timber and sea-worn stone.",
    colors: ["#5D4E37", "#8B7355", "#C4B49A", "#E8DFD0", "#F5F2ED"],
    logoText: "Saltwood",
    attributes: ["Organic", "Coastal", "Artisanal", "Warm", "Authentic"],
    rationale: "Saltwood speaks to the marriage of coastal elements and natural materials—salt air that weathers timber to silver, wood that grows stronger with age. The name evokes a sense of craftsmanship, of homes built to embrace their environment rather than resist it.",
    colorRationale: "Drawn from the coastal landscape itself: driftwood browns, sandstone neutrals, and the soft cream of sea-bleached shells. This palette feels as though it emerged naturally from the site, creating instant harmony with the surrounding environment.",
    fonts: { heading: "Libre Baskerville", body: "Source Sans Pro" },
    voiceSample: "There's a particular quality to homes that understand their place—where the grain of timber echoes the patterns of the shoreline, and every window frames a conversation between land and sea."
  },
  {
    id: "3",
    conceptTitle: "Modern Sanctuary",
    brandName: "Verdana",
    tagline: "Elevated living, naturally",
    summary: "A contemporary identity that balances modern sophistication with biophilic design principles. Fresh greens and crisp neutrals create a sense of renewal.",
    colors: ["#2D5A3D", "#5B8A6F", "#8FB9A0", "#D4E5DB", "#FAFBFA"],
    logoText: "Verdana",
    attributes: ["Contemporary", "Biophilic", "Fresh", "Sophisticated", "Vibrant"],
    rationale: "Verdana derives from 'verde'—green, growth, life. It speaks to a new generation of development that places nature at the centre of modern living. The name suggests both sophistication and sustainability, appealing to buyers who refuse to compromise on either.",
    colorRationale: "A botanical gradient from deep forest to morning mist, this palette celebrates the integration of landscape and architecture. The progression from rich green to pure white suggests growth, renewal, and the seamless flow between indoor and outdoor spaces.",
    fonts: { heading: "DM Serif Display", body: "DM Sans" },
    voiceSample: "Welcome to a new kind of living—where walls of glass dissolve the boundary between home and garden, and every residence is designed around the rhythm of natural light and the presence of green."
  }
]

export type ProjectOverviewData = {
  location: string
  developmentType: string
  numberOfHomes: string
  targetMarket: string
  pricePositioning: string
  additionalInfo: string
}

export type SiteCharacterData = {
  qualities: string[]
  desiredTone: string
  siteContext: string
  attachments: File[]
  additionalInfo: string
}

export type BrandAmbitionData = {
  buyerFeeling: string
  pointOfDifference: string
  direction: string
  wordsToAvoid: string
  additionalInfo: string
}

export type WorkflowData = {
  projectOverview: ProjectOverviewData
  siteCharacter: SiteCharacterData
  brandAmbition: BrandAmbitionData
}

const initialProjectOverview: ProjectOverviewData = {
  location: "",
  developmentType: "",
  numberOfHomes: "",
  targetMarket: "",
  pricePositioning: "",
  additionalInfo: ""
}

const initialSiteCharacter: SiteCharacterData = {
  qualities: [],
  desiredTone: "",
  siteContext: "",
  attachments: [],
  additionalInfo: ""
}

const initialBrandAmbition: BrandAmbitionData = {
  buyerFeeling: "",
  pointOfDifference: "",
  direction: "",
  wordsToAvoid: "",
  additionalInfo: ""
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingMessage, setGeneratingMessage] = useState("Reading your brief...")
  const [showResults, setShowResults] = useState(false)
  const [selectedConcept, setSelectedConcept] = useState<BrandConcept | null>(null)
  const [concepts, setConcepts] = useState<BrandConcept[]>(sampleConcepts)
  
  const [projectOverview, setProjectOverview] = useState<ProjectOverviewData>(initialProjectOverview)
  const [siteCharacter, setSiteCharacter] = useState<SiteCharacterData>(initialSiteCharacter)
  const [brandAmbition, setBrandAmbition] = useState<BrandAmbitionData>(initialBrandAmbition)

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleGoToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    // Progress message sequence while API call runs
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
          projectOverview,
          siteCharacter,
          brandAmbition
        })
      })
      const data = await response.json()
      clearInterval(messageInterval)
      setConcepts(data.concepts)
      setShowResults(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error("Generation failed:", error)
      clearInterval(messageInterval)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewConcept = (concept: BrandConcept) => {
    setSelectedConcept(concept)
  }

  const handleBackToResults = () => {
    setSelectedConcept(null)
  }

  const handleSelectConcept = (concept: BrandConcept) => {
    // In production, this would save the selection
    console.log("Selected concept:", concept.brandName)
    alert(`You've selected "${concept.brandName}" as your brand direction. In production, this would proceed to the next steps.`)
  }

  const handleRefineConcept = (concept: BrandConcept) => {
    // In production, this would open a refinement flow
    console.log("Refining concept:", concept.brandName)
    alert(`Refining "${concept.brandName}". In production, this would open a refinement interface.`)
  }

  const handleGenerateVariations = (concept: BrandConcept) => {
    // In production, this would generate variations
    console.log("Generating variations for:", concept.brandName)
    alert(`Generating variations of "${concept.brandName}". In production, this would create new variations.`)
  }

  const handleStartOver = () => {
    setCurrentStep(1)
    setProjectOverview(initialProjectOverview)
    setSiteCharacter(initialSiteCharacter)
    setBrandAmbition(initialBrandAmbition)
    setIsGenerating(false)
    setShowResults(false)
    setSelectedConcept(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isGenerating) {
    return <GeneratingState message={generatingMessage} />
  }

  // Show concept detail if a concept is selected
  if (selectedConcept) {
    return (
      <ConceptDetail
        concept={selectedConcept}
        onBack={handleBackToResults}
        onSelect={handleSelectConcept}
        onRefine={handleRefineConcept}
        onGenerateVariations={handleGenerateVariations}
      />
    )
  }

  // Show results overview after generation
  if (showResults) {
    return (
      <ResultsOverview
        concepts={concepts}
        onViewConcept={handleViewConcept}
        onStartOver={handleStartOver}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <WorkflowHeader 
        currentStep={currentStep}
        onGoToStep={handleGoToStep}
        onStartOver={handleStartOver}
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
            />
          )}
        </div>
      </main>
    </div>
  )
}
