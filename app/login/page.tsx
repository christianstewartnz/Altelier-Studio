"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { APP_NAME, APP_SUBTITLE } from "@/lib/config"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left — espresso brand panel (desktop) / header (mobile) */}
      <div className="bg-ink text-paper grain-texture md:w-1/2 flex flex-col items-start justify-between px-10 py-12 md:px-16 md:py-20 md:sticky md:top-0 md:h-screen">
        {/* Wordmark */}
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl md:text-3xl tracking-tight">{APP_NAME}</span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-light font-medium">{APP_SUBTITLE}</span>
        </div>

        {/* Editorial line — hidden on mobile */}
        <div className="hidden md:block">
          <p className="font-serif text-4xl lg:text-5xl xl:text-6xl tracking-tight text-balance leading-[1.1] mb-6">
            Where property brands begin.
          </p>
          <div className="divider-editorial" />
        </div>

        {/* Bottom spacer — desktop only */}
        <div className="hidden md:block" />
      </div>

      {/* Right — form panel */}
      <div className="bg-cream md:w-1/2 flex flex-col justify-center px-10 py-16 md:px-16 md:py-20">
        <div className="w-full max-w-sm mx-auto">

          {/* Heading */}
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-foreground mb-3">
            Welcome back
          </h1>
          <p className="field-label text-stone mb-10">
            Sign in to your account
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-8">
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
                className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-terracotta">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-base font-medium bg-ink text-paper hover:bg-ink-light disabled:opacity-40 transition-all duration-200"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-sm text-stone mt-8">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-foreground underline underline-offset-4 hover:text-ink transition-colors"
            >
              Sign up
            </a>
          </p>

        </div>
      </div>
    </div>
  )
}
