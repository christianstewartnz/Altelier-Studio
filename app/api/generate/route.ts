import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { projectOverview, siteCharacter, brandAmbition } = await request.json()

    const userBrief = `
PROJECT OVERVIEW
- Location: ${projectOverview.location}
- Development Type: ${projectOverview.developmentType}
- Scale: ${projectOverview.numberOfHomes || "Not specified"}
- Target Market: ${projectOverview.targetMarket}
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
    // STAGE 1 — STRATEGY CALL
    // Fast call to identify three distinct creative territories
    // --------------------------------------------------------
    const strategyResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: STRATEGY_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the project brief:\n\n${userBrief}\n\nIdentify three distinct creative territories. Return only valid JSON, no markdown, no explanation.`
        }
      ]
    })

    const strategyContent = strategyResponse.content[0]
    if (strategyContent.type !== "text") {
      throw new Error("Unexpected response from strategy call")
    }

    const territories = JSON.parse(strategyContent.text) as Territory[]

    // --------------------------------------------------------
    // STAGE 2 — THREE PARALLEL CREATIVE CALLS
    // Each call develops one territory into a full concept
    // Concepts are aware of each other's visual choices
    // to guarantee variety
    // --------------------------------------------------------

    // We generate sequentially for the first two to gather
    // visual choices, then all three are available
    // Actually we run all three in parallel but pass territory
    // info to ensure distinctness via the prompt itself

    const [concept1, concept2, concept3] = await Promise.all([
      generateConcept(
        userBrief,
        territories[0],
        [],
        "A"
      ),
      generateConcept(
        userBrief,
        territories[1],
        [territories[0]],
        "B"
      ),
      generateConcept(
        userBrief,
        territories[2],
        [territories[0], territories[1]],
        "C"
      )
    ])

    const concepts = [concept1, concept2, concept3].map((c, i) => ({
      ...c,
      id: String(i + 1)
    }))

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
  slot: "A" | "B" | "C"
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

  return JSON.parse(content.text)
}

// --------------------------------------------------------
// TYPES
// --------------------------------------------------------
type Territory = {
  name: string
  rationale: string
  namingDirection: string
  visualTerritory: string
}

