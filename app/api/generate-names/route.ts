import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export const maxDuration = 120

const client = new Anthropic()

type GeneratedNameEntry = {
  name: string
  rationale: string
  territory: string
}

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function normLoc(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase()
}

/** First integer in scale text, e.g. "9 townhouses" → "9". */
function extractUnitCountFromBrief(scaleText: string | null | undefined): string {
  const t = (scaleText ?? "").trim()
  if (!t) return "Not specified"
  const m = t.match(/\d+/)
  return m ? m[0] : "Not specified"
}

const STREET_TYPE_SUFFIX =
  /\s+(Street|St\.?|Road|Rd\.?|Lane|Avenue|Ave\.?|Terrace|Tce\.?|Crescent|Cres\.?|Drive|Dr\.?|Place|Parade|Boulevard|Blvd\.?|Way|Court|Ct\.?|Close|Grove|Circuit|Cct\.?)\.?$/i

/**
 * From the brief location line, derive optional street number and a short street name
 * (e.g. "147 Manuka Street, Miramar" → "147", "Manuka"). If the first segment looks
 * like suburb-only, street fields are not inferred.
 */
function parseStreetFromLocation(location: string | null | undefined): {
  addressNumber: string
  streetName: string
} {
  const raw = (location ?? "").trim()
  if (!raw) {
    return { addressNumber: "Not specified", streetName: "Not specified" }
  }
  const firstSegment = raw.split(",").map(s => s.trim())[0] ?? ""
  const withLeadingNumber = firstSegment.match(/^(\d+)\s+(.+)$/)
  const remainder = withLeadingNumber ? withLeadingNumber[2].trim() : firstSegment
  const addressNumber = withLeadingNumber ? withLeadingNumber[1] : "Not specified"

  const hadStreetType = STREET_TYPE_SUFFIX.test(remainder)
  const streetStem = remainder.replace(STREET_TYPE_SUFFIX, "").trim()

  if (!hadStreetType && !withLeadingNumber) {
    return { addressNumber: "Not specified", streetName: "Not specified" }
  }

  const streetName =
    streetStem.length > 0 ? streetStem : "Not specified"

  return {
    addressNumber,
    streetName,
  }
}

