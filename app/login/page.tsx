"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [panelExpanded, setPanelExpanded] = useState(false)
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
      const isDesktop = window.innerWidth >= 768
      if (isDesktop) {
        setTimeout(() => {
          setAnimating(true)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setPanelExpanded(true))
          })
          setTimeout(() => {
            window.location.href = "/"
          }, 520)
        }, 600)
      } else {
        router.push("/")
        router.refresh()
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Closing animation overlay -- expands espresso panel across full viewport */}
      {animating && (
        <div
          className="fixed top-0 left-0 h-screen bg-[#12263A] z-50"
          style={{
            width: panelExpanded ? '100vw' : '50vw',
            transition: 'width 500ms ease-in-out',
          }}
        />
      )}

      {/* Left -- brand panel (desktop) / header (mobile) */}
      <div className="relative text-[#FEFFEF] md:w-1/2 flex flex-col items-start justify-between px-10 py-12 md:px-16 md:py-20 md:sticky md:top-0 md:h-screen overflow-hidden">
        {/* Background photograph */}
        <img
          src="/images/auth-building.avif"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[75%_0%]"
        />
        {/* Deep space blue overlay */}
        <div className="absolute inset-0" style={{ backgroundColor: '#12263A', opacity: 0.6 }} />

        {/* Wordmark */}
        <Logo reversed height={120} className="relative z-10" />

        {/* Editorial line -- hidden on mobile */}
        <div className="hidden md:block relative z-10">
          <p className="font-serif text-4xl lg:text-5xl xl:text-6xl tracking-tight text-balance leading-[1.1] mb-6">
            Where property brands begin.
          </p>
          <div className="divider-editorial" />
        </div>

        {/* Bottom spacer -- desktop only */}
        <div className="hidden md:block relative z-10" />
      </div>

      {/* Right -- form panel */}
      <div className="bg-[#FAF9F7] md:w-1/2 flex flex-col justify-center px-10 py-16 md:px-16 md:py-20">
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
                className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-[#B5281C] transition-colors"
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
                className="w-full h-14 px-0 bg-transparent border-0 border-b-2 border-border text-base placeholder:text-stone-light focus:outline-none focus:border-[#B5281C] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-[#B5281C]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-base font-medium bg-[#14110F] text-paper hover:bg-[#14110F]-light disabled:opacity-40 transition-all duration-200"
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