type BrandConceptOutput = {
  conceptTitle: string
  brandName: string
  tagline: string
  summary: string
  rationale: string
  colors: string[]
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
You are a senior creative strategist at a world-class property branding agency.
Your job is to read a project brief and identify three genuinely distinct 
creative territories that could each support a compelling brand identity.

A creative territory is not a name — it is a strategic platform. 
A lens through which the project's identity could be built.

WHAT MAKES A GOOD TERRITORY:
- It is rooted in something specific and true about this project
- It could not apply equally to any other development in this area
- It creates a clear brief for a designer — you can picture what 
  the brand would look, feel, and sound like
- It connects the place, the product, and the buyer's aspiration 
  in a single coherent idea

THE THREE TERRITORIES MUST BE GENUINELY DIFFERENT:
- Different creative starting points — not three variations of the same idea
- Different emotional registers — one might be bold, one quiet, one warm
- Different visual worlds — each should suggest a completely different 
  colour, typography, and composition approach
- Different naming approaches — one might suggest a single evocative word, 
  another a cultural reference, another a physical truth

TERRITORY SOURCES TO CONSIDER:
- A specific physical truth about this exact site 
  (orientation, elevation, a view, a material, a boundary condition)
- The emotional arc of the buyer 
  (what they are leaving behind, what they are arriving at, 
  what owning this home means for their life)
- The cultural or historical context of the place 
  (only when genuinely connected — not generic local colour)
- The architectural or material character of the development
- A tension or contrast that makes this project interesting
  (urban location but nature-seeking buyer, modest scale but 
  premium aspiration, new building on a site with deep history)

TE REO MĀORI NOTE:
Te Reo may be suggested as a naming direction ONLY when there is 
a specific, genuine, and direct connection between a Te Reo word 
and a physical, historical, or cultural truth of this exact site.
Not "this area has Māori heritage" — but "this specific site sits 
on land historically used for X and the word Y captures that precisely."

NAMING DIRECTION GUIDANCE:
For each territory, suggest the type of name it might produce:
- Single evocative word (Cliff, Schist, Encore)
- Two-word compound (Suncroft, Bankside, Northpoint)
- Cultural or historical reference (earned, not decorative)
- Address-as-identity (when the address itself is the story)
- Sensory or material reference (texture, light, weather, craft)

Return a JSON array of exactly 3 territory objects:

[
  {
    "name": "Short territory name e.g. Material Heritage",
    "rationale": "2-3 sentences explaining why this territory 
      is the right creative angle for this specific project. 
      Must reference specific details from the brief.",
    "namingDirection": "The type of name this territory suggests 
      and why — e.g. A single geological or material word that 
      claims the site's physical character",
    "visualTerritory": "One sentence describing the visual world 
      this territory suggests — colour family, typographic 
      personality, overall feeling"
  }
]

CRITICAL: Return only the raw JSON array. No markdown. No explanation.
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

"Bankside" — not "Riverside" or "WaterEdge". Bankside is specific — 
it references the industrial working bank of a river, implying grit 
transformed into sophistication. It has history and texture. You can picture it.

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
- Must feel specific and ownable
- Must emerge from the assigned creative territory — not from generic 
  property naming conventions
- Te Reo Māori only when there is a direct, specific, genuine connection 
  to a physical or historical truth of this exact site — never as 
  cultural decoration
- Never use an existing suburb or street name unless the address 
  itself IS the creative territory
- Never use: Haven, Residence, Pinnacle, Park, Place, Living, One, The,
  Retreat, Sanctuary, Horizon, Vista, Aspect, Edge, Quarter, Gardens,
  Green, Rise, Ridge, Terrace, Lane, Grove, Manor, Estate, Collection,
  Heights, Point, Road, Street, Valley, Hill, View, Beach

NAMES THAT WILL ALWAYS BE REJECTED:
- [Nature thing] + [place word]: PearTree, OakRidge, ElmGrove
- [Adjective] + [generic noun]: BrightHomes, FreshLiving, ClearView
- Any word that could be a scented candle, a cafe, or a wellness retreat
- Any name a generic developer could have come up with without reading this brief

COLOUR RULES:
- Each palette must have a clear dominant colour world
- Must include at least one dark anchor and one near-white
- Think like an interior designer — palettes should feel like 
  they belong in a considered home
- One accent colour allowed where it genuinely serves the territory
- Never produce 5 mid-tones with no contrast range
- The visual territory assigned to you should guide the palette direction

FONT RULES — CHOOSE FROM THE FULL LIBRARY:
Select fonts that authentically express this concept's 
specific emotional territory. Do not default to safe choices.
Read the territory and name — then choose fonts that 
feel like they belong to this brand world.

REFINED SERIF — elegant, quiet, heritage:
Cormorant Garamond, Playfair Display, DM Serif Display,
Italiana, Bodoni Moda

GEOMETRIC SANS — contemporary, architectural, precise:
Montserrat, Raleway, Josefin Sans, Jost, Nunito Sans

EDITORIAL HIGH CONTRAST — bold, dramatic, fashion:
Bodoni Moda, Yeseva One, Rozha One, Abril Fatface,
Oleo Script

HUMANIST SANS — warm, approachable, community:
Work Sans, Outfit, DM Sans, Nunito, Poppins, 
Plus Jakarta Sans

TRANSITIONAL SERIF — grounded, craft, timeless:
Lora, Libre Baskerville, Merriweather, Spectral,
Source Serif 4, Crimson Pro

EXPRESSIVE DISPLAY — urban, energetic, industrial:
Bebas Neue, Big Shoulders Display, Barlow Condensed,
Oswald, Squada One

CONDENSED — structured, space-efficient, strong:
Barlow Condensed, IBM Plex Sans Condensed,
Roboto Condensed, Encode Sans Condensed

VARIABLE WEIGHT — contrast-capable, versatile:
Inter, Plus Jakarta Sans, Source Sans 3, Nunito Sans

PAIRING RULES:
- Pair heading font with body font from a different category
- Do not repeat any font across the 3 concepts in this session
- For weight-contrast and mixed-weight-inline styles choose 
  fonts with genuine light (200-300) and bold (700-800) 
  weights — Inter, Montserrat, Raleway, Barlow work well
- Return exact Google Fonts names as they appear on 
  fonts.google.com

Font personalities:
- Refined serif (Cormorant Garamond, Playfair Display, DM Serif Display)
  → elegant, quiet, heritage
- Geometric sans (Montserrat, Raleway, Josefin Sans)
  → contemporary, architectural, precise
- Editorial high-contrast (Bodoni Moda, Yeseva One, Rozha One)
  → bold, dramatic, fashion-forward
- Humanist sans (Work Sans, Outfit, DM Sans)
  → warm, approachable, community
- Transitional serif (Lora, Libre Baskerville, Merriweather)
  → grounded, craft, timeless
- Expressive display (Bebas Neue, Big Shoulders Display, Barlow Condensed)
  → urban, energetic, industrial

Pair heading font with body font from a different category.
Return exact Google Fonts names.

LOGO COMPOSITION RULES — CREATIVE DIRECTOR JUDGEMENT:

You have 10 composition styles available. These are your 
toolkit. Read the brand name, the creative territory, and 
the overall concept personality — then choose the style 
that feels most true to this specific brand. There is no 
formula. Use your judgement as a creative director.

Here are the 10 styles and their visual character:

inline-clean
Single word. Clean. The font does all the work.
Character: confident, pure, lets a strong name breathe.

inline-ruled
Single word with a thin rule beneath.
Character: quiet, refined, adds structure without complexity.

stacked-weighted
Two words or lines stacked. Primary word large and bold, 
secondary word small and light below.
Character: hierarchy, one word dominates, the other qualifies.

offset-subtitle
Main word large and centred. Secondary word small, 
anchored to the right below — asymmetric.
Character: elegant tension, a name with a quiet descriptor.

weight-contrast
Two words inline. First word outlined/hairline stroke only. 
Second word solid and bold.
Character: contrast and tension, two equal parts with 
different voices. Inspired by treatments where outline 
and solid type coexist on the same baseline.

scale-contrast
Primary word large and left-aligned. Secondary word 
tiny and right-aligned beneath — diagonal tension.
Character: strong hierarchy, contemporary edge, 
the small word earns its place.

ultrawide
Single word. Extreme letter spacing. Light weight.
Character: architectural, minimal, precise. 
Works best with shorter names (3-6 letters).

oversized-crop
Single word at massive scale — intentionally crops 
at the viewBox edges.
Character: bold, graphic, confident, magazine-cover energy. 
The name fills the entire frame. Use when confidence 
is the message.

mixed-weight-inline
Two words on one line. First word ultra-light/thin. 
Second word ultra-bold. No other decoration.
Character: the weight contrast IS the design. 
Use when two words have natural tension between them.

left-editorial
Words stacked left-aligned. Thin vertical rule 
on the left edge.
Character: editorial, considered, craft or heritage territory. 
Feels like a masthead or a considered publication.

SELECTION GUIDANCE:
- Single word names work with: inline-clean, inline-ruled, 
  ultrawide, oversized-crop — or stacked/offset styles 
  if you add a short descriptor as lines[1]
- Two word names work with: weight-contrast, scale-contrast, 
  mixed-weight-inline, left-editorial, stacked-weighted, 
  offset-subtitle
- tracking options: tight, normal, wide, ultrawide
- weight options: light, regular, bold  
- case options: upper, title, lower
- lines[0] is always the primary word or full name
- lines[1] is the second word, or a short descriptor, 
  or empty string if not needed
- Choose tracking and weight to reinforce the style — 
  ultrawide style should use ultrawide tracking, 
  oversized-crop should use tight tracking, 
  inline-clean can be any weight depending on the font

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

CRITICAL: Return only the raw JSON object. No markdown. No explanation. No preamble.
`