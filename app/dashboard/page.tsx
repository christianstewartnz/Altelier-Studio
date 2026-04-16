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
          id,
          project_name,
          address,
          status,
          created_at,
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
    if (!projectName.trim() || !address.trim()) return
    setCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        project_name: projectName.trim(),
        address: address.trim(),
        status: "draft"
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      setCreating(false)
      return
    }

    router.push(`/project/${project.id}`)
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
              {projects.length > 0 && (
                <button
                  onClick={() => setShowNewProject(true)}
                  className="flex items-center gap-2 h-10 px-4 rounded-full border border-border text-sm text-foreground hover:bg-secondary transition-all"
                >
                  <Plus className="size-4" />
                  New Project
                </button>
              )}
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

      <main className="mx-auto max-w-6xl px-6 py-16">

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-4">
              Welcome to Atelier Studio
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mb-12 leading-relaxed">
              Create your first project to start generating brand concepts.
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="h-16 px-12 rounded-2xl text-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-all duration-200"
            >
              Create Your First Project
            </button>
          </div>
        )}

        {/* Projects grid */}
        {projects.length > 0 && (
          <div>
            <h1 className="font-serif text-3xl text-foreground tracking-tight mb-10">
              Your Projects
            </h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="bg-card border border-border rounded-3xl p-6 flex flex-col gap-4"
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
                      {project.address}
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
                      Continue
                    </button>
                  )}
                  {project.status === "draft" && (
                    <button
                      onClick={() => router.push(`/project/${project.id}`)}
                      className="w-full h-12 rounded-2xl text-sm font-medium border border-border hover:bg-secondary transition-all"
                    >
                      Generate Brand Concept
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
                  Project Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 1 Manuka Street, Miramar, Wellington"
                  className="w-full h-14 px-5 bg-background border border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the full street address including suburb and city
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowNewProject(false)
                  setProjectName("")
                  setAddress("")
                }}
                className="flex-1 h-14 rounded-2xl text-sm font-medium border border-border hover:bg-secondary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || !address.trim() || creating}
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
