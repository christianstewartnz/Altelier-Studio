import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conceptId, projectId, checkOnly } = await request.json()

    if (!conceptId || !projectId) {
      return NextResponse.json({ error: "Missing conceptId or projectId" }, { status: 400 })
    }

    // Verify concept belongs to this user
    const { data: concept, error: conceptError } = await supabase
      .from("concepts")
      .select("id, brand_name")
      .eq("id", conceptId)
      .eq("user_id", user.id)
      .single()

    if (conceptError || !concept) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 })
    }

    // Check if already purchased
    const { data: existingExport } = await supabase
      .from("exports")
      .select("id")
      .eq("concept_id", conceptId)
      .maybeSingle()

    if (existingExport) {
      return NextResponse.json({ alreadyPurchased: true })
    }

    // If just checking purchase status, return here
    if (checkOnly) {
      return NextResponse.json({ alreadyPurchased: false })
    }

    // Proceed to overlay checkout
    return NextResponse.json({ proceed: true })

  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
