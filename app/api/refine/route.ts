import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

const client = new Anthropic()

const REFINEMENT_MODEL = process.env.AI_MODEL_TIER === 'production'
  ? 'claude-opus-4-6'
  : 'claude-sonnet-4-6'

const COMMON_PREAMBLE = `
You are a senior brand strategist refining an existing brand concept
for a residential property development in New Zealand or Australia.
The creative territory and brand direction are already decided — your
job is to generate 3 alternative options for ONE specific element.

CRITICAL RULES:
- The brand territory, rationale, and overall direction must remain
  consistent across all alternatives. You are refining within the
  concept, not replacing it.
- Do NOT reproduce any names, taglines, colour palettes, font pairings,
  or logo compositions that already exist across ALL concepts for this
  project — not just the one being refined.
- Generate exactly 3 alternatives.
- Each alternative must be genuinely different from the others and from
  the existing concept — not minor variations of the same idea.

CRITICAL: Return only raw JSON. No markdown. No explanation. No preamble.
`

const NAME_SYSTEM_PROMPT = `${COMMON_PREAMBLE}

You are approaching this as a senior brand strategist at a top creative agency.
Your alternatives must match the calibre and strategic depth of the original
name — not feel like a brainstorm list.

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

YOUR TASK — HOW TO APPROACH THIS:

1. Study the full concept rationale, attributes, and strategic territory carefully.
   Understand WHY the current name works and what makes it ownable and specific
   to this concept. Read the project brief and grasp the physical reality of the
   site, the buyer, and the emotional world this brand lives in.

2. Generate alternatives that belong to the same strategic territory and emotional
   world as the original concept. A buyer reading any of these names alongside the
   brand rationale should feel they make complete sense together — they should feel
   inevitable, not random.

3. Names should feel discovered, not invented — they should surprise the client
   slightly while feeling completely inevitable once explained.

WHAT NAMES MUST BE:
- Short: 1-2 words maximum
- Completely ownable — specific to this place, this concept, this buyer
- Physically or emotionally specific — rooted in a material, moment, feeling,
  or precise quality that connects directly to this site and concept rationale
- Evocative of place, feeling, or material — never abstract or generic
- Consistent with the concept's brand territory — if the concept is warm and
  coastal, names must feel warm and coastal; if bold and architectural, names
  must feel bold and architectural
- Te Reo Māori only when there is a direct, specific, genuine connection to a
  physical or historical truth of this exact site

WHAT NAMES MUST NEVER BE:
- Obvious thematic word associations (coastal brief → sea words, forest brief →
  tree words — that is the first thing anyone would think of, not a brand name)
- Generic property development language: Rise, Pinnacle, Haven, Retreat, Views,
  Edge, Peak, Aspect, Horizon, Vista, Quarter, Gardens, Green, Ridge, Terrace,
  Lane, Grove, Manor, Estate, Collection, Heights, Point, Valley, Hill, Beach,
  Park, Place, Living, One, The, Sanctuary, Residence
- Names that could apply to any development anywhere
- Adjectives used as names
- Names that feel like they belong to a different concept's territory — if the
  concept is warm and intimate, don't generate names that feel corporate or cold
- Minor variations of each other (e.g. "Lightside" → "Sunside" → "Brightside")
- Names using suffix patterns: -side, -scape, -haus, -co, -works, -yard,
  -field, -wood, -gate

NAMES BANNED FROM OVERUSE:
The following names have appeared too frequently and must
never be used in refinements: Datum, Hush, Laurel,
Allotment, Gather, Reach, Crest, Brine, Facet.
Avoid any name that feels like it belongs on this list —
if it feels familiar from another development, it probably is.

THE LITERAL CONNECTION TRAP:
The most common refinement failure is a name that has a
connection to the brief but the connection is too direct.

These would be rejected:
- Quiet street → "Hush" (too literal, sounds like a beauty brand)
- Hedge-lined street → "Laurel" (too literal, sounds like a
  retirement village)
- Communal garden → "Allotment" (too literal, sounds like a
  vegetable patch)
- Any word that could be a scented candle, a café, or a
  wellness retreat

The connection between the brief and the name should be
oblique, layered, and surprising — not the first word that
comes to mind when reading the brief. Ask yourself: is this
the most obvious word that connects to this brief detail?
If yes, go deeper.

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

MANDATORY NAME SELF-EVALUATION:
Before finalising each alternative, complete this sentence
internally: "[Name] is the right name for this specific
project because [specific reason tied to this brief and
concept territory]."

The answer must be specific — not generic.
"Hush is right because the street is quiet" fails.
"Schist is right because it is the actual geological
material of Queenstown's landscape" passes.

Then apply the buyer test: would a proud homeowner say
this address confidently at a dinner party, to their bank,
and to their friends? Any hesitation means the name fails.

Both tests must pass before a name is included.

Return ONLY this JSON:
{ "names": ["Name1", "Name2", "Name3"] }
`

