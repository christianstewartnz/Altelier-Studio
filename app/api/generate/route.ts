import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
// import { generateRatelimit } from "@/lib/ratelimit"
import { createClient } from "@/lib/supabase/server"

const client = new Anthropic()

const BOLD_EXPRESSIVE = [
  "oversized-crop",
  "weight-contrast",
  "mixed-weight-inline",
  "scale-contrast"
]

const ARCHITECTURAL_STRUCTURED = [
  "ultrawide",
  "stacked-weighted",
  "left-editorial",
  "stacked-punctuation"
]

const REFINED_ELEGANT = [
  "inline-clean",
  "inline-ruled",
  "offset-subtitle",
  "stacked-ruled"
]

function pickSessionStyles(): {
  bold: string
  architectural: string
  refined: string
} {
  const shuffle = (arr: string[]) =>
    [...arr].sort(() => Math.random() - 0.5)
  return {
    bold: shuffle(BOLD_EXPRESSIVE)[0],
    architectural: shuffle(ARCHITECTURAL_STRUCTURED)[0],
    refined: shuffle(REFINED_ELEGANT)[0]
  }
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
    const { projectOverview, siteCharacter, brandAmbition } = await request.json()

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
    // STAGE 1 — STRATEGY CALL
    // Fast call to identify three distinct creative territories
    // --------------------------------------------------------
    const sessionStyles = pickSessionStyles()

    const strategyResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: STRATEGY_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the project brief:\n\n${userBrief}\n\nCOMPOSITION STYLES AVAILABLE THIS SESSION:\nYou have exactly three composition styles to work with across the three concepts. Assign one to each territory based on which fits best with that territory's character.\n\nBold/Expressive style available: ${sessionStyles.bold}\nArchitectural/Structured style available: ${sessionStyles.architectural}\nRefined/Elegant style available: ${sessionStyles.refined}\n\nEach territory must be assigned a different style from this list. All three must be used exactly once.\nInclude the assigned style in each territory object as the assignedStyle field.\n\nIdentify three distinct creative territories and assign one composition style to each. Return only valid JSON, no markdown, no explanation.`
        }
      ]
    })

    const strategyContent = strategyResponse.content[0]
    if (strategyContent.type !== "text") {
      throw new Error("Unexpected response from strategy call")
    }

    const territories = JSON.parse(strategyContent.text) as Territory[]

    // --------------------------------------------------------
    // STAGE 2 — THREE SEQUENTIAL CREATIVE CALLS
    // Each call develops one territory into a full concept.
    // Sequential execution lets us pass each concept's actual
    // composition style to the next, guaranteeing variety.
    // --------------------------------------------------------

    const concept1 = await generateConcept(
      userBrief, territories[0], [], "A", []
    )

    const concept2 = await generateConcept(
      userBrief, territories[1], [territories[0]], "B",
      [concept1.logoComposition.style]
    )

    const concept3 = await generateConcept(
      userBrief, territories[2], [territories[0], territories[1]], "C",
      [concept1.logoComposition.style, concept2.logoComposition.style]
    )

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
  slot: "A" | "B" | "C",
  usedStyles: string[]
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

  const styleAvoidance = usedStyles.length > 0
    ? `
COMPOSITION STYLES ALREADY USED IN THIS SESSION:
${usedStyles.join(", ")}

You MUST choose a different composition style from all of the above.
Using the same style as another concept is not acceptable.
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

You must use this composition style. It has been 
selected to ensure variety across the three concepts 
in this session. Your creative job is to make it 
feel completely true to this concept through your 
choices of font, weight, tracking, and case.

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

${styleAvoidance}

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
identity. You will also assign a composition style to 
each territory.

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
You will be given three composition styles — one 
bold/expressive, one architectural/structured, one 
refined/elegant. Assign one to each territory based 
on which style best matches that territory's 
emotional character and visual world.

Assignment guidance:
- Bold/expressive styles suit territories that are 
  confident, urban, graphic, or make a strong 
  singular statement
- Architectural/structured styles suit territories 
  that are precise, considered, minimal, or have 
  a strong geometric or material character
- Refined/elegant styles suit territories that are 
  quiet, heritage-influenced, warm, or human in tone

The assignment should feel like a natural creative 
match. If none of the three styles feels perfect 
for a territory, assign the closest fit and the 
concept call will adapt it creatively.

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
    "assignedStyle": "The composition style assigned 
      to this territory from the three available 
      session styles"
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
Variety across the three concepts is essential. Consider: deep 
forest green, warm terracotta, dusty rose, pale stone, rich navy, 
burnt sienna, warm cream, slate blue — any could be the right 
anchor for the right concept.

colors[0] will be used as the primary logo background in all 
brand applications. It can be any colour — dark, light, or 
mid-tone — but it must create a considered brand impression 
when used as a background.

You must also specify a wordmarkColor — the text colour that 
sits on top of colors[0]. This must be readable but should be 
a considered and intentional design decision, not just maximum 
contrast. 

Examples of considered wordmark colour choices:
- Near-black background + warm gold text
- Deep navy background + pale cream text
- Terracotta background + off-white text
- Pale stone background + dark charcoal text
- Forest green background + warm brass text
- Pure white background + deep charcoal text
- Black background + burnt orange text

The wordmark colour should reinforce the brand personality.

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
NEVER split one word into syllables.

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

CRITICAL: Return only the raw JSON object. No markdown. No explanation. No preamble.
`