import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import sharp from "sharp"
// import { generateRatelimit } from "@/lib/ratelimit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 300

// TODO: Set DISABLE_PAYWALL_FOR_TESTING to false before deploying to production.
const DISABLE_PAYWALL_FOR_TESTING = true

const client = new Anthropic()

const STAGE_1_MODEL = 'claude-opus-4-7' // always Opus 4.7
const STAGE_2_MODEL = process.env.AI_MODEL_TIER === 'production'
  ? 'claude-opus-4-6'
  : 'claude-sonnet-4-6'

const COLOUR_REGISTERS = ["Light", "Dark", "Bold"] as const
type ColourRegister = (typeof COLOUR_REGISTERS)[number]

const TYPOGRAPHIC_REGISTERS = [
  "Editorial Serif",
  "Contemporary Sans",
  "Expressive Display",
] as const
type TypographicRegister = (typeof TYPOGRAPHIC_REGISTERS)[number]

const COMPOSITION_FAMILY_REGISTERS = ["Single Line", "Stacked", "Contrast"] as const
type CompositionFamilyRegister = (typeof COMPOSITION_FAMILY_REGISTERS)[number]

const TYPOGRAPHIC_REGISTER_FONTS: Record<TypographicRegister, readonly string[]> = {
  "Editorial Serif": [
    "Fraunces",
    "Bodoni Moda",
    "Italiana",
    "Gloock",
    "IM Fell English",
    "Cinzel",
    "Cardo",
    "Unna",
    "DM Serif Display",
  ],
  "Contemporary Sans": [
    "Syne",
    "Space Grotesk",
    "Josefin Sans",
    "Raleway",
    "Urbanist",
    "Jost",
    "Red Hat Display",
    "Mulish",
    "Didact Gothic",
  ],
  "Expressive Display": [
    "Yeseva One",
    "Rozha One",
    "Playfair Display",
    "Bebas Neue",
    "Big Shoulders Display",
    "Barlow Condensed",
    "Zilla Slab",
  ],
}

const COMPOSITION_FAMILY_POOLS: Record<CompositionFamilyRegister, readonly string[]> = {
  "Single Line": ["inline-clean", "inline-ruled", "ultrawide", "oversized-crop"],
  Stacked: ["stacked-weighted", "stacked-ruled", "left-editorial", "offset-subtitle"],
  Contrast: ["weight-contrast", "mixed-weight-inline", "scale-contrast"],
}

const CHOSEN_NAME_COLOUR_REGISTER_TEXT: Record<ColourRegister, string> = {
  Light: `COLOUR REGISTER INSTRUCTION:
COLOUR REGISTER ASSIGNED: Light

Light register: colors[0] must be a light background colour
— high lightness. It should read immediately as a light,
considered surface. Derive the specific colour from the
brief, the name, and the creative territory. Do not default
to white or off-white — find a colour that belongs to this
brand world specifically.`,

  Dark: `COLOUR REGISTER INSTRUCTION:
COLOUR REGISTER ASSIGNED: Dark

Dark register: colors[0] must be a dark background colour
— low lightness. It should read immediately as a dramatic, confident
dark surface. Derive the specific colour from the
brief, the name, and the creative territory. Do not default
to near-black — find a dark colour that belongs to this
brand world specifically.`,

  Bold: `COLOUR REGISTER INSTRUCTION:
COLOUR REGISTER ASSIGNED: Bold

Bold register: colors[0] must be a mid-tone colour with
genuine saturation and visual presence — neither light
nor dark. It should make an immediate statement. Derive
the specific colour from the brief, the name, and the
creative territory. This colour should feel brave and
considered — not a safe neutral.`,
}

const CHOSEN_NAME_TYPOGRAPHIC_REGISTER_TEXT: Record<TypographicRegister, string> = {
  "Editorial Serif": `TYPOGRAPHIC REGISTER INSTRUCTION:
TYPOGRAPHIC REGISTER ASSIGNED: Editorial Serif

Editorial Serif register: heading font must be chosen
from this list only — Fraunces, Bodoni Moda, Italiana,
Gloock, IM Fell English, Cinzel, Cardo, Unna, DM Serif Display.
Choose the font from this list that best suits this
specific concept's territory and name character.`,

  "Contemporary Sans": `TYPOGRAPHIC REGISTER INSTRUCTION:
TYPOGRAPHIC REGISTER ASSIGNED: Contemporary Sans

Contemporary Sans register: heading font must be chosen
from this list only — Syne, Space Grotesk, Josefin Sans,
Raleway, Urbanist, Jost, Red Hat Display, Mulish, Didact Gothic.
Choose the font from this list that best suits this
specific concept's territory and name character.`,

  "Expressive Display": `TYPOGRAPHIC REGISTER INSTRUCTION:
TYPOGRAPHIC REGISTER ASSIGNED: Expressive Display

Expressive Display register: heading font must be chosen
from this list only — Yeseva One, Rozha One, Playfair Display,
Bebas Neue, Big Shoulders Display, Barlow Condensed, Zilla Slab.
Choose the font from this list that best suits this
specific concept's territory and name character.`,
}

const CHOSEN_NAME_COMPOSITION_FAMILY_TEXT: Record<CompositionFamilyRegister, string> = {
  "Single Line": `COMPOSITION FAMILY REGISTER INSTRUCTION:
COMPOSITION FAMILY ASSIGNED: Single Line

Single Line family: logo composition style must be chosen
from — inline-clean, inline-ruled, ultrawide, oversized-crop.
Apply all existing character length rules:
oversized-crop only for names 3-6 characters.
ultrawide only for names 3-7 characters.`,

  Stacked: `COMPOSITION FAMILY REGISTER INSTRUCTION:
COMPOSITION FAMILY ASSIGNED: Stacked

Stacked family: logo composition style must be chosen
from — stacked-weighted, stacked-ruled, left-editorial,
offset-subtitle.
The name splits across two lines or uses a subtitle treatment.`,

  Contrast: `COMPOSITION FAMILY REGISTER INSTRUCTION:
COMPOSITION FAMILY ASSIGNED: Contrast

Contrast family: logo composition style must be chosen
from — weight-contrast, mixed-weight-inline, scale-contrast.
Requires two meaningful elements — use lines[1] as a
subtitle, location, or meaningful second word if the
name is a single word.`,
}

/** Fisher–Yates shuffle using Math.random(). */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

type SessionConceptRegisters = {
  colourRegister: ColourRegister
  typographicRegister: TypographicRegister
  compositionFamilyRegister: CompositionFamilyRegister
  headingFont: string
  compositionStyle: string
}

type SessionRegisterAssignment = Pick<
  SessionConceptRegisters,
  "colourRegister" | "typographicRegister" | "compositionFamilyRegister"
>