const TAGLINE_SYSTEM_PROMPT = `${COMMON_PREAMBLE}

You are approaching this as a senior brand strategist at a top creative agency.
Your alternatives must match the calibre and strategic depth of the original
tagline — not feel like a brainstorm list.

YOUR TASK — HOW TO APPROACH THIS:

1. Study the full concept rationale, voice sample, attributes, and brand territory
   carefully. Understand the specific emotional register, rhythm, and point of view
   that makes this brand's voice distinct from any other development.

2. Generate alternatives that stay true to the same brand voice and strategic
   territory. Each tagline should feel like it was written by the same author for
   the same brand — different angle, same world.

3. Taglines should feel discovered not written — the right line for this specific
   concept, not a generic property tagline that could belong to any project.

WHAT TAGLINES MUST BE:
- True to the concept's brand voice and emotional territory
- Specific to this brand world — a buyer who read the rationale should feel
  the tagline is inevitable
- Genuinely different creative angles — not three versions of the same line
- Concise: maximum 8 words
- Consistent in tone with the concept's attributes and voiceSample

WHAT TAGLINES MUST NEVER BE:
- Generic property clichés (find your place, come home, live differently,
  discover your next chapter, where life begins, more than a home)
- Lines that belong to a different brand territory — if the concept is bold
  and architectural, don't write soft and pastoral lines; if warm and intimate,
  don't write corporate and aspirational lines
- Three variations of the same idea with different words
- Taglines that could appear on any development in any city

Return ONLY this JSON:
{ "taglines": ["Tagline 1", "Tagline 2", "Tagline 3"] }
`

const COLORS_SYSTEM_PROMPT = `${COMMON_PREAMBLE}

COLOUR PALETTE ALTERNATIVE RULES:
Think like an interior designer or a fashion house art director.
The palette should feel like it belongs to this specific brand
world — not like it was generated by an algorithm.

- Must feel consistent with the brand territory but be genuinely
  different from the existing palette — different colour families,
  not just slightly adjusted hex values
- Each palette has exactly 5 hex colours
- Must include a wordmarkColor that creates a considered brand
  impression on colors[0] — not just maximum contrast
- 3 palettes with genuinely different colour directions that still
  serve the concept
- Each must have a dark anchor and a light colour
- Do not default to near-black for colors[0] — consider deep forest
  green, warm terracotta, dusty rose, pale stone, rich navy, burnt
  sienna, warm cream, slate blue
- Each palette must include a colorRationale explaining the direction

Return ONLY this JSON:
{
  "colorPalettes": [
    {
      "colors": ["#hex1","#hex2","#hex3","#hex4","#hex5"],
      "wordmarkColor": "#hex",
      "colorRationale": "One sentence explaining this palette direction"
    }
  ]
}
`

