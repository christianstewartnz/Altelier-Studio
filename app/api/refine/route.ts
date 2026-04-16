import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
// // import { refineRatelimit } from "@/lib/ratelimit"
import { createClient } from "@/lib/supabase/server"

const client = new Anthropic()

const REFINE_PROMPT = `
You are a senior brand strategist refining an existing 
brand concept. The concept direction is already decided 
— your job is to generate alternative options for 
specific elements the user wants to explore.

CRITICAL: The brand territory, rationale, and overall 
direction must remain consistent across all alternatives. 
You are refining within the concept, not replacing it.

For each requested element generate exactly 3 alternatives.

NAME ALTERNATIVES:
- Must fit the same brand territory and rationale
- Specific, ownable, evocative — same quality bar as original
- Different from each other and from the current name
- 1-2 words maximum
- Never use generic property words

TAGLINE ALTERNATIVES:
- Must fit the same brand voice and territory
- Similar energy to the original
- 3 distinct angles on the same concept

COLOUR PALETTE ALTERNATIVES:
- Must feel consistent with the brand territory
- Each palette has exactly 5 hex colours
- Must include a wordmarkColor that reads well on colors[0]
- 3 genuinely different palettes that still serve the concept
- Each must have a dark anchor and light colour

FONT PAIRING ALTERNATIVES:
- Must suit the brand territory
- Each has a heading and body font from Google Fonts
- 3 distinct pairings with different typographic personalities
- Do not repeat the current fonts

LOGO COMPOSITION ALTERNATIVES:
- Must suit the brand name structure
- Choose from: inline-clean, inline-ruled, stacked-ruled,
  stacked-punctuation, stacked-weighted, offset-subtitle,
  weight-contrast, scale-contrast, ultrawide, 
  oversized-crop, mixed-weight-inline, left-editorial
- 3 different composition styles
- Include full logoComposition object for each with:
  style, lines, punctuation, punctuationPosition,
  weight, tracking, case

Return a JSON object with only the keys for elements 
that were requested:

{
  "names": ["Name1", "Name2", "Name3"],
  "taglines": ["Tagline 1", "Tagline 2", "Tagline 3"],
  "colorPalettes": [
    { 
      "colors": ["#hex1","#hex2","#hex3","#hex4","#hex5"],
      "wordmarkColor": "#hex"
    }
  ],
  "fontPairings": [
    { "heading": "Font Name", "body": "Font Name" }
  ],
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

Only include keys for elements that were requested.
CRITICAL: Return only raw JSON. No markdown. 
No explanation. No preamble.
`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorised" },
      { status: 401 }
    )
  }

  // const { success, limit, reset, remaining } =
  //   await refineRatelimit.limit(user.id)

  // if (!success) {
  //   return NextResponse.json(
  //     {
  //       error: "Daily refinement limit reached. You can refine again tomorrow.",
  //       limit,
  //       reset,
  //       remaining
  //     },
  //     { status: 429 }
  //   )
  // }

  try {
    const { concept, selectedItems, contextInputs } =
      await request.json()

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: REFINE_PROMPT,
      messages: [
        {
          role: "user",
          content: `
Here is the current brand concept:

BRAND NAME: ${concept.brandName}
TAGLINE: ${concept.tagline}
RATIONALE: ${concept.rationale}
COLOURS: ${concept.colors.join(", ")}
WORDMARK COLOUR: ${concept.wordmarkColor}
FONTS: ${concept.fonts.heading} / ${concept.fonts.body}
ATTRIBUTES: ${concept.attributes.join(", ")}
VOICE SAMPLE: ${concept.voiceSample}
LOGO STYLE: ${concept.logoComposition.style}

The user wants to refine these elements:
${selectedItems.map((item: string) => `
- ${item.toUpperCase()}
  User feedback: ${contextInputs[item] || "No specific feedback provided"}
`).join("")}

Generate exactly 3 alternatives for each requested 
element. Return only valid JSON, no markdown, 
no explanation.
          `
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    const results = JSON.parse(content.text)
    return NextResponse.json(results)

  } catch (error) {
    console.error("Refinement error:", error)
    return NextResponse.json(
      { error: "Failed to generate refinements" },
      { status: 500 }
    )
  }
}