function pickSessionStyles(): {
  bySlot: Record<"A" | "B" | "C", SessionConceptRegisters>
  registerAssignments: Record<"A" | "B" | "C", SessionRegisterAssignment>
  bold: string
  architectural: string
  refined: string
  sessionFonts: { editorial: string; contemporary: string; expressive: string }
} {
  const colourOrder = shuffleArray([...COLOUR_REGISTERS])
  const typoOrder = shuffleArray([...TYPOGRAPHIC_REGISTERS])
  const familyOrder = shuffleArray([...COMPOSITION_FAMILY_REGISTERS])

  const slots = ["A", "B", "C"] as const
  const bySlot = {} as Record<"A" | "B" | "C", SessionConceptRegisters>
  const registerAssignments = {} as Record<"A" | "B" | "C", SessionRegisterAssignment>

  for (let i = 0; i < 3; i++) {
    const slot = slots[i]!
    const colourRegister = colourOrder[i]!
    const typographicRegister = typoOrder[i]!
    const compositionFamilyRegister = familyOrder[i]!
    const headingFont = pickRandom(TYPOGRAPHIC_REGISTER_FONTS[typographicRegister])
    const compositionStyle = pickRandom(COMPOSITION_FAMILY_POOLS[compositionFamilyRegister])
    bySlot[slot] = {
      colourRegister,
      typographicRegister,
      compositionFamilyRegister,
      headingFont,
      compositionStyle,
    }
    registerAssignments[slot] = {
      colourRegister,
      typographicRegister,
      compositionFamilyRegister,
    }
  }

  return {
    bySlot,
    registerAssignments,
    bold: bySlot.A.compositionStyle,
    architectural: bySlot.B.compositionStyle,
    refined: bySlot.C.compositionStyle,
    sessionFonts: {
      editorial: bySlot.A.headingFont,
      contemporary: bySlot.B.headingFont,
      expressive: bySlot.C.headingFont,
    },
  }
}

function taglinesNearIdentical(a: string, b: string): boolean {
  if (a.toLowerCase().trim() === b.toLowerCase().trim()) return true
  const stopWords = new Set(["the", "a", "an", "of", "in", "on", "at", "to", "for", "and", "or", "but"])
  const words = (s: string) =>
    s.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w))
  const wordsA = words(a)
  const wordsB = words(b)
  if (wordsA.length === 0 || wordsB.length === 0) return false
  const setA = new Set(wordsA)
  const overlap = wordsB.filter(w => setA.has(w)).length
  return overlap / Math.min(wordsA.length, wordsB.length) >= 0.75
}

