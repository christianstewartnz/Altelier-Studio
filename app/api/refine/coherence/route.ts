import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

const client = new Anthropic()

const NAME_COHERENCE_SYSTEM = `
You are a senior brand strategist. A residential property development brand has just been given a new name.
Your job is to rewrite three elements so they feel like they were always written for this new name:
rationale, tagline, and voiceSample.

RATIONALE:
- Same length and structure as the original — typically 2–4 sentences
- Explain WHY this specific name is strategically right for this concept and site
- Same analytical depth and tone as the original — not generic, not effusive
- Ground the name in something real: the site, the market, the feeling being sold

RATIONALE QUALITY CHECK:
The rewritten rationale must explain why THIS specific name
is strategically right for THIS specific site and concept.
Forbidden phrases: "stands the test of time", "understated
luxury", "design forward", "connects residents",
"modern living", "carefully considered", "timeless elegance",
"draws inspiration from".
The rationale should read like it was written by a senior
brand strategist who knows this site — not generated copy.

TAGLINE:
- Max 8 words
- Must feel native to the new name — same brand voice and emotional territory
- A genuinely different line, not a light edit of the original

VOICE SAMPLE:
- Rewrite the existing voice sample using the new name naturally throughout
- Preserve the same length, rhythm, and emotional register
- Do not change the brand voice or tone — only update references to the name

CRITICAL: Return only raw JSON. No markdown. No explanation.
{ "rationale": "...", "tagline": "...", "voiceSample": "..." }
`.trim()

const LOCATION_COMPOSITION_PROMPT = `
You are a senior brand designer adapting a logo composition
to accommodate a two-part brand name.

The brand name has been updated to include a location suffix.
Your job is to adapt the existing logo composition to handle
the new two-part name as elegantly as possible — staying as
close to the original creative intent as possible.

RULES:
- Preserve the original style's personality and feeling
- If the original style naturally handles two words
  (stacked-weighted, stacked-ruled, offset-subtitle,
  left-editorial, stacked-punctuation, weight-contrast,
  mixed-weight-inline) — keep the same style, just update
  the lines array to split name on lines[0] and location
  on lines[1]
- If the original style does not handle two words well
  (ultrawide, oversized-crop, inline-clean, inline-ruled) —
  find the closest equivalent style that does:
  * ultrawide → stacked-ruled (same architectural feeling,
    two lines)
  * oversized-crop → stacked-weighted (same bold graphic
    feeling, two lines)
  * inline-clean → offset-subtitle (same clean minimal
    feeling, location as subtitle)
  * inline-ruled → stacked-ruled (same ruled treatment,
    two lines)
- Always split with brand name on lines[0] and location
  on lines[1]
- Preserve the original weight, tracking, and case where
  possible — only change what is necessary to accommodate
  the two-part name
- The location on lines[1] should feel subordinate to the
  brand name — consider lighter weight or smaller tracking
  for lines[1] if the style supports it

Return ONLY this JSON:
{
  "logoComposition": {
    "style": "style-name",
    "lines": ["BrandName", "Location"],
    "punctuation": "original or updated",
    "punctuationPosition": "original or updated",
    "weight": "original or adapted",
    "tracking": "original or adapted",
    "case": "original or adapted"
  }
}
`.trim()

const TAGLINE_COHERENCE_SYSTEM = `
You are a senior brand copywriter. A residential property development brand has just adopted a new tagline.
Rewrite the voiceSample so it feels tonally consistent with the new tagline's direction and energy.

VOICE SAMPLE RULES:
- Preserve the same length and general structure
- Match the emotional register and rhythm of the new tagline
- Use the brand name naturally throughout — do not change the name
- Do not change the brand voice — only shift the tone to align with the new tagline

CRITICAL: Return only raw JSON. No markdown. No explanation.
{ "voiceSample": "..." }
`.trim()

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  try {
    const { concept, trigger, brandPart, locationPart } = await request.json()

    if (trigger !== "name" && trigger !== "tagline" && trigger !== "location") {
      return NextResponse.json({ error: "Invalid trigger" }, { status: 400 })
    }

    let systemPrompt: string
    let userMessage: string

    if (trigger === "location") {
      systemPrompt = LOCATION_COMPOSITION_PROMPT
      userMessage = `
ORIGINAL LOGO COMPOSITION:
${JSON.stringify(concept.logoComposition, null, 2)}

BRAND NAME (lines[0]): "${brandPart}"
LOCATION (lines[1]): "${locationPart}"
COMBINED NAME: "${concept.brandName}"

Adapt the logo composition to elegantly handle this two-part name.
      `.trim()
    } else {
      systemPrompt = trigger === "name" ? NAME_COHERENCE_SYSTEM : TAGLINE_COHERENCE_SYSTEM
      userMessage = `
BRAND NAME: ${concept.brandName}
TAGLINE: ${concept.tagline}
RATIONALE: ${concept.rationale}
ATTRIBUTES: ${concept.attributes.join(", ")}
VOICE SAMPLE: ${concept.voiceSample}
CREATIVE TERRITORY: ${concept.conceptTitle}

${trigger === "name"
  ? `The brand has just been renamed to "${concept.brandName}". Rewrite the rationale, tagline, and voiceSample so they belong to this name. Return JSON with keys: rationale, tagline, voiceSample.`
  : `The tagline has just been updated to "${concept.tagline}". Rewrite the voiceSample so its tone and rhythm align with this new tagline. Return JSON with key: voiceSample.`
}
      `.trim()
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response type" }, { status: 500 })
    }

    const cleanedText = content.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    const result = JSON.parse(cleanedText)
    return NextResponse.json(result)

  } catch (error) {
    console.error("Coherence rewrite error:", error)
    return NextResponse.json({ error: "Failed to rewrite concept" }, { status: 500 })
  }
}
