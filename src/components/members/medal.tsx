'use client'

import React, { useState, useRef } from 'react'

interface MedalProps {
  earned: boolean;
  name: string;
  children: React.ReactNode;
  showLabel?: boolean;
}

export function Medal({ earned, name, children, showLabel = true }: MedalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!earned || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    
    // Calculate rotation angles (max 15 degrees of tilt)
    const rx = -(y / (rect.height / 2)) * 15
    const ry = (x / (rect.width / 2)) * 15
    
    // Calculate glare position in percentage
    const gx = ((e.clientX - rect.left) / rect.width) * 100
    const gy = ((e.clientY - rect.top) / rect.height) * 100
    
    setRotateX(rx)
    setRotateY(ry)
    setGlare({ x: gx, y: gy, opacity: 0.45 })
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setGlare((prev) => ({ ...prev, opacity: 0 }))
  }

  return (
    <div 
      className="flex flex-col items-center justify-center relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        handleMouseLeave()
      }}
    >
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`relative rounded-full select-none flex items-center justify-center transition-all duration-150 ease-out ${
          earned 
            ? 'w-32 h-32 sm:w-36 sm:h-36 cursor-pointer shadow-md hover:shadow-2xl hover:scale-105 border-4 border-red-800 dark:border-red-900 bg-gradient-to-br from-yellow-250 via-amber-400 to-amber-600 text-red-950' 
            : 'w-22 h-22 sm:w-26 sm:h-26 opacity-30 grayscale blur-[0.2px] border-2 border-dashed border-gray-400 bg-gray-100 dark:bg-gray-800 text-gray-400'
        }`}
        style={{
          transform: earned && isHovered
            ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
            : 'none',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow behind the earned medal */}
        {earned && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600/20 to-amber-500/20 blur-md -z-10 transition-opacity opacity-0 hover:opacity-100" />
        )}
        
        {/* Medal Inner Content */}
        <div 
          className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            transform: 'translateZ(10px)',
          }}
        >
          <div 
            className="w-full h-full flex items-center justify-center p-1 [&_img]:w-full [&_img]:h-full [&_img]:object-contain"
            style={{
              mixBlendMode: 'screen',
              filter: earned 
                ? 'sepia(1) saturate(4.5) hue-rotate(325deg) brightness(0.35) contrast(1.5)'
                : 'brightness(0.6) contrast(1)',
            }}
          >
            {children}
          </div>
          
          {/* Holographic / Shiny Glare Overlay */}
          {earned && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-200"
              style={{
                background: `radial-gradient(circle 60px at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 80%)`,
                opacity: glare.opacity,
                mixBlendMode: 'overlay',
              }}
            />
          )}
        </div>
      </div>
      
      {/* Dynamic Tooltip on Hover */}
      {isHovered && (
        <div className="absolute top-[105%] left-1/2 -translate-x-1/2 z-30 bg-gray-900/90 dark:bg-gray-100/95 text-white dark:text-gray-900 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap transition-opacity duration-150">
          {name}
        </div>
      )}

      {showLabel && !isHovered && (
        <span className={`mt-2 text-xs font-semibold tracking-wide uppercase ${earned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
          {name}
        </span>
      )}
    </div>
  )
}

export function BrotherhoodIcon() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="84" stroke="currentColor" strokeWidth="2" />
      
      {/* Theta Tau */}
      <text x="100" y="46" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="bold" fill="currentColor">ΘT</text>
      
      {/* Campfire */}
      {/* Logs */}
      <line x1="85" y1="125" x2="115" y2="125" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="88" y1="120" x2="108" y2="130" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="112" y1="120" x2="92" y2="130" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* Flame */}
      <path d="M 100,75 C 93,87 88,95 88,105 C 88,113 93,119 100,119 C 107,119 112,113 112,105 C 112,95 107,87 100,75 Z" fill="currentColor" />
      
      {/* Left Person */}
      <circle cx="62" cy="90" r="8" stroke="currentColor" strokeWidth="2.5" />
      <path d="M 62,98 L 57,112 L 69,122" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 57,112 L 46,110 L 57,125" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 60,103 L 78,103 L 88,95" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="78" y1="103" x2="88" y2="95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="89" cy="94" r="3" fill="currentColor" />

      {/* Right Person */}
      <circle cx="138" cy="90" r="8" stroke="currentColor" strokeWidth="2.5" />
      <path d="M 138,98 L 143,112 L 131,122" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 143,112 L 154,110 L 143,125" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 140,103 L 122,103 L 112,95" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="122" y1="103" x2="112" y2="95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="111" cy="94" r="3" fill="currentColor" />

      {/* Curved Text Path */}
      <path id="bhood-path" d="M 35,130 A 72,72 0 0 0 165,130" fill="none" />
      <text fill="currentColor" fontSize="14" fontWeight="bold" fontFamily="Georgia, serif">
        <textPath href="#bhood-path" startOffset="50%" textAnchor="middle">
          Brotherhood
        </textPath>
      </text>
    </svg>
  );
}

export function PDIcon() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="84" stroke="currentColor" strokeWidth="2" />
      
      {/* Theta Tau */}
      <text x="100" y="46" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="bold" fill="currentColor">ΘT</text>
      
      {/* Large Star */}
      <path d="M 100,60 L 112,90 L 143,92 L 119,113 L 128,145 L 100,128 L 72,145 L 81,113 L 57,92 L 88,90 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      
      {/* Person inside the star */}
      <circle cx="100" cy="98" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="M 88,118 C 88,108 112,108 112,118" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Left Star */}
      <path d="M 60,63 L 63,70 L 70,71 L 65,76 L 67,83 L 60,79 L 53,83 L 55,76 L 50,71 L 57,70 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Right Star */}
      <path d="M 140,63 L 143,70 L 150,71 L 145,76 L 147,83 L 140,79 L 133,83 L 135,76 L 130,71 L 137,70 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />

      {/* P and D */}
      <text x="50" y="140" textAnchor="middle" fontFamily="Georgia, serif" fontSize="24" fontWeight="bold" fill="currentColor">P</text>
      <text x="150" y="140" textAnchor="middle" fontFamily="Georgia, serif" fontSize="24" fontWeight="bold" fill="currentColor">D</text>
    </svg>
  );
}

export function CommunityServiceIcon() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="84" stroke="currentColor" strokeWidth="2" />
      
      {/* Theta Tau */}
      <text x="100" y="46" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="bold" fill="currentColor">ΘT</text>
      
      {/* Hands and People */}
      {/* Left Hand */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 82,145 C 65,145 55,130 52,118 C 50,105 53,95 56,92 C 59,89 62,91 63,95 C 67,105 70,118 70,123" />
        <path d="M 67,103 L 64,83 C 63,78 68,74 72,78 L 78,100" />
        <path d="M 76,90 L 75,70 C 74,65 80,62 83,66 L 87,95" />
        <path d="M 85,85 L 86,66 C 86,61 92,58 95,62 L 97,95" />

        {/* Right Hand (Mirrored) */}
        <path d="M 118,145 C 135,145 145,130 148,118 C 150,105 147,95 144,92 C 141,89 138,91 137,95 C 133,105 130,118 130,123" />
        <path d="M 133,103 L 136,83 C 137,78 132,74 128,78 L 122,100" />
        <path d="M 124,90 L 125,70 C 126,65 120,62 117,66 L 113,95" />
        <path d="M 115,85 L 114,66 C 114,61 108,58 105,62 L 103,95" />

        {/* Bottom connection of hands */}
        <path d="M 82,145 L 118,145" strokeWidth="3" />
      </g>

      {/* Three People */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {/* Center Person */}
        <circle cx="100" cy="80" r="7" />
        <path d="M 88,105 C 88,95 112,95 112,105" />
        
        {/* Left Person */}
        <circle cx="82" cy="88" r="5" />
        <path d="M 74,107 C 74,100 90,100 90,107" />
        
        {/* Right Person */}
        <circle cx="118" cy="88" r="5" />
        <path d="M 110,107 C 110,100 126,100 126,107" />
      </g>

      {/* Curved Text Path */}
      <path id="cs-path" d="M 32,130 A 72,72 0 0 0 168,130" fill="none" />
      <text fill="currentColor" fontSize="11" fontWeight="bold" fontFamily="Georgia, serif">
        <textPath href="#cs-path" startOffset="50%" textAnchor="middle">
          Community Service
        </textPath>
      </text>
    </svg>
  );
}