async function regenerateTagline(
  concept: BrandConceptOutput,
  otherTaglines: string[]
): Promise<string> {
  const response = await client.messages.create({
    model: STAGE_2_MODEL,
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Rewrite this property brand tagline so it is completely different in wording and creative angle.

Brand name: ${concept.brandName}
Brand concept: ${concept.rationale}
Current tagline (replace this): ${concept.tagline}

These taglines already exist for other concepts — your replacement must differ from all of them:
${otherTaglines.map(t => `- "${t}"`).join("\n")}

Requirements:
- 3–8 words
- Completely different wording and creative angle from the taglines above
- No generic property marketing language
- Captures this specific brand concept

Return ONLY the tagline text — no quotes, no punctuation at end, no explanation.`
    }]
  })
  const block = response.content[0]
  if (block.type !== "text") return concept.tagline
  return block.text.trim().replace(/^["']|["']$/g, "").replace(/\.$/, "")
}

async function deduplicateConceptTaglines(concepts: BrandConceptOutput[]): Promise<BrandConceptOutput[]> {
  const result = [...concepts]
  for (let j = 1; j < result.length; j++) {
    for (let i = 0; i < j; i++) {
      if (taglinesNearIdentical(result[i].tagline, result[j].tagline)) {
        const otherTaglines = result.filter((_, idx) => idx !== j).map(c => c.tagline)
        try {
          const newTagline = await regenerateTagline(result[j], otherTaglines)
          result[j] = { ...result[j], tagline: newTagline }
        } catch {
          // keep original on error
        }
        break
      }
    }
  }
  return result
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorised" },
      { status: 401 }
    )
  }

  // const { success, limit, reset, remaining } = await generateRatelimit.limit(user.id)

  // if (!success) {
  //   return NextResponse.json(
  //     {
  //       error: "Daily generation limit reached. You can generate again tomorrow.",
  //       limit,
  //       reset,
  //       remaining
  //     },
  //     { status: 429 }
  //   )
  // }

  try {
    const formData = await request.formData()
    const projectId = formData.get("projectId") as string
    const projectOverview = JSON.parse(formData.get("projectOverview") as string)
    const siteCharacter = JSON.parse(formData.get("siteCharacter") as string)
    const brandAmbition = JSON.parse(formData.get("brandAmbition") as string)
    const attachmentFiles = formData.getAll("attachments") as File[]
    const chosenNameRaw = formData.get("chosenName") as string | null
    const chosenName = chosenNameRaw
      ? JSON.parse(chosenNameRaw) as { name: string; rationale: string; territory: string }
      : null

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      )
    }

    const location = (projectOverview.location || "").trim()
    const siteContext = (siteCharacter.siteContext || "").trim()
    const buyerFeeling = (brandAmbition.buyerFeeling || "").trim()

    if (location.length < 3 || siteContext.length < 10 || buyerFeeling.length < 10) {
      return NextResponse.json(
        { error: "Please complete your brief before generating concepts" },
        { status: 400 }
      )
    }

    // Paywall: generation is only unlocked once the project has been paid for.
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, paid_at")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Paywall with trial-bypass. The trial is consumed atomically here —
    // one successful /api/generate call per trial profile — so generation
    // and trial-consumption cannot drift apart.
    if (!project.paid_at && !DISABLE_PAYWALL_FOR_TESTING) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_free_trial, free_trial_used")
        .eq("id", user.id)
        .single()

      let trialConsumed = false
      if (profile?.is_free_trial && !profile.free_trial_used) {
        // The .eq("free_trial_used", false) guard makes this a conditional
        // update: only the first concurrent request wins, everyone else
        // gets zero rows back and falls through to the paywall.
        const { data: consumed } = await supabase
          .from("profiles")
          .update({ free_trial_used: true })
          .eq("id", user.id)
          .eq("free_trial_used", false)
          .select("id")
          .maybeSingle()

        trialConsumed = Boolean(consumed)
      }

      if (!trialConsumed) {
        return NextResponse.json(
          { error: "Payment required to generate brand concepts" },
          { status: 402 }
        )
      }
    }

    const userBrief = `
PROJECT OVERVIEW
- Location: ${projectOverview.location}
- Development Type: ${projectOverview.developmentType}
- Scale: ${projectOverview.numberOfHomes || "Not specified"}
- Target Market: ${Array.isArray(projectOverview.targetMarket)
  ? projectOverview.targetMarket.join(", ")
  : projectOverview.targetMarket}
- Price Positioning: ${projectOverview.pricePositioning}

SITE CHARACTER
- Site Qualities: ${siteCharacter.qualities.join(", ")}
- Desired Tone: ${siteCharacter.desiredTone}
- Unique Site Context: ${siteCharacter.siteContext || "Not specified"}

BRAND AMBITION
- Direction: ${brandAmbition.direction}
- Buyer Should Feel: ${brandAmbition.buyerFeeling || "Not specified"}
- Point of Difference: ${brandAmbition.pointOfDifference || "Not specified"}
- Words to Avoid: ${brandAmbition.wordsToAvoid || "None specified"}
- References & Additional Thoughts: ${brandAmbition.additionalInfo || "None provided"}
    `

    // --------------------------------------------------------
    // CHOSEN NAME PATH — skip Stage 1, run Stage 2 in parallel
    // --------------------------------------------------------
    if (chosenName) {
      const sessionStyles = pickSessionStyles()
      const { sessionFonts, bySlot } = sessionStyles

      const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
      const [concept1, concept2, concept3] = await Promise.all([
        generateConceptFromChosenName(
          userBrief,
          chosenName,
          "A",
          bySlot.A.colourRegister,
          bySlot.A.typographicRegister,
          bySlot.A.compositionFamilyRegister,
          bySlot.A.compositionStyle,
          sessionFonts.editorial
        ),
        delay(800).then(() =>
          generateConceptFromChosenName(
            userBrief,
            chosenName,
            "B",
            bySlot.B.colourRegister,
            bySlot.B.typographicRegister,
            bySlot.B.compositionFamilyRegister,
            bySlot.B.compositionStyle,
            sessionFonts.contemporary
          )
        ),
        delay(1600).then(() =>
          generateConceptFromChosenName(
            userBrief,
            chosenName,
            "C",
            bySlot.C.colourRegister,
            bySlot.C.typographicRegister,
            bySlot.C.compositionFamilyRegister,
            bySlot.C.compositionStyle,
            sessionFonts.expressive
          )
        ),
      ])

      const deduped = await deduplicateConceptTaglines([concept1, concept2, concept3])
      const concepts = deduped.map((c, i) => ({ ...c, id: String(i + 1) }))

      return NextResponse.json({ concepts })
    }

    // --------------------------------------------------------
    // STAGE 1 — STRATEGY CALL
    // Fast call to identify three distinct creative territories
    // --------------------------------------------------------
    const sessionStyles = pickSessionStyles()
    const { sessionFonts, bySlot } = sessionStyles

    // Build attachment content blocks for Stage 1 only
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string } }
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }

    const attachmentBlocks: ContentBlock[] = []

    if (attachmentFiles.length > 0) {
      const imageFiles = attachmentFiles.filter(f => f.type.startsWith("image/"))
      const pdfFiles = attachmentFiles.filter(f => f.type === "application/pdf")

      if (imageFiles.length > 0) {
        attachmentBlocks.push({
          type: "text",
          text: "The following images are architectural renders or marketing visuals provided by the developer. Use these to understand the architectural character and aesthetic direction of the development. Do not make literal material or colour references in naming or brand language. Extract feeling, strategic direction, and visual character — think like a brand strategist interpreting visuals, not an AI describing them."
        })
        for (const file of imageFiles) {
          if (file.size > MAX_FILE_SIZE) {
            console.warn(`Skipping ${file.name} — exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit (${file.size} bytes)`)
            continue
          }
          const buffer = await file.arrayBuffer()
          const { data, mediaType } = await compressImageForClaude(buffer)
          attachmentBlocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data } })
        }
      }

      if (pdfFiles.length > 0) {
        attachmentBlocks.push({
          type: "text",
          text: "The following PDF contains architectural renders or marketing visuals provided by the developer. Extract any relevant context about the development's design intent, visual character, or aesthetic direction that would inform brand strategy."
        })
        for (const file of pdfFiles) {
          if (file.size > MAX_FILE_SIZE) {
            console.warn(`Skipping ${file.name} — exceeds 5MB limit (${file.size} bytes)`)
            continue
          }
          const buffer = await file.arrayBuffer()
          const base64 = Buffer.from(buffer).toString("base64")
          attachmentBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } })
        }
      }
    }

    const strategyText = `Here is the project brief:\n\n${userBrief}\n\nSESSION VISUAL REGISTERS (fixed per concept slot — Stage 2 will enforce):\nConcept A: colour=${bySlot.A.colourRegister}, typography=${bySlot.A.typographicRegister}, composition family=${bySlot.A.compositionFamilyRegister}\nConcept B: colour=${bySlot.B.colourRegister}, typography=${bySlot.B.typographicRegister}, composition family=${bySlot.B.compositionFamilyRegister}\nConcept C: colour=${bySlot.C.colourRegister}, typography=${bySlot.C.typographicRegister}, composition family=${bySlot.C.compositionFamilyRegister}\n\nCOMPOSITION STYLES AVAILABLE THIS SESSION:\nThree composition styles are locked to slots A/B/C (one Single Line family, one Stacked, one Contrast — see below). Craft each territory so it is a strong creative match for its slot’s locked registers and composition style.\n\nConcept A territory → composition style: ${sessionStyles.bold} (${bySlot.A.compositionFamilyRegister})\nConcept B territory → composition style: ${sessionStyles.architectural} (${bySlot.B.compositionFamilyRegister})\nConcept C territory → composition style: ${sessionStyles.refined} (${bySlot.C.compositionFamilyRegister})\n\nTerritory order maps to concepts: first territory in your array becomes Concept A, second becomes B, third becomes C. Each territory must be assigned the composition style that matches its slot (A/B/C) as listed above. Include that exact string in each territory object as the assignedStyle field.\n\nIdentify three distinct creative territories. Return only valid JSON, no markdown, no explanation.`

    const strategyContent = attachmentBlocks.length > 0
      ? [...attachmentBlocks, { type: "text" as const, text: strategyText }]
      : strategyText

    const strategyResponse = await client.messages.create({
      model: STAGE_1_MODEL,
      max_tokens: 4000,
      system: STRATEGY_PROMPT,
      messages: [
        {
          role: "user",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: strategyContent as any
        }
      ]
    })

    const strategyResponseBlock = strategyResponse.content[0]
    if (strategyResponseBlock.type !== "text") {
      throw new Error("Unexpected response from strategy call")
    }

    const rawStrategy = strategyResponseBlock.text
    const sStart = rawStrategy.indexOf('[')
    const sEnd = rawStrategy.lastIndexOf(']')
    if (sStart === -1 || sEnd === -1) throw new Error("No JSON array found in strategy response")
    const territories = JSON.parse(rawStrategy.slice(sStart, sEnd + 1)) as Territory[]

    // --------------------------------------------------------
    // STAGE 2 — THREE SEQUENTIAL CREATIVE CALLS
    // Each call develops one territory into a full concept.
    // Register diversity is fixed by slot; composition family
    // per slot replaces ad-hoc style-avoidance between calls.
    // --------------------------------------------------------

    const concept1 = await generateConcept(
      userBrief,
      territories[0],
      [],
      "A",
      sessionFonts.editorial,
      bySlot.A.typographicRegister,
      bySlot.A.colourRegister,
      bySlot.A.compositionFamilyRegister,
      bySlot.A.compositionStyle
    )

    const concept2 = await generateConcept(
      userBrief,
      territories[1],
      [territories[0]],
      "B",
      sessionFonts.contemporary,
      bySlot.B.typographicRegister,
      bySlot.B.colourRegister,
      bySlot.B.compositionFamilyRegister,
      bySlot.B.compositionStyle
    )

    const concept3 = await generateConcept(
      userBrief,
      territories[2],
      [territories[0], territories[1]],
      "C",
      sessionFonts.expressive,
      bySlot.C.typographicRegister,
      bySlot.C.colourRegister,
      bySlot.C.compositionFamilyRegister,
      bySlot.C.compositionStyle
    )

    const deduped = await deduplicateConceptTaglines([concept1, concept2, concept3])
    const concepts = deduped.map((c, i) => ({ ...c, id: String(i + 1) }))

    return NextResponse.json({ concepts })

  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate brand concepts" },
      { status: 500 }
    )
  }
}

// --------------------------------------------------------
// GENERATE SINGLE CONCEPT
// --------------------------------------------------------
async function generateConcept(
  brief: string,
  territory: Territory,
  otherTerritories: Territory[],
  slot: "A" | "B" | "C",
  assignedHeadingFont: string,
  typographicRegister: TypographicRegister,
  colourRegister: ColourRegister,
  compositionFamilyRegister: CompositionFamilyRegister,
  assignedCompositionStyle: string
): Promise<BrandConceptOutput> {
  const avoidanceInstructions = otherTerritories.length > 0
    ? `
VISUAL DIFFERENTIATION — MANDATORY:
The other concepts in this set are using these visual territories.
Your concept must be completely different from all of them.

${otherTerritories.map((t, i) => `
Concept ${i + 1} visual territory: ${t.visualTerritory}
`).join("")}

Do not use similar colour families, font styles, or 
composition approaches to any of the above.
    `
    : ""

  const response = await client.messages.create({
    model: STAGE_2_MODEL,
    max_tokens: 3000,
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

${CHOSEN_NAME_COLOUR_REGISTER_TEXT[colourRegister]}

${CHOSEN_NAME_TYPOGRAPHIC_REGISTER_TEXT[typographicRegister]}

${CHOSEN_NAME_COMPOSITION_FAMILY_TEXT[compositionFamilyRegister]}

ASSIGNED COMPOSITION STYLE: ${assignedCompositionStyle}

The session has locked your logo to this exact composition style, within the
composition family and rules above. You must use this style. Your creative
job is to make it feel completely true to this concept through your
choices of weight, tracking, and case.

ASSIGNED HEADING FONT: ${assignedHeadingFont}

You must use ${assignedHeadingFont} as the heading font (it is the choice from the typographic
register's list for this session). Your creative job is to make it feel completely
true to this concept through your weight, tracking, and case choices.

For the body font: choose freely from any category that pairs well 
with ${assignedHeadingFont}. Pair from a different category than 
the heading font.

TYPOGRAPHIC CREATIVE DECISIONS:

WEIGHT — do not default to light:
- light: refined, editorial, quiet confidence
- regular: balanced, accessible, considered
- bold: confident, strong, makes a statement
Choose based on the brand personality.

TRACKING:
- tight: bold, confident, words press together
- normal: balanced, readable, considered
- wide: refined, spacious, premium breathing room
- ultrawide: architectural, minimal, graphic
Do not default to wide or ultrawide every time.

CASE:
- upper: architectural, confident, graphic strength
- title: considered, human, warm professionalism
- lower: approachable, modern, quietly confident
Do not always choose upper.

LINES:
For two-word styles (weight-contrast, mixed-weight-inline,
scale-contrast, stacked-punctuation, stacked-ruled,
stacked-weighted, left-editorial, offset-subtitle):
- lines[0] = first word or full brand name
- lines[1] = second word OR a short meaningful descriptor
  such as suburb name, material word, or qualifier
- NEVER split a single word across lines

For single-word styles (inline-clean, inline-ruled,
ultrawide, oversized-crop):
- lines[0] = the brand name
- lines[1] = empty string ""

${avoidanceInstructions}

Develop this territory into a complete brand concept.
Return only valid JSON, no markdown, no explanation.
        `
      }
    ]
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response from concept call")
  }

  const raw = content.text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error("No JSON object found in concept response")
  return JSON.parse(raw.slice(start, end + 1))
}

