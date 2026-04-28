import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

const client = new Anthropic()

const BOLD_EXPRESSIVE = [
  "oversized-crop",
  "weight-contrast",
  "mixed-weight-inline",
  "scale-contrast",
]

const ARCHITECTURAL_STRUCTURED = [
  "ultrawide",
  "stacked-weighted",
  "left-editorial",
  "stacked-punctuation",
]

const REFINED_ELEGANT = [
  "inline-clean",
  "inline-ruled",
  "offset-subtitle",
  "stacked-ruled",
]

function pickSessionStyles() {
  const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5)
  return {
    bold: shuffle(BOLD_EXPRESSIVE)[0],
    architectural: shuffle(ARCHITECTURAL_STRUCTURED)[0],
    refined: shuffle(REFINED_ELEGANT)[0],
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { brief } = await request.json()

    if (!brief) {
      return NextResponse.json({ error: "Missing brief" }, { status: 400 })
    }

    const sessionStyles = pickSessionStyles()

    const strategyResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: STRATEGY_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the project brief:\n\n${brief}\n\nCOMPOSITION STYLES AVAILABLE THIS SESSION:\nYou have exactly three composition styles to work with across the three concepts. Assign one to each territory based on which fits best with that territory's character.\n\nBold/Expressive style available: ${sessionStyles.bold}\nArchitectural/Structured style available: ${sessionStyles.architectural}\nRefined/Elegant style available: ${sessionStyles.refined}\n\nEach territory must be assigned a different style from this list. All three must be used exactly once.\nInclude the assigned style in each territory object as the assignedStyle field.\n\nIdentify three distinct creative territories and assign one composition style to each. Return only valid JSON, no markdown, no explanation.`,
        },
      ],
    })

    const strategyContent = strategyResponse.content[0]
    if (strategyContent.type !== "text") {
      throw new Error("Unexpected response from strategy call")
    }

    const cleanedStrategy = strategyContent.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    const territories = JSON.parse(cleanedStrategy) as Territory[]

    const concept1 = await generateConcept(userBrief(brief), territories[0], [], "A")
    const concept2 = await generateConcept(
      userBrief(brief),
      territories[1],
      [territories[0]],
      "B"
    )
    const concept3 = await generateConcept(
      userBrief(brief),
      territories[2],
      [territories[0], territories[1]],
      "C"
    )

    const concepts = [concept1, concept2, concept3].map((c, i) => ({
      ...c,
      id: String(i + 1),
    }))

    return NextResponse.json({ concepts })
  } catch (error) {
    console.error("Admin generation error:", error)
    return NextResponse.json({ error: "Failed to generate brand concepts" }, { status: 500 })
  }
}

function userBrief(brief: string): string {
  return brief
}

