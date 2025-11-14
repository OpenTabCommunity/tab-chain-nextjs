"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ParticleBackground } from "@/components/particle-background"
import { Trophy, RotateCcw, Home } from "lucide-react"

export default function GameOver() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [displayScore, setDisplayScore] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const finalScore = Number.parseInt(searchParams.get("score") || "0")
  const quote = searchParams.get("quote") || "Better luck next time!"
  const bestScore = Number.parseInt(localStorage.getItem("bestScore") || "0")

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)

    // Animate score count-up
    let current = 0
    const increment = finalScore / 50
    const timer = setInterval(() => {
      current += increment
      if (current >= finalScore) {
        setDisplayScore(finalScore)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(current))
      }
    }, 20)

    // Update best score if needed
    if (finalScore > bestScore) {
      localStorage.setItem("bestScore", finalScore.toString())
    }

    return () => clearInterval(timer)
  }, [finalScore, bestScore])

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
            <h1 className="text-6xl md:text-8xl font-black mb-4 text-balance neon-text animate-pulse-glow">
              Game Over!
            </h1>
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

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handlePlayAgain}
              size="lg"
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
