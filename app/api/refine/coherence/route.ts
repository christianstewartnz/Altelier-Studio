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
    const { concept, trigger } = await request.json()

    if (trigger !== "name" && trigger !== "tagline") {
      return NextResponse.json({ error: "Invalid trigger" }, { status: 400 })
    }

    const systemPrompt = trigger === "name" ? NAME_COHERENCE_SYSTEM : TAGLINE_COHERENCE_SYSTEM

    const userMessage = `
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

    const result = JSON.parse(content.text)
    return NextResponse.json(result)

  } catch (error) {
    console.error("Coherence rewrite error:", error)
    return NextResponse.json({ error: "Failed to rewrite concept" }, { status: 500 })
  }
}
