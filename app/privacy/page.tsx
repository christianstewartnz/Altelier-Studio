import { APP_NAME } from "@/lib/config"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 
      backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex flex-col">
              <span className="font-serif text-xl tracking-tight 
              text-foreground">{APP_NAME}</span>
              <span className="text-[10px] tracking-[0.25em] uppercase 
              text-muted-foreground ml-6 -mt-0.5">Studio</span>
            </Link>
            <Link 
              href="/dashboard"
              className="text-sm text-muted-foreground 
              hover:text-foreground transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl text-foreground 
        tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: April 2026
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 
        text-foreground">

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              1. What We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              When you use Atelier Studio we collect:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>—</span>
                <span>Account information: your name and email 
                address</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Project information: project names, addresses, 
                and brief inputs you provide</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Generated content: the brand concepts created 
                for your projects</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Payment information: processed by Lemon Squeezy 
                — we do not store card details</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Usage data: how you interact with the 
                service</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use your information to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>—</span>
                <span>Provide and improve the Atelier Studio 
                service</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Save your projects and generated concepts</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Send transactional emails (account 
                confirmation, password reset, receipts)</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Respond to support requests</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              3. Data Storage
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using Supabase, a hosted 
              database service. Data may be stored on servers located 
              outside New Zealand, including in the United States and 
              Australia. By using the service you consent to this.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              4. Third Party Services
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use the following third party services:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>—</span>
                <span>Supabase — database and authentication</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Anthropic — AI generation (your brief inputs 
                are sent to Anthropic's API to generate brand 
                concepts)</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Lemon Squeezy — payment processing</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Vercel — hosting</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Resend — transactional email</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              5. Your Rights Under the NZ Privacy Act 2020
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>—</span>
                <span>Access the personal information we hold 
                about you</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Request correction of inaccurate 
                information</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Request deletion of your account and data</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>To exercise these rights contact 
                hello@atelierstudio.app</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              6. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is 
              active. If you delete your account we will remove your 
              personal information within 30 days, except where 
              retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              7. Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session 
              management. We do not use advertising or tracking 
              cookies.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              8. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. We will 
              notify you by email of material changes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              9. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy enquiries contact 
              hello@atelierstudio.app
            </p>
          </section>

        </div>
      </main>
    </div>
  )
}