async function generateConcept(
  brief: string,
  territory: Territory,
  otherTerritories: Territory[],
  slot: "A" | "B" | "C"
): Promise<BrandConceptOutput> {
  const avoidanceInstructions =
    otherTerritories.length > 0
      ? `
VISUAL DIFFERENTIATION — MANDATORY:
The other concepts in this set are using these visual territories.
Your concept must be completely different from all of them.

${otherTerritories.map((t, i) => `Concept ${i + 1} visual territory: ${t.visualTerritory}`).join("\n")}

Do not use similar colour families, font styles, or composition approaches to any of the above.
    `
      : ""

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: CONCEPT_PROMPT,
    messages: [
      {
        role: "user",
        content: `
Here is the project brief:

${brief}

Your assigned creative territory for this concept is:

TERRITORY NAME: ${territory.name}
TERRITORY RATIONALE: ${territory.rationale}
NAMING DIRECTION: ${territory.namingDirection}
VISUAL TERRITORY: ${territory.visualTerritory}

ASSIGNED COMPOSITION STYLE: ${territory.assignedStyle}

You must use this composition style. It has been selected to ensure variety across the three concepts in this session. Your creative job is to make it feel completely true to this concept through your choices of font, weight, tracking, and case.

${avoidanceInstructions}

Develop this territory into a complete brand concept.
Return only valid JSON, no markdown, no explanation.
        `,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response from concept call")
  }

  const cleaned = content.text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  return JSON.parse(cleaned)
}

type Territory = {
  name: string
  rationale: string
  namingDirection: string
  visualTerritory: string
  assignedStyle: string
}

type BrandConceptOutput = {
  conceptTitle: string
  brandName: string
  tagline: string
  summary: string
  rationale: string
  colors: string[]
  wordmarkColor: string
  colorRationale: string
  fonts: { heading: string; body: string }
  logoText: string
  logoComposition: {
    style: string
    lines: string[]
    punctuation: string
    punctuationPosition: string
    weight: string
    tracking: string
    case: string
  }
  voiceSample: string
  attributes: string[]
}

const STRATEGY_PROMPT = `
You are a senior creative strategist at a world-class property branding agency. Your job is to read a project brief and identify three genuinely distinct creative territories that could each support a compelling brand identity. You will also assign a composition style to each territory.

A creative territory is not a name — it is a strategic platform. A lens through which the project's identity could be built.

THE THREE TERRITORIES MUST BE GENUINELY DIFFERENT:
- Different creative starting points — not three variations of the same idea
- Different emotional registers — one might be bold, one quiet, one warm
- Different visual worlds — each should suggest a completely different colour, typography, and composition approach
- Different naming approaches — one might suggest a single evocative word, another a cultural reference, another a physical truth

COMPOSITION STYLE ASSIGNMENT:
You will be given three composition styles — one bold/expressive, one architectural/structured, one refined/elegant. Assign one to each territory based on which style best matches that territory's emotional character and visual world.

Return a JSON array of exactly 3 territory objects:

[
  {
    "name": "Short territory name",
    "rationale": "2-3 sentences explaining why this territory is the right creative angle for this specific project.",
    "namingDirection": "The type of name this territory suggests and why",
    "visualTerritory": "One sentence describing the visual world this territory suggests",
    "assignedStyle": "The composition style assigned to this territory"
  }
]

CRITICAL: Return only the raw JSON array. No markdown. No explanation. No preamble.
`

const CONCEPT_PROMPT = `
You are a senior brand strategist and creative director with 20 years of experience naming and branding residential property developments across New Zealand and Australia.

You have been given a project brief and a specific creative territory to develop. Your job is to take that territory and build it into a complete, considered brand concept.

NAMING RULES:
- 1-2 words maximum
- Must feel specific and ownable
- Must emerge from the assigned creative territory
- Te Reo Māori only when there is a direct, specific, genuine connection to a physical or historical truth of this exact site
- Never use: Haven, Residence, Pinnacle, Park, Place, Living, One, The, Retreat, Sanctuary, Horizon, Vista, Aspect, Edge, Quarter, Gardens, Green, Rise, Ridge, Terrace, Lane, Grove, Manor, Estate, Collection, Heights, Point, Road, Street, Valley, Hill, View, Beach

COLOUR RULES:
- 5 hex colours in the palette
- colors[0] is the primary logo background — can be any colour
- wordmarkColor must be readable on colors[0] but should be a considered design decision, not just maximum contrast

FONT RULES:
- Select from Google Fonts
- Pair heading font with body font from a different category
- Return exact Google Fonts names

LOGO COMPOSITION:
- Use the assigned composition style
- Make typographic choices (weight, tracking, case) that feel true to this brand

Return a single JSON object:

{
  "conceptTitle": "2-3 word description of the creative territory",
  "brandName": "The generated project name",
  "tagline": "A short evocative line, max 8 words",
  "summary": "One sentence summary of the brand identity",
  "rationale": "2-3 sentences of strategic reasoning",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "wordmarkColor": "#hex",
  "colorRationale": "One sentence explaining the palette direction",
  "fonts": {
    "heading": "Exact Google Font name",
    "body": "Exact Google Font name"
  },
  "logoText": "The brand name as it appears in the wordmark",
  "logoComposition": {
    "style": "the assigned style",
    "lines": ["WORD1", "WORD2"],
    "punctuation": "_ or — or none",
    "punctuationPosition": "after-last-line-offset-right | between-lines | none",
    "weight": "light | regular | bold",
    "tracking": "tight | normal | wide | ultrawide",
    "case": "upper | title | lower"
  },
  "voiceSample": "2-3 lines of brand copy in this concept's voice",
  "attributes": ["Attribute1", "Attribute2", "Attribute3", "Attribute4", "Attribute5"]
}

CRITICAL: Return only the raw JSON object. No markdown. No explanation. No preamble.
`
