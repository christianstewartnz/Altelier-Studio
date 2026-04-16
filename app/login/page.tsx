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
          Welcome back
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Sign in to your account
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
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
              className="w-full h-14 px-5 bg-card border border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all duration-200 mt-4"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <a 
            href="/signup" 
            className="text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Sign up
          </a>
        </p>

      </div>
    </div>
  )
}