const FONTS_SYSTEM_PROMPT = `${COMMON_PREAMBLE}

FONT PAIRING ALTERNATIVE RULES:
Select fonts that authentically express this concept's specific
emotional territory. Do not default to safe choices.

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
- Pair heading font with body font from a different category
- Do not repeat any font from the existing concept or other concepts
- Return exact Google Fonts names as they appear on fonts.google.com
- For weight-contrast and mixed-weight-inline styles choose fonts
  with genuine light (200-300) and bold (700-800) weights

Return ONLY this JSON:
{ "fontPairings": [{ "heading": "Font Name", "body": "Font Name" }] }
`

const LOGO_SYSTEM_PROMPT = `${COMMON_PREAMBLE}

LOGO COMPOSITION ALTERNATIVE RULES:

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

Available styles:
inline-clean, inline-ruled, stacked-ruled, stacked-punctuation,
stacked-weighted, offset-subtitle, weight-contrast, scale-contrast,
ultrawide, oversized-crop, mixed-weight-inline, left-editorial

- 3 different composition styles — all different from each other
  and from the current concept's style
- Include full logoComposition object for each with:
  style, lines, punctuation, punctuationPosition,
  weight, tracking, case
- Do not default to light weight and wide tracking — choose based
  on the brand personality
- Vary case across the 3 alternatives — not all upper

Return ONLY this JSON:
{
  "logoCompositions": [
    {
      "style": "inline-clean",
      "lines": ["WORD1", ""],
      "punctuation": "none",
      "punctuationPosition": "none",
      "weight": "light",
      "tracking": "wide",
      "case": "upper"
    }
  ]
}
`

const LOCATION_SYSTEM_PROMPT = `${COMMON_PREAMBLE}

You are generating 3 variations of a brand name combined
with its location for a residential property development.

The developer wants to explore adding the suburb or city
name to the brand name. This is a considered branding
technique when the location itself is a selling point.

WHAT TO GENERATE:
3 different ways to combine the brand name with the location.
Try different combination styles:
- Style 1: Name + Location with no punctuation (e.g. Tallow Rosewood)
- Style 2: Name comma Location (e.g. Tallow, Rosewood)
- Style 3: Name dash Location (e.g. Tallow — Rosewood)

The combination should feel intentional — not like a
label was appended. The location should elevate the name.
The standalone name is always shown as Keep Current —
do not include it in your 3 alternatives.

Return ONLY this JSON:
{ "names": ["Variation 1", "Variation 2", "Variation 3"] }
`

const REMOVE_LOCATION_SYSTEM_PROMPT = `${COMMON_PREAMBLE}

The current brand name includes a location suffix.
The developer wants to explore removing it and using
just the core brand name.

WHAT TO GENERATE:
3 versions of the name with the location removed.
- Option 1: exact core name with location stripped
- Options 2 and 3: subtle variations if the core name
  alone feels incomplete — slightly adjusted form of
  the same word that works better standalone

All 3 must belong to the same brand territory.
All 3 must pass the buyer test and self-evaluation.

Return ONLY this JSON:
{ "names": ["Name1", "Name2", "Name3"] }
`

const SYSTEM_PROMPTS: Record<string, string> = {
  name: NAME_SYSTEM_PROMPT,
  tagline: TAGLINE_SYSTEM_PROMPT,
  colors: COLORS_SYSTEM_PROMPT,
  fonts: FONTS_SYSTEM_PROMPT,
  logo: LOGO_SYSTEM_PROMPT,
  "add-location": LOCATION_SYSTEM_PROMPT,
  "remove-location": REMOVE_LOCATION_SYSTEM_PROMPT,
}