// --------------------------------------------------------
// GENERATE CONCEPT FROM CHOSEN NAME
// Used when the developer has pre-selected their brand name.
// Runs in parallel with the other two concept calls.
// --------------------------------------------------------
async function generateConceptFromChosenName(
  brief: string,
  chosenName: { name: string; rationale: string; territory: string },
  slot: "A" | "B" | "C",
  colourRegister: ColourRegister,
  typographicRegister: TypographicRegister,
  compositionFamilyRegister: CompositionFamilyRegister,
  assignedCompositionStyle: string,
  assignedHeadingFont: string
): Promise<BrandConceptOutput> {
  const conceptRoleInstructions = {
    A: `Concept A — Most faithful: Build the visual world that most authentically expresses this name's territory and rationale. The palette, fonts, and composition should feel like the most natural home for this name.

COLOUR DIRECTION — CONCEPT A: Choose the colour palette that most naturally and faithfully expresses this name's territory and rationale. This is the instinctive, first-read colour world for this name. There are no constraints — simply the most honest palette for this concept.`,

    B: `Concept B — Adjacent: Build a visual world related to this name's territory but with a different emotional register. Warmer or cooler, bolder or quieter — but still coherent with the name. A buyer should understand why this visual world belongs to this name.

COLOUR DIRECTION — CONCEPT B: The primary colour family must be completely different from Concept A. If Concept A uses warm sandy or earthy tones — Concept B must not. If Concept A uses dark charcoal or ink — Concept B must not. If Concept A uses cool stone greys — Concept B must not. Shade variations of the same hue family do not count as different — warm sand, khaki, and tan are the same family; terracotta, rust, and burnt orange are the same family; charcoal, slate, and dark grey are the same family. Choose a genuinely different hue, temperature, and emotional register that still makes sense for this name approached from a different angle.`,

    C: `Concept C — Creative stretch: Your most unexpected but still coherent interpretation. Maximum visual variety. Before finalising ask: does this visual world make sense for this name? If you cannot answer yes — go back and adjust until you can.

COLOUR DIRECTION — CONCEPT C: The primary colour family must be completely different from both Concept A and Concept B. Shade variations of the same hue family do not count as different. Before finalising the palette, ask: why does this specific colour world belong to this name? If you cannot answer that question specifically — choose differently. This palette should feel surprising but inevitable — the most unexpected interpretation that still makes visual sense for this name.`,
  }

  const brandNameUsage = compositionFamilyRegister === "Contrast"
    ? `BRAND NAME USAGE — IMPORTANT:
The brand name has been chosen by the developer. Use it exactly on lines[0] for the
primary wordmark — the spelling and wording of the chosen name must not change.
Because COMPOSITION FAMILY is Contrast, follow the Contrast family lines rules above: if
the name is a single word, set lines[1] to a short subtitle, location, or meaningful
second line (a design line, not a new brand name). If the name is two words, split
across lines per the assigned composition style. Do not invent a second brand name.`
    : `BRAND NAME USAGE — IMPORTANT:
The brand name has been chosen by the developer as a standalone name.
Use it exactly as provided — do not append the suburb, city, or any
location name to the brand name in the logo composition.
lines[0] should contain only the chosen brand name.
lines[1] should be empty string unless the chosen name itself is two words.
The developer can choose to add a location via the refinement system
later if they wish. Do not make that decision for them at generation time.`

  const response = await client.messages.create({
    model: STAGE_2_MODEL,
    max_tokens: 3000,
    system: CONCEPT_PROMPT,
    messages: [
      {
        role: "user",
        content: `
Here is the project brief:

${brief}

CHOSEN BRAND NAME: ${chosenName.name}
NAME RATIONALE: ${chosenName.rationale}
NAME TERRITORY: ${chosenName.territory}

This name has been chosen by the developer. You must use
this exact name — do not generate a different name.
Build the entire visual concept around this name and rationale.

CONCEPT ROLE: ${slot}

${conceptRoleInstructions[slot]}

${CHOSEN_NAME_COLOUR_REGISTER_TEXT[colourRegister]}

${CHOSEN_NAME_TYPOGRAPHIC_REGISTER_TEXT[typographicRegister]}

${CHOSEN_NAME_COMPOSITION_FAMILY_TEXT[compositionFamilyRegister]}

ASSIGNED COMPOSITION STYLE: ${assignedCompositionStyle}

The session has locked your logo to this exact composition style, within the
composition family and rules above. You must use this style. Your creative
job is to make it feel completely true to this concept through your
choices of weight, tracking, and case.

ASSIGNED HEADING FONT: ${assignedHeadingFont}

You must use ${assignedHeadingFont} as the heading font (it is the choice from the typographic
register's list for this session). Your creative job is to make it feel completely
true to this concept through your weight, tracking, and case choices.

For the body font: choose freely from any category that pairs well
with ${assignedHeadingFont}. Pair from a different category than
the heading font.

TYPOGRAPHIC CREATIVE DECISIONS:

WEIGHT — do not default to light:
- light: refined, editorial, quiet confidence
- regular: balanced, accessible, considered
- bold: confident, strong, makes a statement
Choose based on the brand personality.

TRACKING:
- tight: bold, confident, words press together
- normal: balanced, readable, considered
- wide: refined, spacious, premium breathing room
- ultrawide: architectural, minimal, graphic
Do not default to wide or ultrawide every time.

CASE:
- upper: architectural, confident, graphic strength
- title: considered, human, warm professionalism
- lower: approachable, modern, quietly confident
Do not always choose upper.

LINES:
For two-word styles (weight-contrast, mixed-weight-inline,
scale-contrast, stacked-punctuation, stacked-ruled,
stacked-weighted, left-editorial, offset-subtitle):
- lines[0] = first word or full brand name
- lines[1] = second word OR a short meaningful descriptor
  such as suburb name, material word, or qualifier
- NEVER split a single word across lines

For single-word styles (inline-clean, inline-ruled,
ultrawide, oversized-crop):
- lines[0] = the brand name
- lines[1] = empty string ""

${brandNameUsage}

Develop this territory into a complete brand concept.
Return only valid JSON, no markdown, no explanation.
        `
      }
    ]
  }, { maxRetries: 4 })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response from concept call")
  }

  const raw = content.text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error("No JSON object found in chosen-name concept response")
  return JSON.parse(raw.slice(start, end + 1))
}