function buildTerritoryCPrompt(params: {
  streetName: string
  addressNumber: string
  unitCount: string
}): string {
  const { streetName, addressNumber, unitCount } = params
  return `
You are a senior brand strategist generating name options
for a residential property development.

Your assigned creative territory is: WARM & SPECIFIC

TERRITORY C CREATIVE SOURCE — CONVENTIONAL PLACE-BASED NAMING:

This territory produces clear, conventional names that
buyers immediately understand. You are generating 3
place-based names using the project's actual street,
suburb, or directly adjacent physical features.

This is the only territory that uses geographic references.
Territories A and B never use place names — that is
your exclusive creative domain here.

WHAT TO USE:
- The project's actual street name
- The project's suburb name
- A physical feature directly on or immediately
  adjacent to the actual project site — only if
  it can be directly experienced from the site itself

WHAT NEVER TO USE:
- Street names in the same suburb that are not
  the project's own street
- Neighbouring or adjacent suburbs
- Nearby waterways, reserves, or landmarks not
  directly connected to the project site
- Any geographic reference requiring leaving the
  site to encounter

ADDITIONAL CREATIVE TOOLS — STREET AND NUMBER:

You have access to three additional naming elements 
beyond the suburb name:

1. PROJECT STREET NAME: ${streetName}
   The actual street this development sits on.
   This is often more specific and ownable than 
   the suburb name and should be considered first.

2. PROJECT ADDRESS NUMBER: ${addressNumber}
   The street number of the development.
   Can be used creatively when the number itself 
   feels considered — not every number works.

3. PROJECT UNIT COUNT: ${unitCount}
   The number of homes in this development.
   Can be used creatively when the count adds 
   meaning — "Nine" feels considered for 9 homes,
   less so for 47 homes.

HOW TO USE THESE CREATIVELY:
These are tools not formulas. Use them when they 
produce something genuinely considered — not as 
a default pattern.

Examples of considered use:
- Street name alone: "Manuka" if the street name 
  is distinctive enough to stand alone
- Street name + number: "9 Manuka" or "Manuka Nine" 
  if both elements add meaning
- Address number + meaningful word: "43 Common" 
  if the combination feels like a real address
- Street name + light suffix: "Manuka Common", 
  "Manuka Terrace" following the scale rules
- Suburb + street element: "Miramar at Manuka" 
  if the suburb needs the street to be specific

Examples of uncreative use to avoid:
- Suburb + unit count: "Miramar Nine" — lazy formula,
  the suburb and the number have no creative relationship
- Street + generic suffix: "Manuka Residences" — banned suffix
- Address number alone: "147" — too abstract without context

CREATIVITY TEST:
Before using any number or street name, ask: 
does this combination feel discovered or assembled? 
A considered address name feels inevitable — 
"9 Manuka" feels like it was always going to be 
called that. "Miramar Nine" feels like someone 
filled in a template.

SCALE RULES STILL APPLY:
Apply the existing scale-appropriate suffix rules 
to any street name combinations — the same way 
you would with suburb names.

Generate 3 conventional names using any combination 
of suburb, street name, address number, and unit 
count — but only when the combination feels 
genuinely considered. If the street name is more 
distinctive than the suburb, lead with the street. 
If the address number adds creative meaning, use it. 
If neither adds anything — use the suburb name alone 
with a considered suffix.

SCALE-APPROPRIATE SUFFIX RULES:
The suffix must be proportionate to the project scale.
Read the brief carefully for unit count or scale description.

1-4 homes: No suffix. The place name stands alone.
  Good: "Madras" — Bad: "Madras Terrace"

5-15 homes: Light suffix only.
  Acceptable: Terrace, Row, Nine (if unit count),
  Common, Close
  Good: "Madras Terrace", "Vesper Nine"
  Bad: "Madras Village", "Madras Estate"

16-40 homes: Mid-weight suffix acceptable.
  Acceptable: Quarter, Gardens, Common, Place
  Good: "Madras Quarter", "Khandallah Gardens"
  Bad: "Madras Village", "Madras Estate"

40+ homes: Larger suffix acceptable.
  Acceptable: Village, Park, Estate, Gardens
  Good: "Madras Village", "Khandallah Park"

QUALITY STANDARDS:
Even conventional names must meet these standards:
- The combination must sound like a real considered
  address — not a placeholder or template
- The suffix must genuinely fit the project type
  and scale — never inflate a small project
- "Madras Terrace" sounds considered
- "Madras Residences" sounds like a placeholder — banned
- "Madras Houses" sounds like a description — banned
- The place reference must be the project's own
  geography — not borrowed from nearby streets

STILL BANNED even in conventional naming:
- Residences, Houses, Homes, Properties, Living,
  Development, Complex, Units, Apartments, Townhomes,
  Townhouses (as suffix)

Generate exactly 3 conventional place-based names
following these rules. Each must feel like a real,
considered address that a developer would be proud
to put on a hoarding.

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
}

type ConflictProject = {
  id: string
  suburb: string | null
  city: string | null
  country: string | null
}

type ConflictRow = {
  brand_name: string
  project_id: string
  projects: ConflictProject
}

function blockDecision(
  territory: string,
  brandName: string,
  conflicts: ConflictRow[],
  currentCityNorm: string,
  currentCountryNorm: string,
): { blocked: false } | { blocked: true; conflict: ConflictRow } {
  const nBrand = normLoc(brandName)
  const matches = conflicts.filter(c => normLoc(c.brand_name) === nBrand)
  if (matches.length === 0) return { blocked: false }

  if (territory === "refined" || territory === "bold") {
    if (!currentCountryNorm) return { blocked: false }
    const fatal = matches.find(m => normLoc(m.projects.country) === currentCountryNorm)
    if (fatal) return { blocked: true, conflict: fatal }
    return { blocked: false }
  }

  if (territory === "warm") {
    if (!currentCityNorm) return { blocked: false }
    const fatal = matches.find(m => normLoc(m.projects.city) === currentCityNorm)
    if (fatal) return { blocked: true, conflict: fatal }
    return { blocked: false }
  }

  return { blocked: false }
}

async function fetchSelectedConceptConflicts(
  service: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  projectId: string,
  generatedNames: string[],
): Promise<ConflictRow[]> {
  const normSet = new Set(generatedNames.map(n => normLoc(n)))
  const { data, error } = await service
    .from("concepts")
    .select(`
      brand_name,
      project_id,
      projects!inner (
        id,
        suburb,
        city,
        country
      )
    `)
    .eq("is_selected", true)
    .neq("project_id", projectId)

  if (error) {
    console.error("[generate-names] Conflict query failed:", error)
    return []
  }

  return (data ?? [])
    .filter((row: { brand_name: string }) => normSet.has(normLoc(row.brand_name)))
    .map((row: {
      brand_name: string
      project_id: string
      projects: ConflictProject | ConflictProject[]
    }) => ({
      brand_name: row.brand_name,
      project_id: row.project_id,
      projects: Array.isArray(row.projects) ? row.projects[0] : row.projects,
    }))
}
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
  Heights, Point, Road, Street, Valley, Hill, View, Beach, Collective,
  Society, Community, Co, Cooperative, Commune, Club, Crew, Guild, Tribe

Banned as standalone names or suffixes: Collective, Society, Community, Co,
Cooperative, Commune, Club, Crew, Guild, Tribe.

These words belong to lifestyle brands, food cooperatives, and co-working
spaces — never to residential property developments. A buyer would never
proudly say these at a dinner party.

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
Covert, Brim, Fold, Arden.
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
View, Rise, Park, Close, Court, Mews, Gate, Yard, Works,
Collective, Society, Community, Co, Cooperative, Commune, Club, Crew,
Guild, Tribe.

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

TERRITORY SEPARATION — MANDATORY:
Each territory has an exclusive creative source.
Geographic and place-based naming belongs only to
Territory C. Territories A and B must never use
place names, street names, suburb names, or any
geographic reference. This separation ensures the
9 names cover genuinely different creative ground
rather than converging on the same approach.
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

TERRITORY A CREATIVE SOURCE — EMOTIONAL & EXPERIENTIAL ONLY:

This territory explores naming from emotional truth,
experiential resonance, and what the act of owning
this home means to the buyer.

NEVER use in this territory:
- Place names, suburb names, street names
- Geographic features: streams, hills, reserves, landmarks
- Local references of any kind
- The project address or surrounding area

Names in this territory should feel like they could
belong to this project anywhere — their power comes
from emotional precision, not geographic anchoring.
That job belongs exclusively to Territory C.

Ask: what does it feel like to own this home?
What is the buyer arriving at? What are they
leaving behind? What does this address mean
to them at a dinner party?

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

TERRITORY B CREATIVE SOURCE — INVENTED & LINGUISTIC ONLY:

This territory explores naming through invention,
linguistic creativity, and unexpected word construction.
Names must be rooted in something true about the site
but expressed through invention not geography.

NEVER use in this territory:
- Place names, suburb names, street names
- Geographic features of any kind
- Local landmarks or cultural references tied to location
- The project address or surrounding area

Names in this territory should feel invented and ownable —
words that didn't exist before this project needed them.
Geographic naming belongs exclusively to Territory C.

Ask: what invented word captures the physical or
emotional character of this site without naming it?
What sound, rhythm, or linguistic root connects
to something true about this project?

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

    const { streetName, addressNumber } = parseStreetFromLocation(projectOverview.location)
    const unitCount = extractUnitCountFromBrief(projectOverview.numberOfHomes)
    const territoryCPrompt = buildTerritoryCPrompt({
      streetName,
      addressNumber,
      unitCount,
    })

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
        system: territoryCPrompt,
        messages: [{ role: "user", content: briefMessage }]
      }),
    ])

    const parseNames = (
      response: Anthropic.Message,
      label: string,
      opts?: { forceTerritory?: string },
    ) => {
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
      const territory = opts?.forceTerritory ?? parsed.territory
      return parsed.names.map(n => ({
        name: n.name,
        rationale: n.rationale,
        territory,
      }))
    }

    const rawNames: GeneratedNameEntry[] = [
      ...parseNames(responseA, "refined"),
      ...parseNames(responseB, "bold"),
      ...parseNames(responseC, "warm"),
    ]

    let namesPostDuplicate: GeneratedNameEntry[] = rawNames

    const service = createSupabaseServiceClient()
    if (!service) {
      console.warn("[generate-names] SUPABASE_SERVICE_ROLE_KEY missing — skipping duplicate check")
    } else {
      const initialStrings = rawNames.map(n => n.name)
      const conflicts = await fetchSelectedConceptConflicts(service, projectId, initialStrings)

      if (conflicts.length > 0) {
        const { data: locRow, error: locErr } = await supabase
          .from("projects")
          .select("city, country")
          .eq("id", projectId)
          .single()

        if (locErr) {
          console.warn("[generate-names] Project fetch for duplicate check:", locErr)
        }

        const currentCityNorm = normLoc(locRow?.city)
        const currentCountryNorm = normLoc(locRow?.country)

        const TERRITORY_ORDER = ["refined", "bold", "warm"] as const
        const TERRITORY_PROMPTS_DUP: Record<string, string> = {
          refined: TERRITORY_A_PROMPT,
          bold: TERRITORY_B_PROMPT,
          warm: territoryCPrompt,
        }

        const nextList: GeneratedNameEntry[] = []
        let blockedCount = 0

        for (const territory of TERRITORY_ORDER) {
          const territoryItems = rawNames.filter(n => n.territory === territory)
          const kept: GeneratedNameEntry[] = []
          const blockedItems: GeneratedNameEntry[] = []

          for (const item of territoryItems) {
            const dec = blockDecision(
              territory,
              item.name,
              conflicts,
              currentCityNorm,
              currentCountryNorm,
            )
            if (dec.blocked) {
              blockedCount++
              blockedItems.push(item)
              const p = dec.conflict.projects
              const where = [p.suburb, p.city, p.country].filter(Boolean).join(", ") || "location unknown"
              console.log(
                `[generate-names] Duplicate blocked: "${item.name}" (territory: ${territory}) conflicts with project ${p.id} (${where})`,
              )
            } else {
              kept.push(item)
            }
          }

          if (blockedItems.length === 0) {
            nextList.push(...kept)
            continue
          }

          const avoidNames = [...new Set([...initialStrings, ...blockedItems.map(b => b.name)])]
          const exclusionList = avoidNames.join(", ")
          const needed = blockedItems.length
          const replacementMessage = `Here is the project brief:\n\n${userBrief}\n\nGenerate ${needed} additional names. Do not use any of these names that have already been generated: ${exclusionList}. Apply all the same quality rules. Return only valid JSON, no markdown, no explanation.`

          try {
            const resp = await client.messages.create({
              model: NAMES_MODEL,
              max_tokens: 1000,
              system: TERRITORY_PROMPTS_DUP[territory],
              messages: [{ role: "user", content: replacementMessage }],
            })
            const parsed = parseNames(resp, `duplicate-replacement-${territory}`, {
              forceTerritory: territory,
            })
            const sliced = parsed.slice(0, needed)
            nextList.push(...kept, ...sliced)
          } catch (err) {
            console.warn(`[generate-names] Duplicate replacement failed for "${territory}":`, err)
            nextList.push(...kept)
          }
        }

        namesPostDuplicate = nextList
        console.log(
          `[generate-names] Duplicate check summary: ${blockedCount} name(s) blocked by duplicate rules`,
        )
      }
    }

    const BANNED_ENDINGS = [
      "residences", "residence", "house", "houses", "ridge", "lane", "place", "rise",
      "park", "close", "court", "mews", "gate", "works", "view", "row",
      "rows", "mark", "lodge", "retreat", "haven", "manor", "estate",
      "gardens", "quarter", "townhomes", "townhouses",
    ]

    const seen = new Set<string>()
    const applyFilters = (
      candidates: typeof rawNames,
      seenSet: Set<string>,
    ) => candidates.filter(n => {
      const key = n.name.toLowerCase().trim()
      if (seenSet.has(key)) {
        console.warn(`[generate-names] Duplicate removed: "${n.name}" (territory: ${n.territory})`)
        return false
      }
      const words = key.split(/\s+/)
      const lastWord = words[words.length - 1]
      if (BANNED_ENDINGS.includes(lastWord)) {
        console.warn(`[generate-names] Suffix filter removed: "${n.name}" — ends with banned word "${lastWord}"`)
        return false
      }
      seenSet.add(key)
      return true
    })

    const names = applyFilters(namesPostDuplicate, seen)

    const filteredCount = namesPostDuplicate.length - names.length
    console.log(`[generate-names] Initial: ${namesPostDuplicate.length} after duplicate pass, ${filteredCount} filtered, ${names.length} remaining`)

    const TARGET_PER_TERRITORY = 3
    const TERRITORY_PROMPTS: Record<string, string> = {
      refined: TERRITORY_A_PROMPT,
      bold: TERRITORY_B_PROMPT,
      warm: territoryCPrompt,
    }

    const countByTerritory = (list: typeof names) =>
      list.reduce<Record<string, number>>((acc, n) => {
        acc[n.territory] = (acc[n.territory] ?? 0) + 1
        return acc
      }, {})

    if (names.length < 9) {
      const territoryCounts = countByTerritory(names)
      const allGeneratedNames = namesPostDuplicate.map(n => n.name)

      const replacementPromises = Object.entries(TERRITORY_PROMPTS)
        .filter(([territory]) => (territoryCounts[territory] ?? 0) < TARGET_PER_TERRITORY)
        .map(([territory, systemPrompt]) => {
          const needed = TARGET_PER_TERRITORY - (territoryCounts[territory] ?? 0)
          const exclusionList = allGeneratedNames.join(", ")
          const replacementMessage = `Here is the project brief:\n\n${userBrief}\n\nGenerate ${needed} additional names. Do not use any of these names that have already been generated: ${exclusionList}. Apply all the same quality rules. Return only valid JSON, no markdown, no explanation.`
          console.log(`[generate-names] Requesting ${needed} replacement(s) for territory "${territory}"`)
          return client.messages.create({
            model: NAMES_MODEL,
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: replacementMessage }]
          }).then(resp => ({ resp, territory, needed }))
        })

      const replacementResults = await Promise.all(replacementPromises)

      let replacementCount = 0
      for (const { resp, territory, needed } of replacementResults) {
        try {
          const replacements = parseNames(resp, `replacement-${territory}`, {
            forceTerritory: territory,
          })
          const filtered = applyFilters(replacements, seen)
          const toAdd = filtered.slice(0, needed)
          if (toAdd.length < needed) {
            console.warn(
              `[generate-names] Territory "${territory}": only ${toAdd.length} replacement name(s) available after filters (needed ${needed}).`,
            )
          }
          names.push(...toAdd)
          replacementCount += toAdd.length
        } catch (err) {
          console.warn(`[generate-names] Failed to parse replacement for "${territory}":`, err)
        }
      }

      console.log(`[generate-names] Replacements added: ${replacementCount}, final count: ${names.length}`)
    }

    const TERRITORY_OUTPUT_ORDER = ["refined", "bold", "warm"] as const
    const finalNames: GeneratedNameEntry[] = []
    for (const t of TERRITORY_OUTPUT_ORDER) {
      const list = names.filter(n => n.territory === t)
      if (list.length < TARGET_PER_TERRITORY) {
        console.warn(
          `[generate-names] Territory "${t}": only ${list.length} name(s); target is ${TARGET_PER_TERRITORY} (same-territory only).`,
        )
      }
      finalNames.push(...list.slice(0, TARGET_PER_TERRITORY))
    }

    return NextResponse.json({ names: finalNames })

  } catch (error) {
    console.error("Name generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate name options" },
      { status: 500 }
    )
  }
}
