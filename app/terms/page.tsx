import { APP_NAME } from "@/lib/config"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-ink text-paper grain-texture">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <Link href="/dashboard" className="flex items-baseline gap-2">
            <span className="font-serif text-2xl tracking-tight">{APP_NAME}</span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-stone-light font-medium">Studio</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl text-foreground 
        tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: April 2026
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 
        text-foreground">

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              1. About Atelier Studio
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Atelier Studio is an AI-powered brand concept generation 
              tool for residential property developers and real estate 
              agents. It is operated by Atelier Studio, New Zealand 
              ("we", "us", "our").
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              2. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account and using Atelier Studio you agree 
              to these terms. If you do not agree do not use the service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              3. AI-Generated Content Disclaimer
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Atelier Studio uses artificial intelligence to generate 
              brand concepts including project names, colour palettes, 
              typography, logos and marketing copy. You acknowledge 
              and agree that:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>—</span>
                <span>AI outputs are generated automatically and may 
                vary in quality</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>We do not guarantee that any generated content 
                is unique, original, or free from similarity to 
                existing brands</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Generated content is provided as creative 
                starting points only</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>You are responsible for conducting your own 
                trademark searches and legal due diligence before 
                using any generated name or brand commercially</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>We are not liable for any commercial decisions 
                made based on AI-generated output</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              4. Ownership of Generated Content
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Upon payment and download of your brand package, you own 
              all rights to the exported materials. We retain no 
              ownership over generated brand concepts that you have 
              purchased and downloaded.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              5. Payment and Refunds
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>—</span>
                <span>Each brand package costs $299 NZD</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Payment is processed securely through 
                Lemon Squeezy</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>We want you to be satisfied with your brand 
                package. If you are unhappy with your results please 
                contact us at hello@atelierstudio.app before 
                requesting a chargeback or dispute</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Because our service uses artificial intelligence 
                to generate creative content, results will vary between 
                projects. We cannot guarantee any specific outcome or 
                style of output</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Refunds are assessed on a case by case basis. 
                We will generally offer a regeneration credit where 
                the AI has produced output that is clearly broken, 
                offensive, or unusable</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Cash refunds may be offered at our discretion 
                in exceptional circumstances</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Nothing in these terms limits your rights under 
                the New Zealand Consumer Guarantees Act 1993 or the 
                Fair Trading Act 1986</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              6. Acceptable Use
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>—</span>
                <span>Use the service to generate content intended 
                to deceive, defraud or mislead</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Attempt to reverse engineer, scrape or copy 
                the AI prompts or system</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Share account credentials with others</span>
              </li>
              <li className="flex gap-2">
                <span>—</span>
                <span>Use automated tools to generate concepts 
                at scale</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              7. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by New Zealand law, 
              Atelier Studio and its operators are not liable for any 
              indirect, incidental, or consequential damages arising 
              from your use of the service. Our total liability is 
              limited to the amount you paid for the relevant project.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              8. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. We will 
              notify you by email of material changes. Continued use 
              of the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              9. Governing Law
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of New Zealand.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">
              10. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              hello@atelierstudio.app
            </p>
          </section>

        </div>
      </main>
    </div>
  )
}
