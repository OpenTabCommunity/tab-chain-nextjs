"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from 'lucide-react'
import { ParticleBackground } from "@/components/particle-background"

export default function Home() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [chain, setChain] = useState<string[]>(["Rock"])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<string>("")
  const [duplicateError, setDuplicateError] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) {
      router.push("/auth")
    } else {
      setCurrentUser(JSON.parse(user))
    }
  }, [router])

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

    if (duplicateError || !userAnswer.trim()) {
      return
    }

    const lowercaseAnswer = userAnswer.trim().toLowerCase()
    const normalizedAnswer = userAnswer.trim()

    const mockBackendResponse = simulateBackendResponse(lowercaseAnswer, chainLength)

    if (!mockBackendResponse.accepted) {
      router.push(
        `/game-over?score=${mockBackendResponse.score}&quote=${encodeURIComponent(mockBackendResponse.quote)}`,
      )
      return
    }

    setCurrentQuote(mockBackendResponse.quote)

    setChain([...chain, normalizedAnswer])
    setUserAnswer("")
    setDuplicateError(false)
    setHasSubmitted(true)

    setTimeout(() => setHasSubmitted(false), 2000)
  }

  const simulateBackendResponse = (answer: string, currentScore: number) => {
    const invalidAnswers = ["rock", "nothing", "null", "undefined", ""]
    const isInvalid = invalidAnswers.includes(answer.toLowerCase())

    const randomReject = Math.random() < 0.1

    const funnyQuotes = [
      "Even a pebble dreams of being a boulder!",
      "Nice try, but the universe has other plans!",
      "Creativity +100! Logic... well, let's not talk about that.",
      "That's one way to think outside the box!",
      "The judges are impressed... but not convinced!",
      "Bold move! Unfortunately, physics disagrees.",
      "Your imagination is limitless, but this answer isn't!",
      "So close, yet so far from making sense!",
    ]

    const successQuotes = [
      "Brilliant! The chain grows stronger!",
      "Now that's what I call creative thinking!",
      "Absolutely genius! Keep it going!",
      "Mind. Blown. What a clever answer!",
      "The creativity is off the charts!",
      "That's the spirit! Unstoppable!",
      "Wow! Didn't see that coming!",
      "Pure gold! The chain lives on!",
    ]

    if (isInvalid || randomReject) {
      return {
        accepted: false,
        score: currentScore,
        quote: funnyQuotes[Math.floor(Math.random() * funnyQuotes.length)],
      }
    }

    return {
      accepted: true,
      score: currentScore + 1,
      quote: successQuotes[Math.floor(Math.random() * successQuotes.length)],
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Type your answer..."
                  value={userAnswer}
                  onChange={handleInputChange}
                  className="h-16 md:h-20 text-lg md:text-xl bg-black/60 border-2 border-cyan-500/50 text-white placeholder:text-cyan-300/40 rounded-2xl px-6 focus:border-pink-500 focus:ring-pink-500 transition-all duration-300 glow-input"
                />
                {duplicateError && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 font-bold animate-shake">
                    <AlertCircle className="w-5 h-5" />
                    <span>You already used that word!</span>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={duplicateError || !userAnswer.trim()}
                className="w-full h-14 md:h-16 text-xl md:text-2xl font-bold rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-pink-500/50 transition-all duration-300 neon-button disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:from-pink-500 disabled:hover:via-purple-500 disabled:hover:to-cyan-500"
              >
                Submit Answer
              </Button>
            </form>

            {hasSubmitted && (
              <div className="text-center text-green-400 font-bold text-lg animate-bounce glow-subtle">
                Answer submitted! Chain continues...
              </div>
            )}
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
