"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ParticleBackground } from "@/components/particle-background"
import { Trophy, RotateCcw, Home } from "lucide-react"

type SessionData = {
  score: number
  session_id: string | null
  chain: string[]
  best_score: number
}

export default function GameOver() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // initial values from query params (used if backend call can't be made)
  const initialFinalFromQuery = Number.parseInt(searchParams.get("score") || "0")
  const initialQuote = searchParams.get("quote") || "Better luck next time!"

  // reactive state
  const [displayScore, setDisplayScore] = useState(0)
  const [finalScore, setFinalScore] = useState<number>(initialFinalFromQuery)
  const [quote, setQuote] = useState<string>(initialQuote)
  const [bestScore, setBestScore] = useState<number>(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // API base — change or set NEXT_PUBLIC_API_BASE
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://91.206.178.230:8000"

  useEffect(() => {
    // animate confetti briefly
    setShowConfetti(true)
    const confettiTimer = setTimeout(() => setShowConfetti(false), 3000)

    // Fetch current session data on mount
    ;(async function fetchSessionData() {
      setIsLoading(true)
      setErrorMsg(null)

      // try to extract token
      let token: string | null = null
      try {
        const raw = localStorage.getItem("currentUser")
        if (raw) {
          const parsed = JSON.parse(raw)
          token = parsed.token || parsed.accessToken || parsed.authToken || null
        }
      } catch {
        token = null
      }

      if (!token) {
        // No token, use query params and fallback
        setFinalScore(initialFinalFromQuery)
        setBestScore(Number.parseInt(localStorage.getItem("bestScore") || "0"))
        startCountUp(initialFinalFromQuery)
        setIsLoading(false)
        return
      }

      const SESSION_ENDPOINT = `${API_BASE}/api/session/current/`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }

        const res = await fetch(SESSION_ENDPOINT, {
          method: "GET",
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (res.status === 401) {
          // unauthorized: force re-login
          localStorage.removeItem("currentUser")
          setErrorMsg("Session unauthorized. Please login again.")
          setIsLoading(false)
          router.push("/auth")
          return
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          console.error("Failed to fetch session:", res.status, text)
          setErrorMsg("Server error while fetching session data.")
          // fall back to query param values
          setFinalScore(initialFinalFromQuery)
          setBestScore(Number.parseInt(localStorage.getItem("bestScore") || "0"))
          startCountUp(initialFinalFromQuery)
          setIsLoading(false)
          return
        }

        const data: SessionData = await res.json()

        // The session was already ended by the backend, so we use the score from query params
        // but we get the best_score from the API response
        const serverFinal = initialFinalFromQuery // Use score from query params (already calculated by backend)
        const serverBest = Number(data.best_score ?? 0)

        // update UI and storage
        setFinalScore(serverFinal)
        setBestScore(serverBest)
        localStorage.setItem("bestScore", String(serverBest))

        // animate count-up using serverFinal
        startCountUp(serverFinal)
        
      } catch (err: any) {
        console.error("Network / fetch error (fetch session):", err)
        if (err.name === "AbortError") {
          setErrorMsg("Request to fetch session timed out.")
        } else {
          setErrorMsg("Network error while fetching session.")
        }
        // fallback to query param
        setFinalScore(initialFinalFromQuery)
        setBestScore(Number.parseInt(localStorage.getItem("bestScore") || "0"))
        startCountUp(initialFinalFromQuery)
      } finally {
        try {
          clearTimeout(timeout)
        } catch {}
        setIsLoading(false)
      }
    })()

    return () => clearTimeout(confettiTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  const startCountUp = (target: number) => {
    let current = 0
    const steps = Math.max(30, Math.min(120, target * 2)) // more steps for larger numbers
    const increment = target / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayScore(target)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(current))
      }
    }, 16) // ~60fps
  }

  const handlePlayAgain = () => {
    router.push("/")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <ParticleBackground />

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                backgroundColor: ["#ec4899", "#8b5cf6", "#06b6d4", "#fbbf24"][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full text-center animate-scale-in">
          {/* Game Over Title */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-black mb-4 text-balance neon-text animate-pulse-glow">Game Over!</h1>
            <p className="text-2xl md:text-3xl text-pink-300 font-bold glow-subtle">Your answer wasn't accepted 😅</p>
          </div>

          {/* Quote Display Card */}
          <Card className="p-6 md:p-8 mb-8 bg-gradient-to-r from-yellow-900/60 via-orange-900/60 to-pink-900/60 border-3 border-yellow-500/50 rounded-3xl backdrop-blur-sm glow-card animate-slide-up">
            <div className="flex items-start gap-4 justify-center">
              <div className="text-4xl md:text-5xl">🤭</div>
              <div className="flex-1 text-left max-w-lg">
                <div className="text-sm md:text-base text-yellow-300 font-bold mb-2">What the Backend Said:</div>
                <div className="text-xl md:text-2xl text-white font-bold italic leading-relaxed">"{quote}"</div>
              </div>
            </div>
          </Card>

          {/* Score Card */}
          <Card className="p-8 md:p-12 mb-8 bg-gradient-to-br from-purple-900/60 via-pink-900/60 to-cyan-900/60 border-4 border-pink-500/50 rounded-3xl backdrop-blur-sm glow-card-strong">
            <div className="mb-6">
              <div className="text-lg md:text-xl text-cyan-300 font-bold mb-2">Final Score</div>
              <div className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 animate-pulse-glow">
                {isLoading ? "..." : displayScore}
              </div>
            </div>

            {!isLoading && finalScore > bestScore && (
              <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-xl mb-4 animate-bounce">
                <Trophy className="w-6 h-6" />
                New Best Score!
              </div>
            )}

            {!isLoading && bestScore > 0 && finalScore !== bestScore && (
              <div className="text-cyan-300 font-bold text-lg">Best Score: {bestScore}</div>
            )}
          </Card>

          {/* Error message about fetching session (if any) */}
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-600/10 border-2 border-red-600 rounded-xl text-red-300 text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handlePlayAgain}
              size="lg"
              disabled={isLoading}
              className="h-16 px-8 text-xl font-bold rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105 neon-button disabled:opacity-50"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Play Again
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              size="lg"
              className="h-16 px-8 text-xl font-bold rounded-2xl border-2 border-cyan-500/50 bg-black/60 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            >
              <Home className="w-6 h-6 mr-2" />
              Go to Home
            </Button>
          </div>

          {/* Fun Message */}
          <div className="mt-12 text-lg text-purple-300 font-bold animate-pulse">💥 Better luck next time! 🎮</div>
        </div>
      </div>
    </div>
  )
}
