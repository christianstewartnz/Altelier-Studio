"use client"

import { Suspense, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"

function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [company, setCompany] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTrialSignup = searchParams.get("trial") === "true"
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Stamp the trial flag on the auto-created profile row. The profile
    // insert trigger fires on auth.users insert, so the row exists by the
    // time signUp resolves. We still guard on data.user?.id because email
    // confirmation flows can in theory return a null user.
    if (data.user?.id) {
      const profileUpdate: Record<string, unknown> = {}
      if (isTrialSignup) profileUpdate.is_free_trial = true
      if (company.trim()) profileUpdate.company = company.trim()

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", data.user.id)

        if (profileError) {
          console.error("Failed to update profile:", profileError)
        }
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left panel */}
        <div className="bg-ink text-paper grain-texture md:w-1/2 flex flex-col items-start justify-between px-10 py-12 md:px-16 md:py-20 md:sticky md:top-0 md:h-screen">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl md:text-3xl tracking-tight">{APP_NAME}</span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-stone-light font-medium">{APP_SUBTITLE}</span>
          </div>
          <div className="hidden md:block">
            <p className="font-serif text-4xl lg:text-5xl xl:text-6xl tracking-tight text-balance leading-[1.1] mb-6">
              Your brand starts here.
            </p>
            <div className="divider-editorial" />
          </div>
          <div className="hidden md:block" />
        </div>

        {/* Right — success message */}
        <div className="bg-cream md:w-1/2 flex flex-col justify-center px-10 py-16 md:px-16 md:py-20">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-foreground mb-3">
              Check your email
            </h1>
            <p className="field-label text-stone mb-10">
              Confirmation sent
            </p>
            <p className="text-base text-stone leading-relaxed mb-8">
              We&apos;ve sent a confirmation link to{" "}
              <span className="text-foreground font-medium">{email}</span>.
              Click the link to activate your account.
            </p>
            <a
              href="/login"
              className="text-sm text-foreground underline underline-offset-4 hover:text-ink transition-colors"
            >
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left — brand panel */}
      <div className="bg-ink text-paper grain-texture md:w-1/2 flex flex-col items-start justify-between px-10 py-12 md:px-16 md:py-20 md:sticky md:top-0 md:h-screen">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl md:text-3xl tracking-tight">{APP_NAME}</span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-light font-medium">{APP_SUBTITLE}</span>
        </div>
        <div className="hidden md:block">
          <p className="font-serif text-4xl lg:text-5xl xl:text-6xl tracking-tight text-balance leading-[1.1] mb-6">
            Your brand starts here.
          </p>
          <div className="divider-editorial" />
        </div>
        <div className="hidden md:block" />
      </div>

      {/* Right — form panel */}
      <div className="bg-cream md:w-1/2 flex flex-col justify-center px-10 py-16 md:px-16 md:py-20">
        <div className="w-full max-w-sm mx-auto">

          {/* Heading */}
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-foreground mb-3">
            Create your account
          </h1>
          <p className="field-label text-stone mb-10">
            Start creating brand concepts today
          </p>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-8">
            <div className="space-y-2">
              <label className="field-label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="field-label">Company <span className="text-stone font-normal normal-case">(optional)</span></label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Your company or studio"
                className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="field-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="field-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-terracotta transition-colors"
              />
              <p className="text-xs text-stone mt-1">Minimum 8 characters</p>
            </div>

            {error && (
              <p className="text-sm text-terracotta">{error}</p>
            )}

            {/* Terms checkbox */}
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => setAgreedToTerms(!agreedToTerms)}
            >
              <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                agreedToTerms ? "border-ink bg-ink" : "border-border"
              }`}>
                {agreedToTerms && (
                  <svg className="w-3 h-3 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-stone leading-relaxed">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  onClick={e => e.stopPropagation()}
                  className="text-foreground underline underline-offset-4 hover:text-ink transition-colors"
                >
                  Terms of Service
                </a>
                {" "}and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  onClick={e => e.stopPropagation()}
                  className="text-foreground underline underline-offset-4 hover:text-ink transition-colors"
                >
                  Privacy Policy
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full h-14 text-base font-medium bg-ink text-paper hover:bg-ink-light disabled:opacity-40 transition-all duration-200"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Login link */}
          <p className="text-sm text-stone mt-8">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-foreground underline underline-offset-4 hover:text-ink transition-colors"
            >
              Sign in
            </a>
          </p>

        </div>
      </div>
    </div>
  )
}

// useSearchParams() requires a Suspense boundary at the page level
// in the Next.js app router; without it the page fails to prerender.
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}
