"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ParticleBackground } from "@/components/particle-background"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")


    const phoneRegex = /^[\d\s\-+$$$$]+$/
    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid phone number")
      return
    }


      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const userExists = users.some((u: any) => u.phone === phone)

      if (userExists) {
        setError("User already exists")
        return
      }

      const newUser = { phone, password, createdAt: new Date().toISOString() }
      users.push(newUser)
      localStorage.setItem("users", JSON.stringify(users))
      localStorage.setItem("currentUser", JSON.stringify(newUser))
      router.push("/")
    
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
              className="w-full h-14 text-xl font-bold rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg transition-all duration-300 neon-button"
            >
              {isLogin ? "Sign Up" : "Sign Up"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
