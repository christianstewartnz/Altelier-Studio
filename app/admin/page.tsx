"use client"

import { useEffect, useState } from "react"
import { WordmarkSVG } from "@/components/results/wordmark-svg"
import type { LogoComposition } from "@/components/results/results-overview"

// ─── Types ───────────────────────────────────────────────────────────────────

type ConceptRow = {
  id: string
  project_id: string
  concept_title: string
  brand_name: string
  tagline: string
  summary: string
  rationale: string
  colors: string[]
  wordmark_color: string
  color_rationale: string
  fonts: { heading: string; body: string }
  logo_text: string
  logo_composition: LogoComposition
  voice_sample: string
  attributes: string[]
  is_selected: boolean
  created_at: string
}

type ProjectRow = {
  id: string
  user_id: string
  project_name: string
  address?: string
  street_address?: string
  suburb_city?: string
  location?: string
  status: string
  paid_at?: string
  payment_id?: string
  created_at: string
  development_type?: string
  number_of_homes?: string
  target_market?: string | string[]
  price_positioning?: string
  additional_info?: string
  site_qualities?: string | string[]
  desired_tone?: string
  site_context?: string
  buyer_feeling?: string
  point_of_difference?: string
  brand_direction?: string
  words_to_avoid?: string
  concepts: ConceptRow[]
}

type UserRow = {
  id: string
  email: string
  full_name: string
  is_free_trial: boolean
  free_trial_used: boolean
  is_admin: boolean
  created_at: string
  projects: ProjectRow[]
}

type TestRun = {
  brief: string
  status: "loading" | "done" | "error"
  error?: string
  concepts?: BrandConceptResult[]
}