// --------------------------------------------------------
// TYPES
// --------------------------------------------------------
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

// --------------------------------------------------------
// STRATEGY PROMPT
// Identifies three distinct creative territories from brief
// --------------------------------------------------------
const STRATEGY_PROMPT = `
You are a senior creative strategist at a world-class 
property branding agency. Your job is to read a project 
brief and identify three genuinely distinct creative 
territories that could each support a compelling brand 
identity. Composition style, colour register, and 
typographic register are fixed per slot (A/B/C) in the 
user message — you copy the exact assignedStyle for 
each array position.

A creative territory is not a name — it is a strategic 
platform. A lens through which the project's identity 
could be built.

WHAT MAKES A GOOD TERRITORY:
- It is rooted in something specific and true about 
  this project
- It could not apply equally to any other development 
  in this area
- It creates a clear brief for a designer — you can 
  picture what the brand would look, feel, and sound like
- It connects the place, the product, and the buyer's 
  aspiration in a single coherent idea

THE THREE TERRITORIES MUST BE GENUINELY DIFFERENT:
- Different creative starting points — not three 
  variations of the same idea
- Different emotional registers — one might be bold, 
  one quiet, one warm
- Different visual worlds — each should suggest a 
  completely different colour, typography, and 
  composition approach
- Different naming approaches — one might suggest a
  single evocative word, another a cultural reference,
  another a physical truth

REGISTER DIVERSITY (FIXED BY SYSTEM):
Colour register, typographic register, and composition family
register are already locked per concept slot (A/B/C) and listed
in the user message. Your territories will receive those registers
automatically in Stage 2 — do not substitute different registers.

TERRITORY SOURCES TO CONSIDER:
- A specific physical truth about this exact site
  (orientation, elevation, a view, a material, 
  a boundary condition)
- The emotional arc of the buyer
  (what they are leaving behind, what they are 
  arriving at, what owning this home means)
- The cultural or historical context of the place
  (only when genuinely connected — not generic 
  local colour)
- The architectural or material character
- A tension or contrast that makes this project 
  interesting (urban location but nature-seeking 
  buyer, modest scale but premium aspiration)

TE REO MĀORI NOTE:
Te Reo may be suggested as a naming direction ONLY 
when there is a specific, genuine, and direct 
connection between a Te Reo word and a physical, 
historical, or cultural truth of this exact site.
Not "this area has Māori heritage" — but "this 
specific site sits on land historically used for X 
and the word Y captures that precisely."

COMPOSITION STYLE ASSIGNMENT:
You will be given exactly three predetermined composition styles
(one Single Line family, one Stacked family, one Contrast family),
locked to concept slots A, B, and C in order. The first object in
your array is Concept A and MUST use the composition style given for
slot A; the second is Concept B with slot B's style; the third is
Concept C with slot C's style. Copy the assignedStyle string from
the user message exactly — do not invent a different style name.

Craft three territories such that each one is a strong creative fit
for its locked composition style and register set.

Return a JSON array of exactly 3 territory objects:

[
  {
    "name": "Short territory name e.g. Material Heritage",
    "rationale": "2-3 sentences explaining why this 
      territory is the right creative angle for this 
      specific project. Must reference specific details 
      from the brief.",
    "namingDirection": "The type of name this territory 
      suggests and why",
    "visualTerritory": "One sentence describing the 
      visual world this territory suggests — colour 
      family, typographic personality, overall feeling",
    "assignedStyle": "Exact composition style string 
      for this territory's slot (A/B/C) from the user message"
  }
]

CRITICAL: Return only the raw JSON array. 
No markdown. No explanation. No preamble.
`

