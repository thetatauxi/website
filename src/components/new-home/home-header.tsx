"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link";


export function HomeHeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-gradient-to-b from-white to-[#FFF5D7]">
      {/* Interactive gradient background */}
      <div
        className="absolute inset-0 opacity-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(212, 175, 55, 0.15), transparent)`,
        }}
      />

      {/* Animated geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
        <div
          className="absolute top-40 right-20 w-3 h-3 border border-[#8B0000] rotate-45 animate-spin-slow"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-40 left-1/4 w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#8B0000] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div
            className={`space-y-8 transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-sm text-[#D4AF37]">Since 1904</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight text-balance">
                Theta{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B0000] to-[#D4AF37]">
                  Tau
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground text-pretty leading-relaxed">
                Join a premier professional engineering fraternity dedicated to excellence, innovation, and lifelong
                brotherhood.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/about">
                <Button
                 size="lg"
                className="text-lg h-14 px-8 bg-[#8B0000] hover:bg-[#A52A2A] text-white group"
                >
                Learn More
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/rush">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg h-14 px-8 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
                >
                  Rush!
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="group cursor-pointer">
                <div className="text-3xl font-bold text-[#D4AF37] group-hover:scale-110 transition-transform">90+</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
              <div className="h-12 w-px bg-[#D4AF37]/30" />
              <div className="group cursor-pointer">
                <div className="text-3xl font-bold text-[#D4AF37] group-hover:scale-110 transition-transform">120</div>
                <div className="text-sm text-muted-foreground">Years of Legacy</div>
              </div>
              <div className="h-12 w-px bg-[#D4AF37]/30" />
              <div className="group cursor-pointer">
                <div className="text-3xl font-bold text-[#D4AF37] group-hover:scale-110 transition-transform">500+</div>
                <div className="text-sm text-muted-foreground">Alumni Network</div>
              </div>
            </div>
          </div>
          <div className="relative h-[500px] rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 border-2 border-[#D4AF37]/30 rounded-2xl group-hover:border-[#D4AF37] transition-colors z-10" />
            <img
              src="/leadershipretreat2025.png"
              alt="Theta Tau members"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0  from-background via-transparent to-transparent opacity-60" />
          </div>
        </div>
      </div>
    </section>
  )
}
