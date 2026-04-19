"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"
import { Plus, Download, Search } from "lucide-react"
import { WordmarkSVG } from "@/components/results/wordmark-svg"
import { isLightColor } from "@/lib/color-utils"

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
  const [suburbCity, setSuburbCity] = useState("")
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

  function extractLocation(fullAddress: string): string {
    const parts = fullAddress.split(",").map(p => p.trim())
    if (parts.length <= 2) return fullAddress
    return parts.slice(1).join(", ")
  }

  async function handleCreateProject() {
    if (!projectName.trim() || !address.trim() || !suburbCity.trim()) return
    setCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        project_name: projectName.trim(),
        address: address.trim(),
        street_address: address.trim(),
        suburb_city: suburbCity.trim(),
        location: suburbCity.trim(),
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
    setSuburbCity("")

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
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <style>{`
          @keyframes wave {
            0%, 100% { transform: translateY(0px); opacity: 0.4; }
            50% { transform: translateY(-8px); opacity: 1; }
          }
        `}</style>
        <div className="flex gap-2">
          <span className="block w-2 h-2 bg-terracotta"
            style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0s" }} />
          <span className="block w-2 h-2 bg-terracotta"
            style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.2s" }} />
          <span className="block w-2 h-2 bg-terracotta"
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
    <div className="min-h-screen bg-cream">

      {/* Header — espresso, grain texture */}
      <header className="sticky top-0 z-50 bg-ink text-paper grain-texture">
        <div className="mx-auto max-w-6xl px-6 relative z-10">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl md:text-3xl tracking-tight">{APP_NAME}</span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-stone-light font-medium">{APP_SUBTITLE}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-stone-light hover:opacity-70 transition-opacity"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="animate-fade-up">
          {/* Espresso hero */}
          <section className="bg-ink text-paper py-16 md:py-24 grain-texture">
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
          {/* CTA area */}
          <section className="py-16 bg-cream">
            <div className="mx-auto max-w-3xl px-6">
              <button
                onClick={() => setShowNewProject(true)}
                className="h-14 px-10 text-base font-medium bg-ink text-paper hover:bg-ink-light transition-all duration-200"
              >
                Create Your First Project
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Projects grid */}
      {projects.length > 0 && (
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-end justify-between mb-6">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
              Your Projects
            </h1>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 h-10 px-5 border border-ink text-ink text-sm font-medium hover:bg-ink hover:text-paper transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>

          {/* Search + filter row */}
          <div className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-light pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="w-full h-10 pl-9 pr-4 bg-paper border border-border text-sm text-foreground placeholder:text-stone-light focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="h-10 px-4 bg-paper border border-border text-sm text-foreground focus:outline-none focus:border-terracotta transition-colors appearance-none pr-8"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {visibleProjects.length === 0 && (
            <p className="text-sm text-stone py-8">No projects match your search.</p>
          )}

          <div className="flex flex-col gap-3">
            {visibleProjects.map(project => {
              const concept = project.selected_concept
              const bgColor = concept ? concept.colors[0] : "#FFFFFF"
              const light = concept ? isLightColor(concept.colors[0]) : true
              const textColor = light ? "#3D2412" : "#F8F6F2"
              const mutedColor = light ? "rgba(61,36,18,0.5)" : "rgba(248,246,242,0.5)"
              const dividerColor = light ? "rgba(61,36,18,0.12)" : "rgba(248,246,242,0.12)"
              const btnSolidBg = light ? "rgba(61,36,18,0.9)" : "rgba(248,246,242,0.92)"
              const btnSolidText = light ? "#F8F6F2" : "#3D2412"
              const btnBorderColor = light ? "rgba(61,36,18,0.35)" : "rgba(248,246,242,0.35)"

              const statusLabel =
                project.status === "completed" ? "Completed"
                : project.status === "in_progress" ? "In Progress"
                : "Draft"

              return (
                <div
                  key={project.id}
                  className="flex items-stretch"
                  style={{ backgroundColor: bgColor, border: `1px solid ${dividerColor}` }}
                >
                  {/* Left: project info + action buttons */}
                  <div className="flex-1 min-w-0 px-8 py-6 flex flex-col justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className="text-[10px] tracking-[0.25em] uppercase mb-1.5"
                        style={{ color: mutedColor }}
                      >
                        {statusLabel}
                      </p>
                      <h2
                        className="font-serif text-2xl tracking-tight truncate"
                        style={{ color: textColor }}
                      >
                        {project.project_name}
                      </h2>
                      <p className="text-sm mt-0.5 truncate" style={{ color: mutedColor }}>
                        {(project as any).street_address || project.address}
                        {((project as any).suburb_city || (project as any).location)
                          ? `, ${(project as any).suburb_city || (project as any).location}`
                          : ""}
                      </p>
                      <p
                        className="text-[10px] tracking-[0.15em] uppercase mt-1.5"
                        style={{ color: mutedColor }}
                      >
                        {new Date(project.created_at).toLocaleDateString("en-NZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {project.status === "completed" && (
                        <>
                          <button
                            onClick={() => router.push(
                              `/project/${project.id}/concept/${concept?.id}`
                            )}
                            className="h-9 px-5 text-xs font-medium tracking-wide transition-all duration-150"
                            style={{
                              backgroundColor: btnSolidBg,
                              color: btnSolidText,
                            }}
                          >
                            View Brand Concept
                          </button>
                          <button
                            onClick={() => alert("Export coming soon — Phase 2")}
                            className="h-9 px-5 text-xs font-medium tracking-wide flex items-center gap-1.5 transition-all duration-150"
                            style={{
                              border: `1px solid ${btnBorderColor}`,
                              color: textColor,
                              backgroundColor: "transparent",
                            }}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Package
                          </button>
                        </>
                      )}
                      {project.status === "in_progress" && (
                        <button
                          onClick={() => router.push(`/project/${project.id}`)}
                          className="h-9 px-5 text-xs font-medium tracking-wide transition-all duration-150"
                          style={{
                            backgroundColor: btnSolidBg,
                            color: btnSolidText,
                          }}
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
                          className="h-9 px-5 text-xs font-medium tracking-wide transition-all duration-150"
                          style={{
                            backgroundColor: btnSolidBg,
                            color: btnSolidText,
                          }}
                        >
                          Create Brand Concept
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vertical divider */}
                  <div className="w-px self-stretch" style={{ backgroundColor: dividerColor }} />

                  {/* Right: logo */}
                  <div className="w-64 md:w-80 flex-shrink-0 flex items-center justify-center px-8 py-5">
                    {concept?.logo_composition ? (
                      <div className="w-full">
                        <WordmarkSVG
                          composition={concept.logo_composition}
                          color={concept.wordmark_color}
                          headingFont={concept.fonts.heading}
                        />
                      </div>
                    ) : (
                      <p
                        className="text-[10px] tracking-[0.25em] uppercase text-center"
                        style={{ color: mutedColor }}
                      >
                        {project.status === "in_progress" ? "In Progress" : "No concept yet"}
                      </p>
                    )}
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
          <div className="bg-paper w-full max-w-md border border-border">
            {/* Modal header */}
            <div className="bg-ink text-paper px-8 py-6 grain-texture relative z-10">
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
                  className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-terracotta transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="field-label">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 1 Manuka Street"
                  className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-terracotta transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="field-label">Suburb & City</label>
                <input
                  type="text"
                  value={suburbCity}
                  onChange={e => setSuburbCity(e.target.value)}
                  placeholder="e.g. Miramar, Wellington, New Zealand"
                  className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-terracotta transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowNewProject(false)
                    setProjectName("")
                    setAddress("")
                    setSuburbCity("")
                  }}
                  className="flex-1 h-14 text-sm font-medium border border-border text-foreground hover:bg-cream transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || !address.trim() || !suburbCity.trim() || creating}
                  className="flex-1 h-14 text-sm font-medium bg-ink text-paper hover:bg-ink-light disabled:opacity-40 transition-all"
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
