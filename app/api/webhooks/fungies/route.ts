// Fungies webhook handler v2
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.text()

    if (!process.env.FUNGIES_WEBHOOK_SECRET) {
      console.error("FUNGIES_WEBHOOK_SECRET not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    let event: any
    try {
      event = JSON.parse(body)
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    console.log("Fungies webhook received:", event.type)

    if (event.type === "payment_success") {
      // Custom fields are set on the Fungies product and pre-filled via checkout URL params
      const customFields = event.data?.items?.[0]?.customFields ?? {}
      const conceptId = customFields.concept_id
      const userId = customFields.user_id
      const projectId = customFields.project_id
      const paymentId = event.data?.payment?.id || event.data?.order?.id

      if (!conceptId || !userId) {
        console.error("Missing custom fields in webhook payload:", customFields)
        return NextResponse.json({ error: "Missing required custom fields" }, { status: 400 })
      }

      const supabase = getServiceClient()

      const { error } = await supabase
        .from("exports")
        .upsert(
          {
            concept_id: conceptId,
            user_id: userId,
            project_id: projectId,
            payment_id: paymentId,
          },
          { onConflict: "concept_id" }
        )

      if (error) {
        console.error("Supabase upsert error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      console.log(`Export unlocked — concept: ${conceptId}, user: ${userId}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error("Unhandled webhook error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}