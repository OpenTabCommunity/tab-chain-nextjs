"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ParticleBackground } from "@/components/particle-background"

type AuthResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
}

export default function AuthPage() {
  const [isLogin] = useState(true) // kept for UI parity - currently Sign Up flow
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // configure your backend base here (or via NEXT_PUBLIC_API_BASE env var)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://91.206.178.230:8000"
  // Change this path if your backend exposes a different login/signup route
  const AUTH_ENDPOINT = `${API_BASE}/api/auth/login`

  useEffect(() => {
    // If already logged in, redirect to app
    const user = localStorage.getItem("currentUser")
    if (user) {
      router.push("/")
    }
  }, [router])

  const validatePhone = (p: string) => {
    // basic international-ish phone validation:
    // starts with + or digit, contains only digits, spaces or dashes, min length 6
    const phoneRegex = /^[+]?[\d\s-]{6,}$/
    return phoneRegex.test(p.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validatePhone(phone)) {
      setError("Please enter a valid phone number")
      return
    }

    const payload = { username : phone.trim() }

    setIsSubmitting(true)

    // timeout with AbortController
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s

    try {
      const res = await fetch(AUTH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (res.status === 401) {
        setError("Unauthorized. Please check the phone number or contact support.")
        setIsSubmitting(false)
        return
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("Auth request failed:", res.status, text)
        setError("Server error during authentication. Try again later.")
        setIsSubmitting(false)
        return
      }

      const data: AuthResponse = await res.json()

      const now = new Date().toISOString()
      const currentUser = {
        phone: phone.trim(),
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? null,
        expires_in: data.expires_in ?? null,
        token: data.access_token, // alias for compatibility with components expecting `token`
        createdAt: now,
        raw: data, // keep raw response if you want
      }

      localStorage.setItem("currentUser", JSON.stringify(currentUser))

      // optionally clear any previously cached session_id for a fresh start:
      // localStorage.removeItem("play_session_id")

      router.push("/")
    } catch (err: any) {
      // FAIL HARD: no offline fallback
      console.error("Network / fetch error (auth):", err)
      if (err.name === "AbortError") {
        setError("Request timed out. Check your network and try again.")
      } else {
        setError("Network error — request failed. Check your connection and try again.")
      }
      setIsSubmitting(false)
    } finally {
      try {
        clearTimeout(timeout)
      } catch {}
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex items-center justify-center">
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black mb-4 text-balance neon-text">What Beats Rock?</h1>
          <p className="text-lg text-cyan-300 text-balance glow-subtle">Join the ultimate chain game</p>
        </div>

        <Card className="p-8 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-cyan-900/40 border-2 border-purple-500/30 rounded-3xl backdrop-blur-sm glow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-cyan-300 font-bold">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 bg-black/60 border-2 border-cyan-500/50 text-white placeholder:text-cyan-300/40 rounded-xl focus:border-pink-500 transition-all duration-300 glow-input"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-300 text-center font-bold">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 text-xl font-bold rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg transition-all duration-300 neon-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : isLogin ? "Login" : "Login"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

