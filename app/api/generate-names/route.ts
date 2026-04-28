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

function extractUnitCountFromBrief(scaleText: string | null | undefined): string {
  const t = (scaleText ?? "").trim()
  if (!t) return "Not specified"
  const m = t.match(/\d+/)
  return m ? m[0] : "Not specified"
}

const STREET_TYPE_SUFFIX =
  /\s+(Street|St\.?|Road|Rd\.?|Lane|Avenue|Ave\.?|Terrace|Tce\.?|Crescent|Cres\.?|Drive|Dr\.?|Place|Parade|Boulevard|Blvd\.?|Way|Court|Ct\.?|Close|Grove|Circuit|Cct\.?)\.?$/i

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

  const streetName = streetStem.length > 0 ? streetStem : "Not specified"

  return { addressNumber, streetName }
}

function buildTerritoryCPrompt(params: {
  streetName: string
  addressNumber: string
  unitCount: string
}): string {
  const { streetName, addressNumber, unitCount } = params
  return `
You are a senior brand strategist at a top property branding agency.
Your job is to generate 3 conventional, place-based development names
for a residential project. These names must feel like real addresses —
the kind a developer would confidently put on a hoarding.

YOUR TERRITORY: CONVENTIONAL & PLACE-BASED

This territory produces clear, immediately understood names.
No invented words. No abstract concepts. No emotional language.
Just considered place-based names that buyers recognise as real addresses.

PROJECT GEOGRAPHY AVAILABLE TO YOU:
- Project street name: ${streetName}
- Project address number: ${addressNumber}  
- Project unit count: ${unitCount}
- Suburb and city: from the brief

WHAT YOU MUST USE:
Only the project's own street name, suburb name, or address number.
Never neighbouring streets. Never adjacent suburbs. Never nearby 
landmarks unless they are physically on or directly adjacent to 
the actual site.

HOW TO BUILD THE NAME:
Lead with whichever element is most distinctive — the street name 
is usually stronger than the suburb. Pair it with a suffix that 
fits the project scale exactly.

SCALE RULES — apply strictly:
1-4 homes: No suffix. Place name stands alone. "Manuka" not "Manuka Close"
5-15 homes: Light suffix only. Terrace, Row, Common, Nine (if unit count fits)
16-40 homes: Mid suffix. Quarter, Gardens, Common, Place
40+ homes: Larger suffix. Village, Park, Estate, Gardens

CREATIVE USE OF ADDRESS AND UNIT COUNT:
Use these as creative tools when the combination feels inevitable — 
not as a default formula.
- "9 Manuka" works if 9 is the unit count and Manuka is the street — 
  two real facts that combine into a considered address
- "Manuka Nine" — same principle, flows differently
- "43 Common" — works if 43 is the address number and Common fits scale
- Never combine suburb + unit count. "Khandallah Nine" is lazy —  
  the suburb and the number have no relationship.

QUALITY TEST FOR EVERY NAME:
Read it aloud as an address. Does it sound like somewhere real?
Would a developer sign off on this for a hoarding without hesitation?
If there is any doubt — it is not good enough.

STILL BANNED:
Residences, Houses, Homes, Properties, Living, Development, 
Complex, Units, Apartments, Townhomes, Townhouses, Collective,
Society, Community, Lodge, Retreat, Haven, Manor.

Return ONLY this JSON — no markdown, no explanation:
{
  "territory": "warm",
  "names": [
    { "name": "Name1", "rationale": "One sentence: what specific geographic element this uses and why it works for this project." },
    { "name": "Name2", "rationale": "One sentence: what specific geographic element this uses and why it works for this project." },
    { "name": "Name3", "rationale": "One sentence: what specific geographic element this uses and why it works for this project." }
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

// --------------------------------------------------------
// SHARED NAMING QUALITY RULES
// Applied to all three territories
// --------------------------------------------------------
const NAMING_RULES = `
CORE NAMING RULES:

LENGTH: 1-2 words maximum.

SPECIFICITY: The name must connect to something true and specific 
about this exact project. If the connection could apply to 100 other 
developments — reject it.

THE DINNER PARTY TEST: Would a proud homeowner say this address 
confidently at a dinner party, to their bank, and to their friends? 
Any hesitation means the name fails.

THE BILLBOARD TEST: Does this sound like a name that exists today 
on a real development hoarding in Auckland, Sydney, or Melbourne? 
Would a conservative but design-aware developer approve it without 
hesitation?

THE AGENCY TEST: Could this name belong to a creative agency, 
a café, a wellness brand, or a fashion label? If yes — reject it.
Property development names occupy a specific category. They must 
feel like addresses, not brand experiments.

SELF-EVALUATION PROCESS:
1. Generate 9 candidate names
2. Test each against all three tests above
3. Select the 3 strongest
4. For each finalist, complete: "[Name] is the right name for this 
   specific project because [specific reason tied to this brief]"
   The answer must be project-specific — not generic.
5. If you cannot complete that sentence specifically — reject the name

PHONETICS: Prefer names that flow naturally when spoken aloud.
Soft vowel sounds. 2-3 syllables. Avoid harsh industrial sounds.

NEVER USE THESE WORDS (banned completely):
Haven, Residence, Residences, Pinnacle, Park, Place, Living, One, 
The, Retreat, Sanctuary, Horizon, Vista, Aspect, Edge, Quarter, 
Gardens, Green, Rise, Ridge, Terrace, Lane, Grove, Manor, Estate, 
Collection, Heights, Point, Road, Street, Valley, Hill, View, Beach,
Collective, Society, Community, Co, Cooperative, Commune, Club, 
Crew, Guild, Tribe, House, Houses, Rows, Row, Mark, Way, End, 
Side, Close, Court, Mews, Gate, Yard, Works, Lodge, Complex,
Units, Apartments, Townhomes, Townhouses, Homes, Properties,
Development, Living

BANNED SUFFIX PATTERNS: -side, -scape, -haus, -co, -works, 
-yard, -field, -wood, -gate, -ton

BANNED NAMES (overused — never generate these):
Datum, Hush, Laurel, Allotment, Gather, Reach, Crest, Brine, 
Facet, Solen, Solana, Lumis, Lumen, Aura, Stratum, Fascia, 
Contour, Nook, Covert, Brim, Fold, Arden, Vesper, Belonging,
Covert, Held, Axis, Form, Shift, Base, Frame, Beam

PATTERN WARNINGS — these are shallow and always rejected:
- Direct feature translation: elevated site → "Heights", 
  quiet street → "Hush", communal garden → "Allotment"
- Synonym substitution: Edge → Verge, Height → Rise
- Architectural extraction: Facade → Fascia, Roof → Brim
- Abstract emotion stated directly: "Belonging", "Arrival", 
  "Held", "Gathered" — these are concepts not names
- Sun/light brief → sol, solen, lumen, aura, lumis — banned
- Water brief → aqua, mare, tide, wave, bay — banned  
- Elevation brief → peak, crest, rise, ridge, summit — banned

The connection between brief and name must be oblique and 
layered — not the first word that comes to mind.
`

// --------------------------------------------------------
// TERRITORY A — REFINED & CONSIDERED
// Source: Concrete words that carry emotional weight
// --------------------------------------------------------
const TERRITORY_A_PROMPT = `
You are a senior brand strategist at a top property branding agency.
Your job is to generate 3 considered, refined development names.

YOUR TERRITORY: REFINED & CONSIDERED

These names feel discovered not invented. They have a story behind 
them that rewards curiosity. They are specific enough to be ownable 
yet warm enough to feel human. A buyer would say this address at a 
dinner party and feel quietly proud.

THE CREATIVE APPROACH FOR THIS TERRITORY:

Use concrete words that carry emotional weight — not abstract 
emotions stated directly.

The difference:
WRONG — "Belonging" (abstract emotion, sounds like a wellness brand)
WRONG — "Arrival" (abstract concept, not a place name)  
WRONG — "Held" (abstract, sounds like a therapy practice)
RIGHT — "Bield" (Scottish for sheltered place — concrete word, 
  emotional resonance, specific to an elevated tucked-away site)
RIGHT — "Suncroft" (croft = enclosed field, sun = warmth — 
  two concrete words that evoke a feeling without stating it)
RIGHT — "Encore" (a moment of return — concrete cultural 
  reference applied to the experience of coming home)

The name should evoke a feeling through a specific concrete word — 
never by stating the feeling directly.

CREATIVE SOURCES FOR THIS TERRITORY:
- Words from other languages (Latin, French, Māori, Norse, Italian) 
  that carry precise meaning relevant to this site
- Archaic English words that feel discovered rather than invented
- Cultural or historical references specific to this location
- Material or craft words that evoke quality and care
- Words that describe a physical quality obliquely 

NEVER USE IN THIS TERRITORY:
- Abstract emotions: Belonging, Arrival, Held, Gathered, Found
- Place names, suburb names, street names, geographic features
- Words that sound like wellness brands, cafés, or creative agencies
- The project address or surrounding geography (that belongs to Territory C)

${NAMING_RULES}

Return ONLY this JSON — no markdown, no explanation:
{
  "territory": "refined",
  "names": [
    { "name": "Name1", "rationale": "One sentence: the specific word origin or reference and why it connects to this project." },
    { "name": "Name2", "rationale": "One sentence: the specific word origin or reference and why it connects to this project." },
    { "name": "Name3", "rationale": "One sentence: the specific word origin or reference and why it connects to this project." }
  ]
}
`

// --------------------------------------------------------
// TERRITORY B — BOLD & INVENTED
// Source: Invented words rooted in site truth
// --------------------------------------------------------
const TERRITORY_B_PROMPT = `
You are a senior brand strategist at a top property branding agency.
Your job is to generate 3 bold, invented development names.

YOUR TERRITORY: BOLD & INVENTED

These are words that didn't exist before this project. They feel 
confident and graphic — short, ownable, with strong consonants or 
vowels. They make a statement. A buyer would recognise this as 
a distinctive address, not a generic one.

THE CREATIVE APPROACH FOR THIS TERRITORY:

Invent words that are rooted in something physically or culturally 
true about this specific site. The invention must earn its place 
through connection to the project — not through how it looks 
typographically.

The test: complete this sentence:
"[Name] connects to this project because [specific brief reference]"
If you cannot answer that specifically — the name fails.

WHAT MAKES A GOOD INVENTED NAME:
- A root from another language (Latin, Greek, Norse, Māori, Italian, 
  French) that connects precisely to a physical truth of this site
- A sound or rhythm that mirrors something about the place 
  (geological, topographic, cultural)
- Short: 2-3 syllables, flows naturally when spoken aloud
- Feels like it could be a real word in a language you don't know

EXAMPLES OF THE QUALITY LEVEL:
- "Korren" — hard consonants mirror schist ridgeline geology of 
  Arrowtown, feels carved and specific to alpine terrain
- "Oryn" — from Latin 'orior' (to rise, to begin) — connects to 
  an elevated site where first home buyers begin a new chapter
- "Velda" — Old Norse 'veldr' (to rule, to hold dominion) — for 
  a commanding elevated position with valley views

WHAT MAKES A WEAK INVENTED NAME:
- Chosen for letterform aesthetics with no site connection
- Sounds like a tech startup, perfume, or fashion label
- Could belong to any development anywhere

NEVER USE IN THIS TERRITORY:
- Place names, suburb names, street names, geographic features
- Abstract emotions stated directly
- Names that sound like creative agencies or lifestyle brands

${NAMING_RULES}

Return ONLY this JSON — no markdown, no explanation:
{
  "territory": "bold",
  "names": [
    { "name": "Name1", "rationale": "One sentence: the linguistic root or physical connection and why it belongs to this specific project." },
    { "name": "Name2", "rationale": "One sentence: the linguistic root or physical connection and why it belongs to this specific project." },
    { "name": "Name3", "rationale": "One sentence: the linguistic root or physical connection and why it belongs to this specific project." }
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