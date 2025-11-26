"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"
import { ParticleBackground } from "@/components/particle-background"

type BackendResponse = {
  accepted: boolean
  score: number
  quote: string
  session_id?: string | null
}

type SessionData = {
  score: number
  session_id: string | null
  chain: string[]
  best_score: number
}

export default function Home() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [chain, setChain] = useState<string[]>(["Rock"])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<string>("")
  const [duplicateError, setDuplicateError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // API base — change to your server IP or set NEXT_PUBLIC_API_BASE in .env
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://91.206.178.230:8000/"
  const PLAY_ENDPOINT = `${API_BASE}/api/play`
  const SESSION_ENDPOINT = `${API_BASE}/api/session/current/`

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) {
      router.push("/auth")
    } else {
      try {
        const parsedUser = JSON.parse(user)
        setCurrentUser(parsedUser)
        // Fetch session data on mount
        fetchSessionData(parsedUser)
      } catch {
        localStorage.removeItem("currentUser")
        router.push("/auth")
      }
    }
  }, [router])

  const extractToken = (userObj: any) => {
    if (!userObj) return null
    return userObj.token || userObj.accessToken || userObj.authToken || null
  }

  const fetchSessionData = async (user: any) => {
    const token = extractToken(user)
    if (!token) {
      router.push("/auth")
      return
    }

    try {
      const res = await fetch(SESSION_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        localStorage.removeItem("currentUser")
        router.push("/auth")
        return
      }

      if (res.ok) {
        const data: SessionData = await res.json()
        setSessionId(data.session_id)
        
        // If there's an existing chain, use it
        if (data.chain && data.chain.length > 0) {
          setChain(data.chain)
        }
      }
    } catch (err) {
      console.error("Failed to fetch session data:", err)
      // Continue with default values if session fetch fails
    }
  }

  const currentQuestion = chain[chain.length - 1]
  const chainLength = chain.length - 1

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUserAnswer(value)

    const isDuplicate = chain.some((answer) => answer.toLowerCase() === value.trim().toLowerCase())

    setDuplicateError(isDuplicate && value.trim() !== "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (duplicateError || !userAnswer.trim() || isSubmitting) {
      return
    }

    const normalizedAnswer = userAnswer.trim()
    const token = extractToken(currentUser)

    if (!token) {
      localStorage.removeItem("currentUser")
      router.push("/auth")
      return
    }

    const payload = {
      move: normalizedAnswer,
      chain: chain,
      session_id: sessionId,
    }

    setIsSubmitting(true)

    // AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 100000) // 10s timeout

    try {
      const res = await fetch(PLAY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (res.status === 401) {
        localStorage.removeItem("currentUser")
        router.push("/auth")
        return
      }

      if (!res.ok) {
        const text = await res.text()
        console.error("Non-OK response from /api/play/:", res.status, text)
        setErrorMsg("Server error. Please try again.")
        return
      }

      const data: BackendResponse = await res.json()

      // Update session_id from response
      if (typeof data.session_id !== "undefined" && data.session_id !== null) {
        setSessionId(data.session_id)
      }

      if (!data.accepted) {
        router.push(`/game-over?score=${data.score}&quote=${encodeURIComponent(data.quote)}`)
        return
      }

      setCurrentQuote(data.quote)
      setChain(prev => [...prev, normalizedAnswer])
      setUserAnswer("")
      setDuplicateError(false)
      setHasSubmitted(true)
      setTimeout(() => setHasSubmitted(false), 2000)
      
    } catch (err: any) {
      console.error("Network / fetch error:", err)
      if (err.name === 'AbortError') {
        setErrorMsg("Request timed out. Please try again.")
      } else {
        setErrorMsg("Network error — request failed. Check your connection and try again.")
      }
    } finally {
      setIsSubmitting(false)
      clearTimeout(timeoutId)
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <ParticleBackground />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] max-w-2xl mx-auto space-y-6 md:space-y-8">
          <header className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-3 text-balance neon-text">
              What Beats {currentQuestion}?
            </h1>
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-purple-900/60 via-pink-900/60 to-cyan-900/60 border-2 border-purple-500/40 rounded-2xl backdrop-blur-sm glow-card">
              <div className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
                Chain: {chainLength}
              </div>
            </div>
          </header>

          {currentQuote && (
            <Card className="w-full p-6 md:p-8 bg-gradient-to-r from-yellow-900/70 via-orange-900/70 to-pink-900/70 border-2 border-yellow-500/60 rounded-2xl backdrop-blur-sm glow-card animate-slide-up shadow-lg shadow-yellow-500/20">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-3xl md:text-4xl">🎭</div>
                <div className="flex-1 text-center md:text-left">
                  <div className="text-lg md:text-2xl text-white font-bold italic leading-relaxed">
                    "{currentQuote}"
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="w-full space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Type your answer..."
                  value={userAnswer}
                  onChange={handleInputChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit(e)
                    }
                  }}
                  disabled={isSubmitting}
                  className="h-16 md:h-20 text-lg md:text-xl bg-black/60 border-2 border-cyan-500/50 text-white placeholder:text-cyan-300/40 rounded-2xl px-6 focus:border-pink-500 focus:ring-pink-500 transition-all duration-300 glow-input disabled:opacity-50"
                />
                {duplicateError && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 font-bold animate-shake">
                    <AlertCircle className="w-5 h-5" />
                    <span>You already used that word!</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                size="lg"
                disabled={duplicateError || !userAnswer.trim() || isSubmitting}
                className="w-full h-14 md:h-16 text-xl md:text-2xl font-bold rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-pink-500/50 transition-all duration-300 neon-button disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:from-pink-500 disabled:hover:via-purple-500 disabled:hover:to-cyan-500"
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </Button>
            </div>

            {hasSubmitted && (
              <div className="text-center text-green-400 font-bold text-lg animate-bounce glow-subtle">
                Answer submitted! Chain continues...
              </div>
            )}

            {errorMsg && <div className="text-center text-yellow-300 font-semibold">{errorMsg}</div>}
          </div>

          {chain.length > 1 && (
            <div className="w-full pt-6">
              <h3 className="text-xl md:text-2xl font-black text-center mb-4 text-cyan-300 glow-subtle">Your Chain</h3>
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                {chain.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 md:gap-3">
                    <Card className="p-3 md:p-4 bg-black/60 border-2 border-cyan-500/30 rounded-xl backdrop-blur-sm hover:border-pink-500/50 transition-all duration-300 answer-card">
                      <div className="text-sm md:text-base font-bold text-white">{item}</div>
                    </Card>
                    {index < chain.length - 1 && <div className="text-xl md:text-2xl text-pink-500 font-black">→</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
