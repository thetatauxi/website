"use client"

import React, { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  alpha: number
  waveOffset: number
  waveSpeed: number
  amplitude: number
}

// Dark Red: #800000 (128, 0, 0)
// Theta Tau Gold: #D4AF37 (212, 175, 55)
function interpolateColor(t: number, alpha: number): string {
  // Clamp t between 0 and 1
  const progress = Math.max(0, Math.min(1, t))
  const r = Math.round(128 + (212 - 128) * progress)
  const g = Math.round(0 + (175 - 0) * progress)
  const b = Math.round(0 + (55 - 0) * progress)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function AuthenticatingScreen() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    // Generate particles
    const particleCount = Math.min(Math.floor((width * height) / 14000), 75)
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 2, // 2px to 4.5px
        vx: Math.random() * 1.2 + 0.8, // Flow to the right
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.35,
        waveOffset: Math.random() * Math.PI * 2,
        waveSpeed: Math.random() * 0.02 + 0.01,
        amplitude: Math.random() * 20 + 10,
      })
    }

    let time = 0

    const render = () => {
      time += 1
      ctx.clearRect(0, 0, width, height)

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Move horizontally
        p.x += p.vx
        // Sinusoidal vertical drift
        const wave = Math.sin(time * p.waveSpeed + p.waveOffset) * 0.4
        p.y += p.vy + wave

        // Wrap around horizontally
        if (p.x > width + 20) {
          p.x = -20
          p.y = Math.random() * height
        }
        // Wrap vertically
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20

        // Calculate gradient progress based on x position across screen (0 = Dark Red, 1 = Gold)
        const progress = Math.max(0, Math.min(1, p.x / width))
        const color = interpolateColor(progress, p.alpha)

        // Draw soft glow
        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2)
        ctx.fillStyle = interpolateColor(progress, p.alpha * 0.25)
        ctx.fill()

        // Draw solid core
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.restore()

        // Optional connecting subtle threads between very close particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 90) {
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            const lineAlpha = (1 - dist / 90) * 0.15
            ctx.strokeStyle = interpolateColor((progress + p2.x / width) / 2, lineAlpha)
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.restore()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Authenticating"
      className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col items-center justify-center overflow-hidden select-none transition-colors duration-200"
    >
      {/* Dynamic Background Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full opacity-80 dark:opacity-100"
      />

      {/* Central Pulsing Authenticating Card */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8 text-center animate-pulse">
        {/* Subtle Theta Tau Shield Emblem */}
        <div className="mb-5 relative flex items-center justify-center">
          <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-red-800/10 via-amber-500/10 to-yellow-500/10 dark:from-red-600/20 dark:via-amber-400/20 dark:to-yellow-400/20 blur-md pointer-events-none" />
          <svg
            className="h-14 w-14 drop-shadow-sm text-[#800000] dark:text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 500 500"
            preserveAspectRatio="xMidYMid meet"
          >
            <g
              transform="translate(0.000000,500.000000) scale(0.100000,-0.100000)"
              fill="currentColor"
              stroke="none"
            >
              <path
                d="M1119 3764 c-247 -44 -471 -158 -642 -327 -179 -176 -289 -388 -343
-662 -25 -126 -25 -414 0 -540 124 -623 588 -1015 1202 -1015 147 0 247 13
363 46 202 59 360 152 507 299 175 174 284 381 341 648 26 118 25 468 0 585
-54 246 -156 447 -308 607 -181 190 -424 318 -683 360 -112 18 -335 18 -437
-1z m379 -140 c84 -17 195 -65 264 -112 146 -101 266 -289 322 -505 53 -203
60 -266 61 -532 0 -221 -3 -263 -23 -362 -28 -141 -62 -245 -115 -353 -57
-116 -186 -247 -302 -307 -139 -72 -209 -88 -370 -88 -126 1 -148 4 -220 28
-121 42 -219 102 -304 187 -88 86 -130 154 -179 283 -160 428 -123 1077 82
1420 163 274 468 406 784 341z"
              />
              <path
                d="M817 2823 c-3 -5 0 -42 5 -83 10 -79 4 -479 -7 -517 -7 -20 -4 -23
23 -23 26 0 32 5 42 36 18 54 96 130 148 144 29 7 138 10 335 8 276 -3 294 -4
332 -24 50 -27 67 -46 100 -111 21 -42 31 -53 51 -53 l24 0 -7 88 c-10 114
-10 344 0 455 l8 87 -25 0 c-20 0 -29 -9 -44 -43 -28 -63 -77 -113 -130 -134
-41 -16 -81 -18 -332 -18 -209 0 -295 3 -322 13 -49 17 -112 82 -135 137 -13
34 -23 45 -40 45 -12 0 -24 -3 -26 -7z"
              />
              <path
                d="M2806 3578 c-3 -90 -7 -230 -8 -313 l-3 -150 45 0 45 0 6 65 c14 135
77 251 173 316 88 60 187 84 381 94 94 5 178 10 188 10 16 0 17 -52 15 -1058
l-3 -1058 -28 -42 c-37 -57 -90 -81 -203 -94 l-94 -11 0 -28 0 -29 520 0 520
0 0 29 0 28 -97 11 c-115 13 -174 44 -207 107 -21 40 -21 47 -24 1093 l-2
1052 142 -5 c174 -8 262 -19 335 -45 163 -57 256 -175 283 -358 5 -37 10 -71
10 -75 0 -5 19 -7 43 -5 l42 3 -3 210 c-1 116 -5 256 -8 313 l-6 102 -1028 0
-1028 0 -6 -162z"
              />
            </g>
          </svg>
        </div>

        {/* Pulsing Authenticating Text */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-gray-900 dark:text-white mb-3">
          Authenticating...
        </h1>

        {/* Dynamic Dark Red to Gold Accent Bar */}
        <div className="w-36 h-1 rounded-full bg-gradient-to-r from-[#800000] via-[#B8860B] to-[#D4AF37] shadow-sm" />
      </div>
    </div>
  )
}