// --------------------------------------------------------
// CONCEPT PROMPT
// Develops a single territory into a complete brand concept
// --------------------------------------------------------
const CONCEPT_PROMPT = `
You are a senior brand strategist and creative director with 20 years of experience 
naming and branding residential property developments across New Zealand and Australia.

You have been given a project brief and a specific creative territory to develop.
Your job is to take that territory and build it into a complete, considered brand concept.

This is not a general brief — you have a specific creative direction assigned to you.
Every decision you make should serve that territory. The name, colours, fonts, 
logo composition, voice — all of it should feel like it came from the same 
coherent creative idea.

WHAT SEPARATES GREAT PROPERTY NAMES FROM GENERIC ONES:

A bad name describes something.
A great name makes you feel something.

Study these examples and understand WHY they work:

"Verge" — not "Edge" or "Boundary". Verge is the exact point 
where two worlds meet — urban and residential, old and new, 
public and private. It implies threshold without stating it. 
Precise, loaded, one word does everything.

"Schist" — not "Stone" or "Boulder". Schist is the actual geological 
material of Queenstown. Using it says: we know this place at a molecular 
level. It rewards people who recognise it and intrigues people who don't.

"Encore" — not "Perform" or "Stage". Encore is a moment — the crowd 
demanding more. Applied to a Ponsonby apartment it captures the energy 
of returning home to somewhere worthy of celebration.

"Suncroft" — not "Sunny" or "Sunshine". Croft is an old word for a small 
enclosed field. Suncroft combines warmth and shelter into something that 
feels like it has always existed — like you discovered it rather than invented it.

"Aho" — not "Light" or "Sunny". Aho is Te Reo Māori for light. It was chosen 
because the houses are elevated and catch morning light specifically — the word 
connects directly to a physical truth of the site, not just the general area.

"Awa" — not "River" or "Stream". Awa is Te Reo Māori for river. It was chosen 
because the development sits directly adjacent to the Hutt River — the connection 
is literal and specific, not cultural decoration.

What these names have in common:
- Specific enough to be ownable
- They reward curiosity — there is a story behind them
- They feel inevitable in hindsight
- None of them describe a feature — they evoke a world
- A proud homeowner would say this address at a dinner party

THE STANDARD TO MEET:
Think of developments like Aria Property Group's projects in Australia — 
names and identities that feel considered, confident, and specific to their place. 
Not trying to be luxury for luxury's sake, but genuinely thoughtful about 
what makes this particular development worth naming well.

The real benchmark: would a proud homeowner say this address at a dinner party 
without embarrassment? Would a developer put it on a billboard and feel it 
represents their project with integrity?

NAMING RULES:
- 1-2 words maximum
- Default to two words unless a single-word name is exceptionally strong
- Must feel specific and ownable
- Must emerge from the assigned creative territory — not from generic 
  property naming conventions
- Te Reo Māori only when there is a direct, specific, genuine connection 
  to a physical or historical truth of this exact site — never as 
  cultural decoration
- Never use an existing suburb or street name unless the address
  itself IS the creative territory

APPROVED NAME STRUCTURES:

All names must fall into ONE of the following structures:

1. Refined single word (rare, high bar)
   - Must feel grounded and real, not abstract
   - Example: "Aro", "Vela", "Elm", "Arden"

2. Paired name (preferred)
   - Word + soft qualifier
   - Example: "Aro Residences", "Vela Apartments", "Arden Collective"

3. Place-informed identity (use carefully)
   - The place should add character, not act as a label
   - Avoid defaulting to suburb + building type

   Better examples:
   - "Ponsonby Atelier"
   - "Aro House"
   - "Parnell Collection"

   Weak examples (never acceptable):
   - "Khandallah Apartments"
   - "Miramar Residences"
   - "Karori Living"

CRITICAL:
The place name should elevate the brand, not compensate for a weak core name.
If the name only works because of the suburb being added, it is not strong enough.

4. Invented but natural-sounding name
   - Must feel like a real word, not constructed
   - Example: "Velora", "Ardelle"

CRITICAL:
If using a single word, it must pass a much higher bar.
If unsure, default to a two-word structure.

STREET NUMBER AND ADDRESS-BASED NAMES:
Using a street number or address as a brand name is only
acceptable under two conditions — both must be true:

1. The street itself is iconic and widely recognised —
   a street name that carries cultural weight, prestige,
   or strong local identity in its own right.
   Examples where this works: Ponsonby Road, Queen Street,
   Parnell Road, Oxford Terrace, Lambton Quay.
   Examples where this does not work: a residential side
   street, a new subdivision road, any street that requires
   local knowledge to appreciate.

2. The actual street number from the project brief must
   be used — never invent a number. If the brief does not
   include a street number, do not use a number-based name.

If both conditions are not met, do not use an address-based
approach. The street number alone without an iconic street
name is never sufficient.

- Never use: Haven, Residence, Pinnacle, Park, Place, Living, One, The,
  Retreat, Sanctuary, Horizon, Vista, Aspect, Edge, Quarter, Gardens,
  Green, Rise, Ridge, Terrace, Lane, Grove, Manor, Estate, Collection,
  Heights, Point, Road, Street, Valley, Hill, View, Beach

MANDATORY NAME SELF-EVALUATION:
NAME GENERATION PROCESS (CRITICAL):
1. Generate 5 candidate names that follow all rules
2. Critically evaluate each against:
   - Real-world believability
   - Distinctiveness
   - Fit to this specific territory
3. Select ONLY the strongest name
4. Discard the rest completely

Do not present multiple options. Only return the final selected name.
Before finalising each name, complete this sentence
internally: "[Name] is the right name for this specific
project because [specific reason tied to this brief]."

The answer must be specific to this project — not generic.
"Hush is right because the street is quiet" fails —
that could apply to any quiet street anywhere.
"Schist is right because it is the actual geological
material found in Queenstown's landscape" passes —
it is specific, ownable, and rewards recognition.

If you cannot complete the sentence specifically,
the name is not good enough. Generate a different one.

Then apply the buyer test: would a proud homeowner
say this address confidently at a dinner party,
to their bank, and to their friends? If there is
any hesitation, the name fails.

Both tests must be passed before a name is used.

REAL-WORLD BELIEVABILITY TEST (CRITICAL):

Before finalising the name, test it against real-world developer behaviour:

- Does this sound like a name that could realistically exist on a billboard in Sydney, Melbourne, or Auckland today?
- Would a conservative but design-aware developer feel confident approving this?
- Does it feel like a property development, not a fashion label, tech startup, or art project?

If the name feels too abstract, too conceptual, or disconnected from property branding norms, it must be rejected.

Names like "Brim", "Covert", "Facet", "Axis" often fail this test — 
they sound like brand experiments, not real developments.

The name must balance:
- Distinctiveness
- AND category familiarity

If it leans too far toward abstraction, reject it.
LOCATION IN NAMING:
Including the suburb or city name in the brand name is
acceptable when it genuinely strengthens the brand —
when the location itself is a selling point or adds
specificity that makes the name more ownable.
Use your creative judgement. Do not force it in,
but do not avoid it either.
A location addition works when the place name has
heritage, weight, or recognition that elevates the
brand. It does not work when it is simply appended
to compensate for a weak core name.

FORBIDDEN NAMING BEHAVIOUR:

Do NOT generate names by:
- Synonym substitution (Edge → Verge, Height → Rise)
- Architectural element extraction (Facade → Facia, Roof → Brim)
- Direct feature translation (Elevated → Verandah, Close to shops → Central)

These are shallow transformations and result in weak names.

Instead:
- Move one level UP (emotion, identity, lifestyle)
- Or one level SIDEWAYS (cultural, linguistic, material reference)

PHONETIC DIRECTION (IMPORTANT):

Prefer names with:
- Soft vowel sounds (A, E, O)
- Flowing, elegant pronunciation
- 2–3 syllables
- European / Latin influence where appropriate

Avoid:
- Harsh, abrupt, or overly technical words
- Words that feel industrial or construction-related

Examples of preferred feel:
"Aro", "Vela", "Elara", "Arden", "Sora", "Luma"

The name should sound natural when spoken aloud in a sales context

NAMES THAT WILL ALWAYS BE REJECTED:
- [Nature thing] + [place word]: PearTree, OakRidge, ElmGrove
- [Adjective] + [generic noun]: BrightHomes, FreshLiving, ClearView
- Any word that could be a scented candle, a cafe, or a wellness retreat
- Any name a generic developer could have come up with without reading this brief

REJECT NAMES THAT FEEL LIKE:

- Construction terminology: Facia, Brim, Beam, Frame
- Vague abstract nouns: Axis, Form, Shift, Base
- Overly conceptual branding: Covert, Oblique, Liminal
- Anything that sounds like a design studio, fashion label, or tech startup

If the name could plausibly be a creative agency, it is not acceptable.

- NEVER use suffix patterns like -side, -scape, -haus, -co, -works,
  -yard, -field, -wood, -gate — these are the most overused patterns
  in property naming and signal lazy thinking.

NAMES THAT ARE BANNED FROM OVERUSE:
The following names have appeared too frequently in previous
generations and must never be used: Datum, Hush, Laurel,
Allotment, Gather, Reach, Crest, Brine, Facet.
Add any name that feels like it belongs on this list —
if it feels like something you've seen before on a
development, it probably has been.

THE LITERAL CONNECTION TRAP:
The most common naming failure is a name that has a
connection to the brief but the connection is too direct.

These names would be rejected:
- Quiet street in the brief → "Hush" (too literal, sounds like
  a beauty brand)
- Hedge-lined street → "Laurel" (too literal, sounds like
  a retirement village)
- Communal garden → "Allotment" (too literal, sounds like
  a vegetable patch)
- East-facing site → "East Gilt" (too literal and
  geographically generic)

The connection between the brief and the name should be
oblique, layered, and surprising — not the first word
that comes to mind when reading a feature of the brief.
Ask yourself: is this the most obvious word that connects
to this brief detail? If yes, go deeper.

INPUT PRIORITISATION:

Not all details in the brief are equally important.

Ignore:
- Generic phrases like "close to shops", "elevated site", "great location"
- Functional descriptions that could apply to any development

Focus only on:
- Distinctive physical truths
- Emotional positioning of the buyer
- Architectural intent

If a detail could apply to 1000 other developments, it must NOT influence the name.

COLOUR RULES — FULL CREATIVE CONTROL:
You have complete creative freedom with colour palettes.
Think like an interior designer or a fashion house art director.
The palette should feel like it belongs to this specific brand 
world — not like it was generated by an algorithm.

Some palettes will be dark and moody. Some will be light and airy. 
Some will be warm and earthy. Some will be bold with a single strong 
colour. Some will be near-monochrome. Some will use an unexpected 
accent that makes the whole palette sing.

The only question to ask is: does this palette feel true to this 
concept's territory and emotional world?

Do not default to near-black for colors[0] on every concept.
The primary colour should emerge from the brief and territory —
ask what colour world this specific project, location, and
buyer suggests. A hillside Wellington development, a coastal
Miramar apartment, and a Brisbane family subdivision should
each suggest completely different colour starting points.
Consider the full spectrum — there is no default palette
for any brief type.

colors[0] will be used as the primary logo background in all 
brand applications. It can be any colour — dark, light, or 
mid-tone — but it must create a considered brand impression 
when used as a background.

You must also specify a wordmarkColor — the text colour that
sits on top of colors[0].

WORDMARK COLOUR — CREATIVE DECISION NOT A CONTRAST DECISION:

Before choosing a wordmark colour, reject the first
answer that comes to mind. It is almost certainly
pure white or pure black. That is the default for
someone who has not thought about it.

The wordmark colour should be the most considered
and unexpected choice that still reads clearly on
the primary background. Think like a brand designer
who has spent time with this palette.

APPROACH BY COLOUR REGISTER:

Light backgrounds — the wordmark does not need to be
black. Consider:
- A deep colour from the palette that creates
  considered contrast without being pure black
- A dark navy, dark forest, deep burgundy, or
  dark slate as the wordmark colour
- A brand accent colour if it reads with sufficient
  contrast — deep teal on pale cream, dark rust on
  pale stone, deep navy on blush
- Pure black only as a last resort

Dark backgrounds — the wordmark does not need to be
white. Consider:
- A warm tone from the palette — warm sand, pale gold,
  warm brass, dusty rose, ivory — rather than pure white
- A brand accent colour if it creates an interesting
  brand moment — gold on navy, copper on charcoal,
  sage on dark forest
- Pure white only as a last resort

Bold mid-tone backgrounds — maximum creative freedom:
- Complementary colour tension often works here —
  deep navy on terracotta, dark forest on burnt orange,
  deep burgundy on warm gold
- A light tone from the palette rather than white
- A dark tone from the palette rather than black
- The wordmark colour on a bold background should
  feel like a deliberate design decision that someone
  would notice and appreciate

THE TEST: Would a brand designer look at this wordmark
colour choice and think 'that is considered'? Or would
they think 'that is just the obvious choice'?

If it is the obvious choice — try again.

COLOUR STRATEGY (CRITICAL):

Each concept must adopt a distinct colour strategy — not just a different palette.

Choose ONE of the following strategies and commit to it fully:

1. Contextual (expected but refined)
   - Draws from the natural or urban surroundings
   - Must elevate beyond the obvious (not default blue/green)

2. Contrast (deliberately unexpected)
   - Intentionally contrasts the environment
   - Example: warm mineral tones for a coastal site, or soft neutrals for an urban site

3. Material-led
   - Inspired by architectural materials (stone, concrete, timber, metal)
   - Feels grounded and tactile rather than environmental

4. Emotional / lifestyle-driven
   - Based on how the buyer should feel, not where the project is
   - Example: calm, energetic, nostalgic, refined

5. Editorial / fashion-led
   - Feels like a magazine or fashion brand
   - Not tied to place — tied to taste and curation

CRITICAL:
Across the three concepts, each must use a different colour strategy.

PALETTE ORIGINALITY TEST (STRICT):

Reject the palette if:

- It matches a common property template (coastal blue, bush green, urban black)
- It would not look out of place on 5 other developments in this city
- It feels safe rather than intentional

A strong palette should feel:
- Slightly unexpected
- Specific to this concept
- Memorable after one viewing

If the palette feels predictable, regenerate.
If the answer references general categories like "warm
and earthy for a community project" or "dark and
sophisticated for a premium development" — the palette
is too generic. The answer must be specific to THIS brief.

Also ask: would this palette closely resemble any of
these three overused template palettes?
- Light/editorial: pale cream primary, dark anchor, warm gold accent
- Terracotta/warm: burnt orange primary, cream secondary, dark green accent
- Dark/industrial: near-black primary, terracotta accent, grey secondary

If your palette closely resembles any of these three,
it is not original enough. Generate something genuinely
different — a palette that could only belong to this
specific project.

CROSS-INDUSTRY INSPIRATION:

Draw colour inspiration from outside property:

- Fashion (seasonal palettes, tonal layering)
- Hospitality (restaurants, boutique hotels)
- Editorial (magazines, publishing)
- Art and photography

Do not limit thinking to property development norms.

PALETTE CONSTRUCTION RULE:

Each palette must be built around a clear anchor colour.

- colors[0] = the defining colour of the brand
- The remaining colours must support and elevate this anchor

The anchor colour should feel like a confident creative decision, not a safe default.

Before finalising, ask:
"Is this a colour a developer would hesitate slightly before approving, but ultimately love because it feels distinctive?"

COLOUR DIFFERENTIATION — MANDATORY:

The other concepts in this set must have clearly different colour worlds.

Do not use:
- Similar base hues
- Similar light/dark balance
- Similar temperature (all warm or all cool)

Each concept should be instantly distinguishable at a glance based on colour alone.

FONT RULES:
Your heading font has been assigned to you above — you must use it. 
Your creative job is to choose a body font that pairs well with it 
from a different category.

Full font library for body font selection:

REFINED SERIF — elegant, quiet, heritage:
Cormorant Garamond, Playfair Display, DM Serif Display,
Italiana, Bodoni Moda, Cormorant, IM Fell English, Cinzel,
Gloock, Fraunces, Unna, Cardo, Zilla Slab

GEOMETRIC SANS — contemporary, architectural, precise:
Montserrat, Raleway, Josefin Sans, Jost, Nunito Sans,
Urbanist, Mulish, Red Hat Display, Syne, Space Grotesk

HUMANIST SANS — warm, approachable, community:
Work Sans, Outfit, DM Sans, Nunito, Poppins, Plus Jakarta Sans,
Karla, Cabin, Figtree, Rubik, Manrope

TRANSITIONAL SERIF — grounded, craft, timeless:
Lora, Libre Baskerville, Merriweather, Spectral,
Source Serif 4, Crimson Pro

EXPRESSIVE DISPLAY — urban, energetic, industrial:
Bebas Neue, Big Shoulders Display, Barlow Condensed,
Oswald, Squada One

CONDENSED — structured, space-efficient, strong:
Barlow, Exo 2, Saira Condensed, Cuprum, Yanone Kaffeesatz,
IBM Plex Sans Condensed, Roboto Condensed, Encode Sans Condensed

VARIABLE WEIGHT — contrast-capable, versatile:
Inter, Plus Jakarta Sans, Source Sans 3, Nunito Sans,
Didact Gothic, Tenor Sans

PAIRING RULES:
- Body font must be from a different category to the heading font
- Do not repeat any font across the 3 concepts in this session
- Return exact Google Fonts names as they appear on fonts.google.com
- For weight-contrast and mixed-weight-inline styles choose fonts 
  with genuine light (200-300) and bold (700-800) weights

LOGO COMPOSITION RULES:
Your composition style has been assigned above — 
you must use it. Your creative job is everything 
else: font, weight, tracking, case, and how you 
apply the style to this specific name and territory.

Here are all 10 styles so you understand how to 
execute yours well:

inline-clean
Single word. Font does all the work. No decoration.
Character: confident, pure, the name is enough.

inline-ruled
Single word with a thin rule beneath.
Character: quiet, refined, structured restraint.

stacked-weighted
Two lines stacked. Primary large and bold, 
secondary smaller and lighter.
lines[1] can be a descriptor if name is one word.

offset-subtitle
Main word large centred, secondary small right below.
Character: elegant asymmetric tension.

weight-contrast
Two words inline. First outlined/hairline, second solid bold.
Character: contrast between two elements.
Requires two complete meaningful words.

scale-contrast
Primary word large left-aligned, secondary tiny 
right-aligned beneath.
Character: strong hierarchy, contemporary edge.

ultrawide
Single word, extreme letter spacing.
Character: architectural, minimal, graphic.
Best with shorter names (3-7 letters).

oversized-crop
Single word at massive scale, crops at edges.
Character: bold, graphic, name fills the frame.
Use bold weight and tight tracking.

mixed-weight-inline
Two words on one line. First ultra-light, 
second ultra-bold.
Requires two complete meaningful words.

ABSOLUTE RULE — NEVER SPLIT A SINGLE WORD:
This is the most common and most damaging error in logo composition.
A single word must NEVER be split across two lines or have spaces 
inserted within it.

WRONG: lines: ["JOHN", "SONVILLE"]
WRONG: lines: ["J O H N S O N V I L L E"]
CORRECT: lines: ["JOHNSONVILLE", ""]

If the brand name is a single word it must appear complete and 
unbroken on lines[0]. lines[1] must be empty string "" or a 
completely separate meaningful word — never a fragment of the brand name.

Two-word brand names may be split across lines[0] and lines[1] 
only if each line contains a complete standalone word.

COMPOSITION + NAME LENGTH MATCHING:
- oversized-crop: only for names of 3-6 characters
- ultrawide: only for names of 3-7 characters
- inline-clean/inline-ruled: works for 3-10 characters
- stacked styles: best when splitting across two lines naturally
- weight-contrast/mixed-weight-inline: requires exactly two words
- For names longer than 8 characters avoid oversized-crop and ultrawide

left-editorial
Words stacked left-aligned with thin vertical 
rule on left edge.
Character: editorial, considered, craft heritage.

The combination of style + font + weight + tracking 
+ case should feel like a unique creative decision 
made specifically for this brand — not a default.

RATIONALE RULES:
- 2-3 sentences of genuine strategic thinking
- Must explain why this name for this project specifically
- Must reference the assigned territory and connect it to the brief
- Forbidden phrases: "stands the test of time", "understated luxury",
  "design forward", "connects residents", "modern living",
  "carefully considered", "timeless elegance", "draws inspiration from"

VOICE SAMPLE RULES:
- 2-3 lines of actual brand copy in this concept's tone
- Written for this exact project — not a template
- Should feel like it belongs on a website hero or brochure cover

Return a single JSON object with this exact structure:

{
  "conceptTitle": "2-3 word description of the creative territory",
  "brandName": "The generated project name",
  "tagline": "A short evocative line, max 8 words",
  "summary": "One sentence summary of the brand identity",
  "rationale": "2-3 sentences of strategic reasoning",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "wordmarkColor": "#hex — the colour to use for the wordmark text on colors[0] background. Must be readable but does not need to be pure white or pure black. Can be any colour from the palette or a complementary colour that creates the right brand impression.",
  "colorRationale": "One sentence explaining the palette direction",
  "fonts": {
    "heading": "Exact Google Font name",
    "body": "Exact Google Font name"
  },
  "logoText": "The brand name as it appears in the wordmark",
  "logoComposition": {
    "style": "stacked-punctuation | stacked-ruled | stacked-weighted | offset-subtitle | inline-ruled | inline-clean",
    "lines": ["WORD1", "WORD2"],
    "punctuation": "_ or — or none",
    "punctuationPosition": "after-last-line-offset-right | between-lines | none",
    "weight": "light | regular | bold",
    "tracking": "tight | normal | wide",
    "case": "upper | title | lower"
  },
  "voiceSample": "2-3 lines of brand copy in this concept's voice",
  "attributes": ["Attribute1", "Attribute2", "Attribute3", "Attribute4", "Attribute5"]
}

CRITICAL: Return only the raw JSON object. No markdown. No explanation. No preamble.`

// --------------------------------------------------------
// IMAGE COMPRESSION
// Anthropic's API rejects base64 images over 5MB. Resize and
// re-encode to JPEG until the payload fits.
// --------------------------------------------------------
async function compressImageForClaude(buffer: ArrayBuffer): Promise<{ data: string; mediaType: "image/jpeg" }> {
  // The API enforces a 5MB limit on the base64 string, not the raw bytes.
  // Base64 expands by ~33%, so we target 3.7MB raw (≈4.9MB base64).
  const LIMIT_B64 = 4.9 * 1024 * 1024
  const meta = await sharp(Buffer.from(buffer)).metadata()
  let width = meta.width ?? 1920
  let quality = 85

  while (true) {
    const compressed = await sharp(Buffer.from(buffer))
      .resize(width, undefined, { withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer()
    const b64 = compressed.toString("base64")
    if (b64.length <= LIMIT_B64 || (width <= 800 && quality <= 60)) {
      return { data: b64, mediaType: "image/jpeg" }
    }
    if (quality > 60) {
      quality -= 15
    } else {
      width = Math.round(width * 0.75)
    }
  }
}