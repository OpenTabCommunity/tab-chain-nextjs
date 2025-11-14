"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ParticleBackground } from "@/components/particle-background"
import { Trophy, RotateCcw, Home } from "lucide-react"

type EndSessionResponse = {
  final_score: number
  best_score: number
  [key: string]: any
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
  const [bestScore, setBestScore] = useState<number>(
    Number.parseInt(localStorage.getItem("bestScore") || "0"),
  )
  const [showConfetti, setShowConfetti] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // API base — change or set NEXT_PUBLIC_API_BASE
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://server_ip"

  useEffect(() => {
    // animate confetti briefly
    setShowConfetti(true)
    const confettiTimer = setTimeout(() => setShowConfetti(false), 3000)

    // Try to end session on mount if we have a cached session id
    ;(async function endSessionIfNeeded() {
      const sessionId = localStorage.getItem("play_session_id")
      if (!sessionId) {
        // no cached session -> use query param final score and exit
        startCountUp(finalScore)
        // update best score from localStorage (already in state)
        if (finalScore > bestScore) {
          localStorage.setItem("bestScore", finalScore.toString())
          setBestScore(finalScore)
        }
        return
      }

      setIsEnding(true)
      setErrorMsg(null)

      // try to extract token if present (best-effort)
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

      const END_ENDPOINT = `${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/end`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (token) headers.Authorization = `Bearer ${token}`

        const res = await fetch(END_ENDPOINT, {
          method: "POST",
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (res.status === 401) {
          // unauthorized: force re-login (optional) and surface an error
          localStorage.removeItem("currentUser")
          setErrorMsg("Session end unauthorized. Please login again.")
          setIsEnding(false)
          router.push("/auth")
          return
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          console.error("Failed to end session:", res.status, text)
          setErrorMsg("Server error while closing session. Try again later.")
          setIsEnding(false)
          // fall back to query param values
          startCountUp(finalScore)
          return
        }

        const data: EndSessionResponse = await res.json()

        // Expecting final_score and best_score in response
        const serverFinal = Number(data.final_score ?? initialFinalFromQuery)
        const serverBest = Number(data.best_score ?? localStorage.getItem("bestScore") ?? 0)

        // update UI and storage
        setFinalScore(serverFinal)
        setBestScore(serverBest)
        localStorage.setItem("bestScore", String(serverBest))

        // remove cached session id (close session on client)
        localStorage.removeItem("play_session_id")

        // animate count-up using serverFinal
        startCountUp(serverFinal)
      } catch (err: any) {
        console.error("Network / fetch error (end session):", err)
        if (err.name === "AbortError") {
          setErrorMsg("Request to close session timed out.")
        } else {
          setErrorMsg("Network error while closing session.")
        }
        // Do not remove session_id on failure — user can retry later if you implement retry logic
        startCountUp(finalScore) // fallback to query param
      } finally {
        try {
          clearTimeout(timeout)
        } catch {}
        setIsEnding(false)
      }
    })()

    return () => clearTimeout(confettiTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  // when finalScore changes we want to animate the count-up; startCountUp also used inside effect
  useEffect(() => {
    // If finalScore was set earlier (before endSession), animate once.
    // If endSession sets finalScore and called startCountUp already, this effect won't double-run because startCountUp sets displayScore directly.
    // But keep this as safety — animate if displayScore is still 0.
    if (displayScore === 0 && finalScore > 0 && !isEnding) {
      startCountUp(finalScore)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalScore])

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
                {displayScore}
              </div>
            </div>

            {finalScore > bestScore && (
              <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-xl mb-4 animate-bounce">
                <Trophy className="w-6 h-6" />
                New Best Score!
              </div>
            )}

            {bestScore > 0 && finalScore !== bestScore && (
              <div className="text-cyan-300 font-bold text-lg">Best Score: {bestScore}</div>
            )}
          </Card>

          {/* Error message about ending session (if any) */}
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
              disabled={isEnding}
              className="h-16 px-8 text-xl font-bold rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105 neon-button"
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

