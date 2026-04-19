"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"
import { Plus, Download } from "lucide-react"

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
        setProjects(mapped)
      }
      setLoading(false)
    }
    load()
  }, [])

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
        selected_concept: p.concepts?.find((c: any) => c.is_selected) || null
      }))
      setProjects(mapped)
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
              className="text-sm text-stone-light hover:text-paper transition-colors"
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
          <div className="flex items-end justify-between mb-10">
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <div
                key={project.id}
                className="bg-paper border border-border flex flex-col"
              >
                {/* Logo preview area */}
                <div
                  className="h-36 flex items-center justify-center"
                  style={{
                    backgroundColor: project.selected_concept
                      ? project.selected_concept.colors[0]
                      : "var(--ink)"
                  }}
                >
                  {project.selected_concept ? (
                    <div className="w-4/5 text-center">
                      <p
                        className="font-serif text-xl"
                        style={{
                          color: project.selected_concept.wordmark_color,
                          fontFamily: `'${project.selected_concept.fonts.heading}', serif`
                        }}
                      >
                        {project.selected_concept.brand_name}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] tracking-[0.2em] uppercase text-stone-light">
                      {project.status === "in_progress" ? "In Progress" : "No concept yet"}
                    </p>
                  )}
                </div>

                {/* Project info */}
                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div>
                    <h2 className="font-serif text-xl text-foreground tracking-tight">
                      {project.project_name}
                    </h2>
                    <p className="text-sm text-stone mt-1">
                      {project.street_address || project.address}
                    </p>
                    <p className="text-sm text-stone">
                      {project.suburb_city || project.location}
                    </p>
                    <p className="text-[11px] tracking-[0.1em] uppercase text-stone-light mt-2">
                      {new Date(project.created_at).toLocaleDateString("en-NZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 mt-auto">
                    {project.status === "completed" && (
                      <>
                        <button
                          onClick={() => router.push(
                            `/project/${project.id}/concept/${project.selected_concept?.id}`
                          )}
                          className="w-full h-12 text-sm font-medium bg-ink text-paper hover:bg-ink-light transition-all duration-200"
                        >
                          View Brand Concept
                        </button>
                        <button
                          onClick={() => alert("Export coming soon — Phase 2")}
                          className="w-full h-12 text-sm font-medium border border-border text-foreground hover:bg-cream transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download Brand Package
                        </button>
                      </>
                    )}
                    {project.status === "in_progress" && (
                      <button
                        onClick={() => router.push(`/project/${project.id}`)}
                        className="w-full h-12 text-sm font-medium border border-border text-foreground hover:bg-cream transition-all"
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
                        className="w-full h-12 text-sm font-medium border border-border text-foreground hover:bg-cream transition-all"
                      >
                        Create Brand Concept
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