function buildUserMessage(
  item: string,
  concept: any,
  feedback: string,
  allConcepts: any[],
  projectBrief?: any
): string {
  const briefSection = projectBrief ? `
PROJECT BRIEF:
Location: ${projectBrief.location || "—"}
Target Market: ${Array.isArray(projectBrief.targetMarket) ? projectBrief.targetMarket.join(", ") : projectBrief.targetMarket || "—"}
Price Positioning: ${projectBrief.pricePositioning || "—"}
Site Context: ${projectBrief.siteContext || "—"}
Desired Tone: ${projectBrief.desiredTone || "—"}
Brand Direction: ${projectBrief.brandDirection || "—"}
Point of Difference: ${projectBrief.pointOfDifference || "—"}
Buyer Feeling: ${projectBrief.buyerFeeling || "—"}
` : ""

  return `
Here is the current brand concept:

CONCEPT TITLE: ${concept.conceptTitle || "—"}
BRAND NAME: ${concept.brandName}
TAGLINE: ${concept.tagline}
RATIONALE: ${concept.rationale}
COLOR RATIONALE: ${concept.colorRationale || "—"}
ATTRIBUTES: ${Array.isArray(concept.attributes) ? concept.attributes.join(", ") : concept.attributes || "—"}
VOICE SAMPLE: ${concept.voiceSample || "—"}
COLOURS: ${concept.colors.join(", ")}
WORDMARK COLOUR: ${concept.wordmarkColor}
FONTS: ${concept.fonts.heading} / ${concept.fonts.body}
LOGO STYLE: ${concept.logoComposition.style}
${briefSection}
EXISTING CONCEPTS IN THIS PROJECT — DO NOT REPRODUCE ANY OF THESE:
${allConcepts.map((c: any) => `
- Name: ${c.brandName}
- Tagline: ${c.tagline}
- Fonts: ${c.fonts.heading} / ${c.fonts.body}
- Logo style: ${c.logoComposition.style}
`).join("")}
The user wants to refine: ${item.toUpperCase()}
User feedback: ${feedback || "No specific feedback provided"}

Generate exactly 3 alternatives. Return only valid JSON, no markdown, no explanation.
  `.trim()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  try {
    const { concept, conceptId, selectedItems, contextInputs, allConcepts = [], projectBrief, locationPreference } =
      await request.json()

    // Check this concept's remaining refinements
    const { data: conceptRow, error: fetchError } = await supabase
      .from("concepts")
      .select("refinements_available")
      .eq("id", conceptId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !conceptRow) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 })
    }

    const remaining = conceptRow.refinements_available ?? 3

    if (remaining <= 0) {
      return NextResponse.json(
        { error: "No refinements remaining for this concept" },
        { status: 403 }
      )
    }

    // One sequential API call per selected item
    const results: Record<string, unknown> = {}

    for (const item of selectedItems) {
      const systemPrompt = SYSTEM_PROMPTS[item]
      if (!systemPrompt) continue

      let userContent: string
      if (item === "add-location") {
        const locationStr = locationPreference === "suburb"
          ? (projectBrief?.suburb || projectBrief?.location || "—")
          : (projectBrief?.city || projectBrief?.location || "—")
        userContent = `BRAND NAME: ${concept.brandName}
LOCATION TO ADD: ${locationStr}
CONCEPT TERRITORY: ${concept.conceptTitle}
BRAND RATIONALE: ${concept.rationale}

Generate 3 variations combining the brand name with the location.
Try no punctuation, comma separator, and dash separator as three styles.`
      } else if (item === "remove-location") {
        userContent = `BRAND NAME: ${concept.brandName}
CONCEPT TERRITORY: ${concept.conceptTitle}
BRAND RATIONALE: ${concept.rationale}

Generate 3 versions of this name with the location suffix removed.`
      } else {
        userContent = buildUserMessage(item, concept, contextInputs[item] || "", allConcepts, projectBrief)
      }

      const response = await client.messages.create({
        model: REFINEMENT_MODEL,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }]
      })

      const content = response.content[0]
      if (content.type !== "text") continue

      const cleanedText = content.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      const partial = JSON.parse(cleanedText)
      Object.assign(results, partial)
    }

    // Decrement only after all calls succeed
    const newRemaining = remaining - 1
    await supabase
      .from("concepts")
      .update({ refinements_available: newRemaining })
      .eq("id", conceptId)

    return NextResponse.json({ ...results, refinementsRemaining: newRemaining })

  } catch (error) {
    console.error("Refinement error:", error)
    return NextResponse.json(
      { error: "Failed to generate refinements" },
      { status: 500 }
    )
  }
}
