import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  // Verify the requesting user is an admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const service = createServiceClient()

  // Fetch all auth users for emails
  const { data: authData, error: authError } = await service.auth.admin.listUsers({ perPage: 1000 })
  if (authError) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await service
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (profilesError) {
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
  }

  // Fetch all projects
  const { data: projects, error: projectsError } = await service
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (projectsError) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }

  // Fetch all concepts
  const { data: concepts, error: conceptsError } = await service
    .from("concepts")
    .select("*")
    .order("created_at", { ascending: false })

  if (conceptsError) {
    return NextResponse.json({ error: "Failed to fetch concepts" }, { status: 500 })
  }

  // Build a map of auth user email + metadata by id
  const authMap = new Map(
    authData.users.map((u) => [
      u.id,
      {
        email: u.email ?? "",
        full_name: (u.user_metadata?.full_name as string) ?? "",
      },
    ])
  )

  // Group concepts by project_id
  const conceptsByProject = new Map<string, typeof concepts>()
  for (const concept of concepts ?? []) {
    const existing = conceptsByProject.get(concept.project_id) ?? []
    existing.push(concept)
    conceptsByProject.set(concept.project_id, existing)
  }

  // Group projects by user_id, attaching concepts
  const projectsByUser = new Map<string, typeof projects>()
  for (const project of projects ?? []) {
    const existing = projectsByUser.get(project.user_id) ?? []
    existing.push({
      ...project,
      concepts: conceptsByProject.get(project.id) ?? [],
    })
    projectsByUser.set(project.user_id, existing)
  }

  // Merge profiles with auth data and projects
  const users = (profiles ?? []).map((profile) => {
    const auth = authMap.get(profile.id) ?? { email: "", full_name: "" }
    return {
      ...profile,
      email: auth.email,
      full_name: auth.full_name,
      projects: projectsByUser.get(profile.id) ?? [],
    }
  })

  return NextResponse.json({ users })
}
