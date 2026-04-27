import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 120

const client = new Anthropic()
const NAMES_MODEL = "claude-opus-4-7"

const NAMING_RULES = `
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
1. Generate 9 candidate names that follow all rules
2. Critically evaluate each against:
   - Real-world believability
   - Distinctiveness
   - Fit to this specific territory
3. Select ONLY the 3 strongest names
4. Discard the rest completely

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
generations and must never be used: Solen, Solana, Lumis,
Lumen, Aura, Crest, Apex, Stratum, Fascia, Contour, Facet,
Datum, Nook, Hush, Laurel, Allotment, Gather, Reach, Brine,
Covert, Brim, Fold.
Add any name that feels like it belongs on this list —
if it feels like something you've seen before on a
development, it probably has been.

PATTERN-MATCH WARNING:
Names derived from the most obvious single feature of the brief
are not acceptable. The connection must be oblique and layered —
not the first word that comes to mind when reading a brief feature.

If the brief mentions sun, light, or brightness — do NOT use
sol, solar, soleil, solen, sola, lumen, lumis, luma, aura, or
any sun- or light-derived word as the primary name.

If the brief mentions water, a river, or coastal proximity —
do NOT use aqua, mare, stream, tide, wave, bay, or any
water-derived word as the primary name.

If the brief mentions elevation or views — do NOT use
peak, crest, rise, ridge, heights, summit, or any
elevation-derived word as the primary name.

Ask yourself: is this the most obvious word that connects
to this brief feature? If yes — go deeper.

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

TWO-WORD NAME QUALITY TEST:
Both words in a two-word name must carry equal creative weight.
A strong anchor word paired with a weak descriptor suffix is
not acceptable — the second word must add genuine meaning,
not just qualify the first.

These suffixes are banned as the second word:
House, Rows, Lane, Mark, Six, Place, Way, End, Point, Side,
View, Rise, Park, Close, Court, Mews, Gate, Yard, Works.

If the name is two words, ask: does the second word add
something the first word cannot do alone? If the answer is no —
use the first word only or find a genuinely different second word.

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
`

const TERRITORY_A_PROMPT = `
You are a senior brand strategist generating name options
for a residential property development.

Your assigned creative territory is: REFINED & CONSIDERED

This territory is defined by:
- Quiet confidence and understatement
- Names that feel discovered not invented
- Heritage-aware without being old-fashioned
- Rewards buyer curiosity — there is a story behind the name
- Appeals to buyers who value considered, specific choices over obvious ones

PRIMARY CREATIVE SOURCE FOR THIS TERRITORY:
You must approach naming from emotional or experiential truth.
The name should capture how the buyer feels, what the place
means to them, or what the act of owning this home represents.
Geographic landmarks, suburb names, and physical site features
are NOT the primary creative source for this territory.
Ask: what does living here mean? What does this address say
about who the buyer is? Start there — not from the map.

Your job is to generate exactly 3 name options for this
specific project brief that belong to this territory.

${NAMING_RULES}

Return ONLY this JSON:
{
  "territory": "refined",
  "names": [
    { "name": "Name1", "rationale": "One specific sentence explaining why this name belongs to this project." },
    { "name": "Name2", "rationale": "One specific sentence explaining why this name belongs to this project." },
    { "name": "Name3", "rationale": "One specific sentence explaining why this name belongs to this project." }
  ]
}
`

const TERRITORY_B_PROMPT = `
You are a senior brand strategist generating name options
for a residential property development.

Your assigned creative territory is: BOLD & DISTINCTIVE

This territory is defined by:
- Confident, graphic, makes an immediate statement
- Short and completely ownable — one word that owns its space
- High contrast visual world — the name suggests bold typography
- Appeals to buyers who want an address that stands out
- The name is unexpected but feels inevitable once explained

PRIMARY CREATIVE SOURCE FOR THIS TERRITORY:
You must approach naming from invented, unexpected, or
linguistically creative territory. Think: invented words,
unexpected word combinations, or words from other languages
that carry precise relevant meaning when understood.
Place names, geographic landmarks, suburb names, and physical
site features are NOT acceptable for this territory.
The name must feel like it was created, not found on a map.
Ask: what word could only exist for this project?

Invented words must be rooted in something physically, culturally, or emotionally true about this specific site and brief. The rationale for an invented name must reference the project — not the typography or letterforms of the word itself.
This passes: an invented word whose sound, rhythm, or root connects to a physical truth of the site (a geological material, a topographic quality, a cultural reference specific to this location).
This fails: an invented word chosen because its letterforms look good typographically, with no connection to the brief.
Typography is a design decision made later. The name must earn its place through meaning and connection to the project — not through how it looks on a page. If you cannot complete the sentence '[Name] connects to this project because [specific brief reference]' — the name is not good enough. Find a different invention.

Your job is to generate exactly 3 name options for this
specific project brief that belong to this territory.

${NAMING_RULES}

Return ONLY this JSON:
{
  "territory": "bold",
  "names": [
    { "name": "Name1", "rationale": "One specific sentence explaining why this name belongs to this project." },
    { "name": "Name2", "rationale": "One specific sentence explaining why this name belongs to this project." },
    { "name": "Name3", "rationale": "One specific sentence explaining why this name belongs to this project." }
  ]
}
`

