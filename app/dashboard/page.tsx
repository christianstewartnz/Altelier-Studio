"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, Download, Search } from "lucide-react"
import { WordmarkSVG } from "@/components/results/wordmark-svg"
import { getContrastColor, isLightColor } from "@/lib/color-utils"
import { AppHeader } from "@/components/app-header"

/** Case-insensitive match on the city field → Australia; otherwise New Zealand. */
const AUSTRALIAN_CITIES = new Set(
  [
    "Sydney",
    "Melbourne",
    "Brisbane",
    "Perth",
    "Adelaide",
    "Gold Coast",
    "Canberra",
    "Hobart",
    "Darwin",
    "Newcastle",
    "Wollongong",
    "Geelong",
    "Townsville",
    "Cairns",
    "Toowoomba",
    "Ballarat",
    "Bendigo",
    "Launceston",
    "Mackay",
    "Rockhampton",
    "Bunbury",
    "Mandurah",
    "Sunshine Coast",
    "Central Coast",
  ].map(c => c.toLowerCase())
)

function countryFromCity(city: string): "Australia" | "New Zealand" {
  const key = city.trim().toLowerCase()
  return AUSTRALIAN_CITIES.has(key) ? "Australia" : "New Zealand"
}

type Project = {
  id: string
  project_name: string
  address: string
  status: "draft" | "in_progress" | "completed"
  selected_concept?: {
    id: string
    brand_name: string
    colors: string[]
    wordmark_color: string
    logo_composition: any
    fonts: { heading: string; body: string }
  } | null
  created_at: string
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [address, setAddress] = useState("")
  const [suburb, setSuburb] = useState("")
  const [city, setCity] = useState("")
  const [creating, setCreating] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUser(user)

      const { data: projects } = await supabase
        .from("projects")
        .select(`
          *,
          concepts (
            id,
            brand_name,
            colors,
            wordmark_color,
            logo_composition,
            fonts,
            is_selected
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (projects) {
        const mapped = projects.map((p: any) => ({
          ...p,
          selected_concept: p.concepts?.find((c: any) => c.is_selected) || null
        }))
        setProjects(sortProjects(mapped))
      }
      setLoading(false)
    }
    load()
  }, [])

  function sortProjects(list: Project[]): Project[] {
    return [...list].sort((a, b) => {
      const aComplete = a.status === "completed" ? 1 : 0
      const bComplete = b.status === "completed" ? 1 : 0
      if (aComplete !== bComplete) return aComplete - bComplete
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  function formatProjectDate(value: string) {
    return new Date(value).toLocaleDateString("en-NZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  async function handleCreateProject() {
    if (!projectName.trim() || !address.trim() || !suburb.trim() || !city.trim()) return
    setCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const suburbTrim = suburb.trim()
    const cityTrim = city.trim()
    const suburbCityCombined = `${suburbTrim}, ${cityTrim}`
    const country = countryFromCity(cityTrim)

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        project_name: projectName.trim(),
        address: address.trim(),
        street_address: address.trim(),
        suburb: suburbTrim,
        city: cityTrim,
        country,
        suburb_city: suburbCityCombined,
        location: suburbCityCombined,
        status: "draft"
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      setCreating(false)
      return
    }

    setCreating(false)
    setShowNewProject(false)
    setProjectName("")
    setAddress("")
    setSuburb("")
    setCity("")

    const { data: updatedProjects } = await supabase
      .from("projects")
      .select(`
        *,
        concepts (
          id,
          brand_name,
          colors,
          wordmark_color,
          logo_composition,
          fonts,
          is_selected
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (updatedProjects) {
      const mapped = updatedProjects.map((p: any) => ({
        ...p,
        selected_concept: p.concepts?.find((c: any) => c.is_selected) || null,
      }))
      setProjects(sortProjects(mapped))
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14110F] flex items-center justify-center">
        <style>{`
          @keyframes wave {
            0%, 100% { transform: translateY(0px); opacity: 0.4; }
            50% { transform: translateY(-8px); opacity: 1; }
          }
        `}</style>
        <div className="flex gap-2">
          <span className="block w-2 h-2 bg-[#B5281C]"
            style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0s" }} />
          <span className="block w-2 h-2 bg-[#B5281C]"
            style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.2s" }} />
          <span className="block w-2 h-2 bg-[#B5281C]"
            style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.4s" }} />
        </div>
      </div>
    )
  }

  const locations = Array.from(new Set(
    projects.map(p => (p as any).suburb_city || (p as any).location || "").filter(Boolean)
  )).sort()

  const visibleProjects = projects.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      p.project_name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      ((p as any).suburb_city || "").toLowerCase().includes(q) ||
      (p.selected_concept?.brand_name || "").toLowerCase().includes(q)
    const loc = (p as any).suburb_city || (p as any).location || ""
    const matchesLocation = !locationFilter || loc === locationFilter
    return matchesSearch && matchesLocation
  })

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <AppHeader
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
        ]}
        actions={(
          <>
            <button
              onClick={() => setShowNewProject(true)}
              className="hidden h-11 items-center gap-2 border border-[#D7C3B7] px-5 text-sm font-medium text-[#8A3A30] transition-colors hover:border-[#B5281C] hover:bg-[#B5281C] hover:text-[#FEFFEF] sm:flex"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-[#4E473F] transition-colors hover:text-[#B5281C]"
            >
              Sign out
            </button>
          </>
        )}
      />

      {projects.length === 0 && (
        <div className="animate-fade-up">
          <section className="bg-[#14110F] text-paper py-16 md:py-24 grain-texture">
            <div className="mx-auto max-w-3xl px-6 relative z-10">
              <div className="max-w-xl">
                <p className="step-label text-stone-light mb-6">Dashboard</p>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6 text-balance leading-[1.1]">
                  Welcome to Atelier Studio
                </h1>
                <p className="text-lg text-stone-light leading-relaxed max-w-md">
                  Create your first project to start generating distinctive brand concepts for your development.
                </p>
              </div>
            </div>
          </section>
          <section className="py-16 bg-[#FAF9F7]">
            <div className="mx-auto max-w-3xl px-6">
              <button
                onClick={() => setShowNewProject(true)}
                className="h-14 px-10 text-base font-medium bg-[#B5281C] text-[#FEFFEF] hover:bg-[#8C1E14] transition-colors duration-200"
              >
                Create Your First Project
              </button>
            </div>
          </section>
        </div>
      )}

      {projects.length > 0 && (
        <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-4xl tracking-tight text-[#14110F] sm:text-[2.7rem]">
                Your Projects
              </h1>
              <button
                onClick={() => setShowNewProject(true)}
                className="mt-4 flex h-11 items-center gap-2 border border-[#D7C3B7] px-4 text-sm font-medium text-[#8A3A30] transition-colors hover:border-[#B5281C] hover:bg-[#B5281C] hover:text-[#FEFFEF] sm:hidden"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>

            <div className="flex w-full max-w-[640px] flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0A89E]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="h-12 w-full border border-[#E4DDD6] bg-[#FCFBF8] pl-11 pr-4 text-sm text-[#14110F] placeholder:text-[#B0A89E] focus:border-[#B5281C] focus:outline-none transition-colors"
                />
              </div>
              <select
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                className="h-12 min-w-[220px] appearance-none border border-[#E4DDD6] bg-[#FCFBF8] px-4 pr-10 text-sm text-[#14110F] transition-colors focus:border-[#B5281C] focus:outline-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {visibleProjects.length === 0 && (
            <p className="py-8 text-sm text-stone">No projects match your search.</p>
          )}

          <div className="flex flex-col gap-4">
            {visibleProjects.map(project => {
              const concept = project.selected_concept
              const tileBackground = concept?.colors?.[0] || "#FCFBF8"
              const tileLight = concept ? isLightColor(tileBackground) : true
              const tileText = concept ? getContrastColor(tileBackground) : "#14110F"
              const tileMuted = tileLight ? "rgba(20,17,15,0.42)" : "rgba(248,244,239,0.68)"
              const tileDivider = tileLight ? "rgba(20,17,15,0.12)" : "rgba(248,244,239,0.18)"
              const secondaryButtonBorder = tileLight ? "rgba(20,17,15,0.18)" : "rgba(248,244,239,0.28)"
              const secondaryButtonHover = tileLight ? "rgba(20,17,15,0.05)" : "rgba(248,244,239,0.08)"

              const isInProgress = project.status === "in_progress"
              const isCompleted = project.status === "completed"

              const statusLabel =
                isCompleted ? "Completed"
                : isInProgress ? "In Progress"
                : "Draft"

              return (
                <div
                  key={project.id}
                  className={`overflow-hidden border border-[#E4DDD6] bg-[#FCFBF8] transition-colors duration-200 ${
                    isInProgress ? "group hover:bg-[#F8EEEB]" : ""
                  }`}
                  style={{
                    backgroundColor: concept ? tileBackground : undefined,
                    borderColor: concept ? tileDivider : undefined,
                  }}
                >
                  <div className="grid min-h-[170px] grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
                    <div className={`flex min-w-0 flex-col justify-between gap-5 px-6 py-6 transition-colors duration-200 sm:px-8 ${
                      isInProgress ? "border-l-2 border-l-[#B5281C] group-hover:bg-[#F8EEEB]" : ""
                    }`}
                    style={{
                      color: tileText,
                    }}>
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-1.5">
                          {isInProgress && (
                            <span
                              className="inline-block h-1.5 w-1.5 flex-shrink-0"
                              style={{ backgroundColor: "#B5281C" }}
                            />
                          )}
                          <p
                            className="text-[10px] uppercase tracking-[0.25em]"
                            style={{ color: isInProgress ? "#B5281C" : tileMuted }}
                          >
                            {statusLabel}
                          </p>
                        </div>

                        <h2 className="truncate font-serif text-[2rem] leading-none tracking-tight">
                          {project.project_name}
                        </h2>
                        <p className="mt-2 truncate text-sm" style={{ color: tileMuted }}>
                          {(project as any).street_address || project.address}
                          {((project as any).suburb_city || (project as any).location)
                            ? `, ${(project as any).suburb_city || (project as any).location}`
                            : ""}
                        </p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: tileMuted }}>
                          {formatProjectDate(project.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isCompleted && (
                          <>
                            <button
                              onClick={() => router.push(
                                `/project/${project.id}/concept/${concept?.id}`
                              )}
                              className="h-9 border border-[#B5281C] px-4 text-xs font-medium tracking-wide text-[#B5281C] transition-colors duration-150 hover:bg-[#B5281C] hover:text-[#FEFFEF]"
                            >
                              View Brand Concept
                            </button>
                            <button
                              onClick={() => alert("Export coming soon — Phase 2")}
                              className="flex h-9 items-center gap-1.5 px-4 text-xs font-medium tracking-wide transition-colors duration-150"
                              style={{
                                border: `1px solid ${secondaryButtonBorder}`,
                                color: tileText,
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = secondaryButtonHover
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent"
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download Package
                            </button>
                          </>
                        )}
                        {isInProgress && (
                          <button
                            onClick={() => router.push(`/project/${project.id}`)}
                            className="h-9 bg-[#B5281C] px-4 text-xs font-medium tracking-wide text-[#FEFFEF] transition-colors duration-150 hover:bg-[#8C1E14]"
                          >
                            Continue Brief
                          </button>
                        )}
                        {project.status === "draft" && (
                          <button
                            onClick={async () => {
                              await supabase
                                .from("projects")
                                .update({ status: "in_progress" })
                                .eq("id", project.id)
                              router.push(`/project/${project.id}`)
                            }}
                            className="h-9 bg-[#B5281C] px-4 text-xs font-medium tracking-wide text-[#FEFFEF] transition-colors duration-150 hover:bg-[#8C1E14]"
                          >
                            Create Brand Concept
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-center border-t border-[#E4DDD6] px-6 py-6 transition-colors duration-200 lg:border-t-0 lg:border-l ${
                        isInProgress && !concept ? "group-hover:bg-[#F8EEEB]" : ""
                      }`}
                      style={{
                        backgroundColor: isInProgress && !concept ? undefined : tileBackground,
                        borderColor: concept ? tileDivider : "#E4DDD6",
                      }}
                    >
                      {concept?.logo_composition ? (
                        <div className="w-full max-w-[280px]">
                          <WordmarkSVG
                            composition={concept.logo_composition}
                            color={concept.wordmark_color}
                            headingFont={concept.fonts.heading}
                          />
                        </div>
                      ) : (
                        <p
                          className="text-[10px] uppercase tracking-[0.25em]"
                          style={{ color: tileMuted }}
                        >
                          {isInProgress ? "In Progress" : "No concept yet"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="bg-[#F8F8F8] w-full max-w-md border border-border">
            {/* Modal header */}
            <div className="bg-[#14110F] text-paper px-8 py-6 grain-texture relative z-10">
              <h2 className="font-serif text-2xl tracking-tight">New Project</h2>
              <p className="text-sm text-stone-light mt-1">
                Give your project a name and address to get started.
              </p>
            </div>

            {/* Modal body */}
            <div className="px-8 py-8 space-y-6">
              <div className="space-y-2">
                <label className="field-label">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Ponsonby Townhouses"
                  className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-[#B5281C] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="field-label">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 1 Manuka Street"
                  className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-[#B5281C] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="field-label">Suburb</label>
                <input
                  type="text"
                  value={suburb}
                  onChange={e => setSuburb(e.target.value)}
                  placeholder="e.g. Ponsonby"
                  className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-[#B5281C] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="field-label">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Auckland"
                  className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-[#B5281C] transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowNewProject(false)
                    setProjectName("")
                    setAddress("")
                    setSuburb("")
                    setCity("")
                  }}
                  className="flex-1 h-14 text-sm font-medium border border-border text-foreground hover:bg-[#FAF9F7] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || !address.trim() || !suburb.trim() || !city.trim() || creating}
                  className="flex-1 h-14 text-sm font-medium bg-[#B5281C] text-[#FEFFEF] hover:bg-[#8C1E14] disabled:opacity-40 transition-all"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
