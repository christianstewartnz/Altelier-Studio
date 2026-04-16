import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("x-fungies-signature") || 
                    headersList.get("x-signature") || 
                    headersList.get("signature") || ""

  // Verify webhook signature
  const webhookSecret = process.env.FUNGIES_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("FUNGIES_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }

  // Parse the event
  let event: any
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Handle payment success event
  if (event.type === "order.paid" || 
      event.type === "payment.succeeded" || 
      event.type === "order.completed") {
    
    const supabase = await createClient()
    
    // Extract metadata from the event
    // Fungies passes custom metadata we send when creating the checkout session
    const metadata = event.data?.metadata || event.metadata || {}
    const conceptId = metadata.concept_id
    const userId = metadata.user_id
    const projectId = metadata.project_id
    const paymentId = event.data?.id || event.id

    if (!conceptId || !userId) {
      console.error("Missing metadata in webhook:", metadata)
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
    }

    // Insert export record to unlock download
    const { error } = await supabase
      .from("exports")
      .upsert({
        concept_id: conceptId,
        user_id: userId,
        payment_id: paymentId,
        downloaded_at: null,
        file_url: null
      }, {
        onConflict: "concept_id"
      })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    console.log(`Export unlocked for concept ${conceptId}`)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}