type BrandConceptResult = {
  id: string
  brandName: string
  tagline: string
  colors: string[]
  wordmarkColor: string
  fonts: { heading: string; body: string }
  logoComposition: LogoComposition
  conceptTitle: string
  rationale: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(val?: string | null) {
  if (!val) return "—"
  return new Date(val).toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatArray(val?: string | string[] | null) {
  if (!val) return "—"
  if (Array.isArray(val)) return val.join(", ")
  return val
}

const TEST_BRIEFS: { summary: string; brief: string }[] = [
  {
    summary: "Luxury Auckland apartments for downsizers",
    brief: `PROJECT OVERVIEW
- Location: Remuera, Auckland
- Development Type: Apartments
- Scale: 24 apartments across 6 floors
- Target Market: Downsizers, empty nesters
- Price Positioning: Luxury ($2.5M–$4M)

SITE CHARACTER
- Site Qualities: Elevated position, city fringe tree canopy, quiet cul-de-sac
- Desired Tone: Calm, considered, quietly prestigious
- Unique Site Context: Former private estate with established oak trees retained in landscaping

BRAND AMBITION
- Direction: Heritage reimagined for contemporary living
- Buyer Should Feel: Like they've arrived somewhere worthy of the life they've built
- Point of Difference: Scale of a boutique hotel, ownership of a home
- Words to Avoid: Luxury, premium, exclusive
- References: Neutral Bay's heritage apartment conversions, London mansion blocks`,
  },
  {
    summary: "Affordable Wellington townhouses for first home buyers",
    brief: `PROJECT OVERVIEW
- Location: Porirua, Wellington
- Development Type: Townhouses
- Scale: 38 terraced townhouses
- Target Market: First home buyers, young couples
- Price Positioning: Affordable ($620K–$780K)

SITE CHARACTER
- Site Qualities: Elevated ridge, harbour views from upper floors, north-facing
- Desired Tone: Optimistic, energetic, community-focused
- Unique Site Context: Site overlooks Porirua Harbour with direct view to Mana Island

BRAND AMBITION
- Direction: A first home that doesn't feel like a compromise
- Buyer Should Feel: Proud to own here, excited about what's next
- Point of Difference: Real views at an accessible price point
- Words to Avoid: Affordable, budget, starter
- References: Modern NZ terraced housing, Kāinga Ora developments done well`,
  },
  {
    summary: "Mid-range Christchurch standalone homes for families",
    brief: `PROJECT OVERVIEW
- Location: Halswell, Christchurch
- Development Type: Standalone homes
- Scale: 52 four-bedroom homes on 400–500sqm sections
- Target Market: Growing families, second home buyers
- Price Positioning: Mid-range ($850K–$1.1M)

SITE CHARACTER
- Site Qualities: Flat open land, new subdivision, proximity to Te Ara Ōtākaro Avon River corridor
- Desired Tone: Grounded, community-minded, optimistic
- Unique Site Context: Adjacent to one of Christchurch's major post-earthquake regeneration greenways

BRAND AMBITION
- Direction: A neighbourhood being built from scratch — get in early
- Buyer Should Feel: Like pioneers of a new community
- Point of Difference: Space and greenway access that inner city can't offer
- Words to Avoid: Estates, gated, exclusive
- References: Hobsonville Point, Ōtautahi community housing`,
  },
  {
    summary: "Investor-focused Brisbane apartments",
    brief: `PROJECT OVERVIEW
- Location: West End, Brisbane / South Bank precinct
- Development Type: Apartments
- Scale: 85 apartments, 1–3 bedroom
- Target Market: Investors, interstate buyers
- Price Positioning: Mid-range ($550K–$950K)

SITE CHARACTER
- Site Qualities: Inner urban, walkable to South Bank, heritage streetscape frontage retained
- Desired Tone: Urban, confident, creative-class
- Unique Site Context: Heritage warehouse facade incorporated into lobby entry — original brick and timber

BRAND AMBITION
- Direction: Industrial character made liveable
- Buyer Should Feel: Like they've found Brisbane's best-kept secret
- Point of Difference: Authentic texture in a precinct of glass towers
- Words to Avoid: Boutique, artisan, industrial-chic
- References: Melbourne's Fitzroy apartment conversions, Auckland's Kingsland`,
  },
  {
    summary: "Luxury Gold Coast standalone homes for families",
    brief: `PROJECT OVERVIEW
- Location: Mermaid Waters, Gold Coast
- Development Type: Standalone homes
- Scale: 18 large-format homes on 600–900sqm canal lots
- Target Market: Established families, interstate relocators
- Price Positioning: Luxury ($1.8M–$3.2M)

SITE CHARACTER
- Site Qualities: Canal frontage, boat access, northern aspect, subtropical landscaping
- Desired Tone: Relaxed confidence, resort-like without being try-hard
- Unique Site Context: Private canal estate with shared pontoon infrastructure and no through traffic

BRAND AMBITION
- Direction: The Gold Coast that locals actually choose
- Buyer Should Feel: Like they've outgrown showing off and found where they actually want to live
- Point of Difference: Privacy and water access without the gated estate formula
- Words to Avoid: Resort, paradise, dream, lifestyle
- References: Noosa Heads prestige housing, Byron Bay's quieter end`,
  },
]

// ─── Concept Card ────────────────────────────────────────────────────────────

function ConceptCard({
  concept,
  large = false,
}: {
  concept: {
    brand_name?: string
    brandName?: string
    tagline?: string
    colors: string[]
    wordmark_color?: string
    wordmarkColor?: string
    fonts: { heading: string; body: string }
    logo_composition?: LogoComposition
    logoComposition?: LogoComposition
    concept_title?: string
    conceptTitle?: string
    rationale?: string
  }
  large?: boolean
}) {
  const brandName = concept.brand_name ?? concept.brandName ?? ""
  const tagline = concept.tagline ?? ""
  const wordmarkColor = concept.wordmark_color ?? concept.wordmarkColor ?? "#ffffff"
  const composition = concept.logo_composition ?? concept.logoComposition
  const conceptTitle = concept.concept_title ?? concept.conceptTitle ?? ""
  const rationale = concept.rationale ?? ""

  if (!composition) return null

  return (
    <div
      className={`rounded-lg border border-border overflow-hidden flex flex-col ${large ? "w-full" : "flex-1 min-w-0"}`}
    >
      {/* Wordmark preview — inner tile matches results-overview.tsx exactly */}
      <div className="flex items-center justify-center p-4 bg-muted/30">
        <div
          className="rounded-xl overflow-hidden flex items-center justify-center p-3"
          style={{
            backgroundColor: concept.colors[0] ?? "#171717",
            width: large ? "360px" : "180px",
          }}
        >
          <WordmarkSVG
            composition={composition}
            color={wordmarkColor}
            headingFont={concept.fonts.heading}
          />
        </div>
      </div>

      {/* Colour swatches */}
      <div className="flex h-6">
        {concept.colors.map((c, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: c }} title={c} />
        ))}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col gap-1 bg-background flex-1">
        <p className="font-medium text-sm text-foreground">{brandName}</p>
        <p className="text-xs text-muted-foreground italic">{tagline}</p>
        <div className="mt-1 flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Style:</span> {composition.style}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Heading:</span> {concept.fonts.heading}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Body:</span> {concept.fonts.body}
          </p>
          {conceptTitle && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Territory:</span> {conceptTitle}
            </p>
          )}
          {large && rationale && (
            <p className="text-xs text-muted-foreground mt-1">{rationale}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Font loader ─────────────────────────────────────────────────────────────

function loadFonts(fonts: string[]) {
  const unique = [...new Set(fonts)].filter(Boolean)
  if (!unique.length) return
  const query = unique.map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;700`).join("&")
  const existing = document.getElementById("admin-fonts")
  if (existing) existing.remove()
  const link = document.createElement("link")
  link.id = "admin-fonts"
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`
  document.head.appendChild(link)
}

// ─── Users & Projects Tab ────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedRefinements, setExpandedRefinements] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setUsers(data.users)
        // Load all fonts from concepts
        const fonts: string[] = []
        for (const u of data.users) {
          for (const p of u.projects) {
            for (const c of p.concepts) {
              if (c.fonts?.heading) fonts.push(c.fonts.heading)
              if (c.fonts?.body) fonts.push(c.fonts.body)
            }
          }
        }
        loadFonts(fonts)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const toggleUser = (id: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleRefinements = (id: string) => {
    setExpandedRefinements((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Loading users…
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center text-sm text-destructive">
        Error: {error}
      </div>
    )
  }

  if (!users.length) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        No users found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {users.map((u) => {
        const isUserExpanded = expandedUsers.has(u.id)
        return (
          <div key={u.id} className="border border-border rounded-lg overflow-hidden">
            {/* User row */}
            <button
              onClick={() => toggleUser(u.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-6 min-w-0">
                <span className="font-medium text-sm text-foreground truncate">
                  {u.email || "—"}
                </span>
                <span className="text-xs text-muted-foreground truncate hidden sm:block">
                  {u.full_name || "—"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {u.is_free_trial && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Trial
                    </span>
                  )}
                  {u.free_trial_used && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Trial used
                    </span>
                  )}
                  {u.is_admin && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-foreground text-background">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                <span className="text-xs text-muted-foreground hidden md:block">
                  {formatDate(u.created_at)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {u.projects.length} project{u.projects.length !== 1 ? "s" : ""}
                </span>
                <svg
                  className={`w-4 h-4 text-muted-foreground transition-transform ${isUserExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* User expanded: projects */}
            {isUserExpanded && (
              <div className="border-t border-border bg-muted/20 px-4 py-3 flex flex-col gap-2">
                {!u.projects.length ? (
                  <p className="text-xs text-muted-foreground py-2">No projects.</p>
                ) : (
                  u.projects.map((p) => {
                    const isProjectExpanded = expandedProjects.has(p.id)
                    const generatedConcepts = p.concepts.filter((c) => !c.is_selected)
                    const selectedConcept = p.concepts.find((c) => c.is_selected)
                    const isRefExpanded = expandedRefinements.has(p.id)

                    return (
                      <div key={p.id} className="border border-border rounded-lg overflow-hidden bg-background">
                        {/* Project row */}
                        <button
                          onClick={() => toggleProject(p.id)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="text-sm text-foreground font-medium truncate">
                              {p.project_name || "Untitled"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate hidden sm:block">
                              {p.suburb_city ?? p.location ?? p.address ?? "—"}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                                p.status === "completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : p.status === "in_progress"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 ml-4">
                            {p.paid_at && (
                              <span className="text-xs text-muted-foreground hidden md:block">
                                Paid {formatDate(p.paid_at)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground hidden md:block">
                              {formatDate(p.created_at)}
                            </span>
                            <svg
                              className={`w-4 h-4 text-muted-foreground transition-transform ${isProjectExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {/* Project expanded */}
                        {isProjectExpanded && (
                          <div className="border-t border-border px-4 py-4 flex flex-col gap-6">
                            {/* Brief inputs */}
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Brief
                              </h4>
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                {[
                                  ["Development Type", p.development_type],
                                  ["Number of Homes", p.number_of_homes],
                                  ["Target Market", formatArray(p.target_market)],
                                  ["Price Positioning", p.price_positioning],
                                  ["Desired Tone", p.desired_tone],
                                  ["Site Qualities", formatArray(p.site_qualities)],
                                  ["Site Context", p.site_context],
                                  ["Buyer Feeling", p.buyer_feeling],
                                  ["Point of Difference", p.point_of_difference],
                                  ["Brand Direction", p.brand_direction],
                                  ["Words to Avoid", p.words_to_avoid],
                                  ["Additional Info", p.additional_info],
                                  ["Street Address", p.street_address],
                                  ["Suburb / City", p.suburb_city],
                                  ["Payment ID", p.payment_id],
                                ].map(([label, value]) =>
                                  value ? (
                                    <div key={label as string} className="py-0.5">
                                      <dt className="text-xs text-muted-foreground inline">
                                        {label}:{" "}
                                      </dt>
                                      <dd className="text-xs text-foreground inline">{value}</dd>
                                    </div>
                                  ) : null
                                )}
                              </dl>
                            </div>

                            {/* Generated Concepts */}
                            {generatedConcepts.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                  Generated Concepts ({generatedConcepts.length})
                                </h4>
                                <div className="flex gap-3 overflow-x-auto">
                                  {generatedConcepts.map((c) => (
                                    <div key={c.id} className="w-52 shrink-0">
                                      <ConceptCard concept={c} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Refinements — no separate DB records in current schema */}
                            <div>
                              <button
                                onClick={() => toggleRefinements(p.id)}
                                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                              >
                                <svg
                                  className={`w-3 h-3 transition-transform ${isRefExpanded ? "rotate-180" : ""}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Refinements
                              </button>
                              {isRefExpanded && (
                                <p className="text-xs text-muted-foreground mt-2 pl-5">
                                  Refinements are applied in-place to concepts — no separate records in the current schema.
                                </p>
                              )}
                            </div>

                            {/* Final Selected */}
                            {selectedConcept && (
                              <div className="border border-border rounded-lg p-4 bg-muted/30">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                  Final Selected
                                </h4>
                                <ConceptCard concept={selectedConcept} large />
                              </div>
                            )}

                            {!generatedConcepts.length && !selectedConcept && (
                              <p className="text-xs text-muted-foreground">No concepts generated yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── AI Test Tab ─────────────────────────────────────────────────────────────

function AiTestTab() {
  const [runs, setRuns] = useState<TestRun[]>([])
  const [running, setRunning] = useState(false)
  const [styleTally, setStyleTally] = useState<Record<string, number>>({})

  const addStyleToTally = (style: string) => {
    setStyleTally((prev) => ({ ...prev, [style]: (prev[style] ?? 0) + 1 }))
  }

  const handleRunTests = async () => {
    setRunning(true)

    // Initialise all 5 runs as loading
    const initial: TestRun[] = TEST_BRIEFS.map((b) => ({
      brief: b.summary,
      status: "loading",
    }))
    setRuns(initial)

    // Load any fonts we might need
    const fontCache = new Set<string>()

    for (let i = 0; i < TEST_BRIEFS.length; i++) {
      const { brief, summary } = TEST_BRIEFS[i]

      try {
        const res = await fetch("/api/admin/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief }),
        })

        if (!res.ok) {
          const data = await res.json()
          setRuns((prev) => {
            const next = [...prev]
            next[i] = { brief: summary, status: "error", error: data.error ?? "Unknown error" }
            return next
          })
          continue
        }

        const data = await res.json()
        const concepts: BrandConceptResult[] = (data.concepts ?? []).map((c: any) => ({
          id: c.id ?? String(Math.random()),
          brandName: c.brandName,
          tagline: c.tagline,
          colors: c.colors,
          wordmarkColor: c.wordmarkColor,
          fonts: c.fonts,
          logoComposition: c.logoComposition,
          conceptTitle: c.conceptTitle,
          rationale: c.rationale,
        }))

        // Tally styles and collect fonts
        for (const c of concepts) {
          if (c.logoComposition?.style) addStyleToTally(c.logoComposition.style)
          if (c.fonts?.heading && !fontCache.has(c.fonts.heading)) {
            fontCache.add(c.fonts.heading)
          }
          if (c.fonts?.body && !fontCache.has(c.fonts.body)) {
            fontCache.add(c.fonts.body)
          }
        }

        loadFonts([...fontCache])

        setRuns((prev) => {
          const next = [...prev]
          next[i] = { brief: summary, status: "done", concepts }
          return next
        })
      } catch (err: any) {
        setRuns((prev) => {
          const next = [...prev]
          next[i] = { brief: summary, status: "error", error: err.message ?? "Network error" }
          return next
        })
      }
    }

    setRunning(false)
  }

  const sortedTally = Object.entries(styleTally).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRunTests}
          disabled={running}
          className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {running ? "Running…" : "Run Test Generation"}
        </button>
        {running && (
          <span className="text-xs text-muted-foreground">
            Generating {TEST_BRIEFS.length} briefs sequentially…
          </span>
        )}
      </div>

      {/* Style tally */}
      {sortedTally.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Composition Style Tally (all runs)
          </h3>
          <div className="flex flex-wrap gap-2">
            {sortedTally.map(([style, count]) => (
              <div
                key={style}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-border bg-muted/30"
              >
                <span className="font-medium text-foreground">{style}</span>
                <span className="text-muted-foreground">×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run blocks */}
      {runs.length > 0 && (
        <div className="flex flex-col gap-6">
          {runs.map((run, i) => (
            <div key={i} className="border border-border rounded-lg overflow-hidden">
              {/* Run header */}
              <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide mr-2">
                    Run {i + 1}
                  </span>
                  <span className="text-sm text-foreground">{run.brief}</span>
                </div>
                {run.status === "loading" && (
                  <div className="flex gap-1 shrink-0">
                    {[0, 0.15, 0.3].map((delay, di) => (
                      <span
                        key={di}
                        className="block w-1.5 h-1.5 rounded-full bg-muted-foreground"
                        style={{
                          animation: "wave 1.2s ease-in-out infinite",
                          animationDelay: `${delay}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {run.status === "done" && (
                  <span className="text-xs text-green-600 dark:text-green-400 shrink-0">Done</span>
                )}
                {run.status === "error" && (
                  <span className="text-xs text-destructive shrink-0">Error</span>
                )}
              </div>

              {/* Run body */}
              <div className="p-4">
                {run.status === "loading" && (
                  <p className="text-xs text-muted-foreground">Generating concepts…</p>
                )}
                {run.status === "error" && (
                  <p className="text-xs text-destructive">{run.error}</p>
                )}
                {run.status === "done" && run.concepts && (
                  <div className="flex gap-3 overflow-x-auto">
                    {run.concepts.map((c) => (
                      <div key={c.id} className="w-56 shrink-0">
                        <ConceptCard concept={c} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "test">("users")

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Internal tool — restricted access</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(["users", "test"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "users" ? "Users & Projects" : "AI Test"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "users" && <UsersTab />}
        {tab === "test" && <AiTestTab />}
      </div>
    </div>
  )
}
