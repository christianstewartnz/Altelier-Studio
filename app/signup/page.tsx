"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signUp({
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
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex flex-col items-center mb-12">
            <span className="font-serif text-3xl tracking-tight text-foreground">
              {APP_NAME}
            </span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground ml-6 -mt-0.5">
              {APP_SUBTITLE}
            </span>
          </div>
          <h1 className="font-serif text-3xl text-foreground tracking-tight mb-4">
            Check your email
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            We&apos;ve sent a confirmation link to{" "}
            <span className="text-foreground font-medium">{email}</span>.
            Click the link to activate your account.
          </p>
          <a
            href="/login"
            className="inline-block mt-8 text-sm text-foreground underline underline-offset-4"
          >
            Back to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <span className="font-serif text-3xl tracking-tight text-foreground">
            {APP_NAME}
          </span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground ml-6 -mt-0.5">
            {APP_SUBTITLE}
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-serif text-3xl text-foreground tracking-tight mb-2 text-center">
          Create your account
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Start creating brand concepts today
        </p>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full h-14 px-5 bg-card border border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full h-14 px-5 bg-card border border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full h-14 px-5 bg-card border border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => setAgreedToTerms(!agreedToTerms)}
          >
            <div className={`size-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              agreedToTerms
                ? "border-foreground bg-foreground"
                : "border-border"
            }`}>
              {agreedToTerms && (
                <svg className="size-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                onClick={e => e.stopPropagation()}
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                Terms of Service
              </a>
              {" "}and{" "}
              <a
                href="/privacy"
                target="_blank"
                onClick={e => e.stopPropagation()}
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                Privacy Policy
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full h-14 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all duration-200 mt-4"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Sign in
          </a>
        </p>

      </div>
    </div>
  )
}
