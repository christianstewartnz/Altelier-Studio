"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"
import { Plus } from "lucide-react"

type Project = {
  id: string
  project_name: string
  address: string
  status: "draft" | "in_progress" | "completed"
  selected_concept?: {
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
    if (!projectName.trim() || !address.trim() || 
      !suburbCity.trim()) return
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

    // Reset modal state before redirecting
    setCreating(false)
    setShowNewProject(false)
    setProjectName("")
    setAddress("")
    setSuburbCity("")
    
    // Refresh projects list instead of redirecting
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
        selected_concept: p.concepts?.find(
          (c: any) => c.is_selected
        ) || null
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <style>{`
          @keyframes wave {
            0%, 100% { transform: translateY(0px); opacity: 0.4; }
            50% { transform: translateY(-8px); opacity: 1; }
          }
        `}</style>
        <div className="flex gap-2">
          <span className="block w-2 h-2 rounded-full bg-foreground"
            style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0s" }} />
          <span className="block w-2 h-2 rounded-full bg-foreground"
            style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.2s" }} />
          <span className="block w-2 h-2 rounded-full bg-foreground"
            style={{ animation: "wave 1.2s ease-in-out infinite", animationDelay: "0.4s" }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-serif text-2xl md:text-3xl tracking-tight text-foreground">{APP_NAME}</span>
              <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground ml-6 -mt-0.5">{APP_SUBTITLE}</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mx-auto max-w-2xl px-6 py-16 md:py-24 text-center">
              <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-5 text-balance">
                Welcome to Atelier Studio
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed mb-12">
                Create your first project to start generating distinctive brand concepts for your development.
              </p>
              <button
                onClick={() => setShowNewProject(true)}
                className="h-14 px-10 rounded-2xl text-base font-medium bg-foreground text-background hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Create Your First Project
              </button>
            </div>
          </div>
        )}

        {/* Projects grid */}
        {projects.length > 0 && (
          <div>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-2 h-10 px-4 rounded-full border border-border text-sm text-foreground hover:bg-background transition-all"
              >
                <Plus className="size-4" />
                New Project
              </button>
            </div>
            <h1 className="font-serif text-3xl text-foreground tracking-tight mb-10">
              Your Projects
            </h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="bg-background border border-border rounded-3xl p-6 flex flex-col gap-4"
                >
                  {/* Logo preview or placeholder */}
                  <div
                    className="rounded-2xl h-32 flex items-center justify-center"
                    style={{
                      backgroundColor: project.selected_concept
                        ? project.selected_concept.colors[0]
                        : "var(--secondary)"
                    }}
                  >
                    {project.selected_concept ? (
                      <div className="w-4/5">
                        <div
                          className="text-center font-serif text-xl"
                          style={{
                            color: project.selected_concept.wordmark_color,
                            fontFamily: `'${project.selected_concept.fonts.heading}', serif`
                          }}
                        >
                          {project.selected_concept.brand_name}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground tracking-widest uppercase">
                        {project.status === "in_progress" ? "In Progress" : "No concept yet"}
                      </p>
                    )}
                  </div>

                  {/* Project info */}
                  <div>
                    <h2 className="font-medium text-foreground text-lg">
                      {project.project_name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.street_address || project.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {project.suburb_city || project.location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(project.created_at).toLocaleDateString("en-NZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>

                  {/* Action button */}
                  {project.status === "completed" && (
                    <button
                      onClick={() => router.push(`/project/${project.id}/concept`)}
                      className="w-full h-12 rounded-2xl text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-all"
                    >
                      View Brand Concept
                    </button>
                  )}
                  {project.status === "in_progress" && (
                    <button
                      onClick={() => router.push(`/project/${project.id}`)}
                      className="w-full h-12 rounded-2xl text-sm font-medium border border-border hover:bg-secondary transition-all"
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
                      className="w-full h-12 rounded-2xl text-sm font-medium border border-border hover:bg-secondary transition-all"
                    >
                      Create Brand Concept
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-card rounded-3xl p-8 w-full max-w-md border border-border shadow-2xl">
            <h2 className="font-serif text-2xl text-foreground tracking-tight mb-2">
              New Project
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Give your project a name and address to get started.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Ponsonby Townhouses"
                  className="w-full h-14 px-5 bg-background border border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 1 Manuka Street"
                  className="w-full h-14 px-5 bg-background border border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Suburb & City
                </label>
                <input
                  type="text"
                  value={suburbCity}
                  onChange={e => setSuburbCity(e.target.value)}
                  placeholder="e.g. Miramar, Wellington, New Zealand"
                  className="w-full h-14 px-5 bg-background border border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowNewProject(false)
                  setProjectName("")
                  setAddress("")
                  setSuburbCity("")
                }}
                className="flex-1 h-14 rounded-2xl text-sm font-medium border border-border hover:bg-secondary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || !address.trim() || !suburbCity.trim() || creating}
                className="flex-1 h-14 rounded-2xl text-sm font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all"
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