const TERRITORY_C_PROMPT = `
You are a senior brand strategist generating name options
for a residential property development.

Your assigned creative territory is: WARM & SPECIFIC

This territory is defined by:
- Rooted in place, community, and physical truth
- The name connects to something genuinely true about
  this specific site — not generic warmth
- Appeals to buyers seeking belonging and authenticity
- Feels human and approachable without being generic
- The name could only belong to this specific project
  in this specific location

PRIMARY CREATIVE SOURCE FOR THIS TERRITORY:
You may use place-based naming — but only when the connection
is genuinely specific and ownable. A local landmark, a cultural
reference, a word that belongs specifically to this site and
location. The place-based element must be particular, not generic.
Generic suburb names appended as suffixes do not qualify.
A street name that could belong to any development does not qualify.
Ask: would someone who knows this area immediately understand
why this name belongs here specifically? If not — go deeper.

The place reference must be strong enough to stand completely alone as the full brand name — no suffix, no qualifier, no descriptor needed. If the place reference requires a second word to feel complete, it is not the right reference. Find a place name, local word, or cultural reference that is powerful enough to stand alone. A weak place reference bolstered by a generic suffix (Buckler Residences, Tobin House, Miners Ridge) is always worse than a strong place reference used alone (Buckler, Tobin, Miners). When in doubt, use one word.

Your job is to generate exactly 3 name options for this
specific project brief that belong to this territory.

${NAMING_RULES}

Return ONLY this JSON:
{
  "territory": "warm",
  "names": [
    { "name": "Name1", "rationale": "One specific sentence explaining why this name belongs to this project." },
    { "name": "Name2", "rationale": "One specific sentence explaining why this name belongs to this project." },
    { "name": "Name3", "rationale": "One specific sentence explaining why this name belongs to this project." }
  ]
}
`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const projectId = formData.get("projectId") as string
    const projectOverview = JSON.parse(formData.get("projectOverview") as string)
    const siteCharacter = JSON.parse(formData.get("siteCharacter") as string)
    const brandAmbition = JSON.parse(formData.get("brandAmbition") as string)

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
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

    const briefMessage = `Here is the project brief:\n\n${userBrief}\n\nGenerate 3 names for your assigned territory. Return only valid JSON, no markdown, no explanation.`

    const [responseA, responseB, responseC] = await Promise.all([
      client.messages.create({
        model: NAMES_MODEL,
        max_tokens: 1000,
        system: TERRITORY_A_PROMPT,
        messages: [{ role: "user", content: briefMessage }]
      }),
      client.messages.create({
        model: NAMES_MODEL,
        max_tokens: 1000,
        system: TERRITORY_B_PROMPT,
        messages: [{ role: "user", content: briefMessage }]
      }),
      client.messages.create({
        model: NAMES_MODEL,
        max_tokens: 1000,
        system: TERRITORY_C_PROMPT,
        messages: [{ role: "user", content: briefMessage }]
      }),
    ])

    const parseNames = (response: Anthropic.Message, label: string) => {
      const block = response.content[0]
      if (block.type !== "text") throw new Error(`Unexpected response for ${label}`)
      const raw = block.text
      const start = raw.indexOf("{")
      const end = raw.lastIndexOf("}")
      if (start === -1 || end === -1) throw new Error(`No JSON found for ${label}`)
      const parsed = JSON.parse(raw.slice(start, end + 1)) as {
        territory: string
        names: Array<{ name: string; rationale: string }>
      }
      return parsed.names.map(n => ({
        name: n.name,
        rationale: n.rationale,
        territory: parsed.territory,
      }))
    }

    const rawNames = [
      ...parseNames(responseA, "refined"),
      ...parseNames(responseB, "bold"),
      ...parseNames(responseC, "warm"),
    ]

    const seen = new Set<string>()
    const deduped = rawNames.filter(n => {
      const key = n.name.toLowerCase().trim()
      if (seen.has(key)) {
        console.warn(`[generate-names] Duplicate removed: "${n.name}" (territory: ${n.territory})`)
        return false
      }
      seen.add(key)
      return true
    })

    const BANNED_ENDINGS = [
      "residences", "residence", "house", "ridge", "lane", "place", "rise",
      "park", "close", "court", "mews", "gate", "works", "view", "row",
      "rows", "mark", "lodge", "retreat", "haven", "manor", "estate",
      "gardens", "quarter",
    ]

    const names = deduped.filter(n => {
      const words = n.name.trim().toLowerCase().split(/\s+/)
      const lastWord = words[words.length - 1]
      if (BANNED_ENDINGS.includes(lastWord)) {
        console.warn(`[generate-names] Suffix filter removed: "${n.name}" — ends with banned word "${lastWord}"`)
        return false
      }
      return true
    })

    return NextResponse.json({ names })

  } catch (error) {
    console.error("Name generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate name options" },
      { status: 500 }
    )
  }
}
