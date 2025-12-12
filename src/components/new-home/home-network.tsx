"use client"

import Image from "next/image"
import { useState } from "react"

export function HomeOurNetwork() {
  const [isPaused, setIsPaused] = useState(false)

  // Ensure equal number of logos per row (8 logos per row)
  const totalLogos = companyLogos.length
  const logosPerRow = 8
  const numberOfRows = Math.ceil(totalLogos / logosPerRow)

  // Fill remaining slots with duplicates from the start to ensure equal rows
  const paddedLogos = [...companyLogos]
  while (paddedLogos.length < numberOfRows * logosPerRow) {
    paddedLogos.push(companyLogos[paddedLogos.length % companyLogos.length])
  }

  // Split into equal rows
  const rows = Array.from({ length: numberOfRows }, (_, i) => paddedLogos.slice(i * logosPerRow, (i + 1) * logosPerRow))

  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-white">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-5xl font-bold text-left mb-8 text-black">Our Alumni Network</h2>
        <p className="text-xl text-left text-black mb-24 max-w-3xl leading-relaxed">
          Theta Tau alumni are making significant contributions at leading technology and engineering companies
          worldwide. Explore our extensive network:
        </p>

        <div className="relative">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="mb-12"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div
                className={`inline-flex logo-track ${isPaused ? "paused" : ""}`}
                style={{
                  width: "fit-content",
                  whiteSpace: "nowrap",
                }}
              >
                {/* Original set */}
                {row.map((logo, index) => (
                  <div
                    key={index}
                    className="w-[200px] h-[100px] flex items-center justify-center flex-shrink-0 mx-8 transition-all duration-300 hover:scale-110 hover:brightness-150"
                  >
                    <div className="relative w-[200px] h-[100px] transition-opacity duration-300">
                      <Image
                        src={logo.src || "/placeholder.svg"}
                        alt={logo.alt}
                        fill
                        className="object-contain filter brightness-200"
                        sizes="200px"
                      />
                    </div>
                  </div>
                ))}
                {/* Duplicate set for seamless loop */}
                {row.map((logo, index) => (
                  <div
                    key={`duplicate-${index}`}
                    className="w-[200px] h-[100px] flex items-center justify-center flex-shrink-0 mx-8 transition-all duration-300 hover:scale-110 hover:brightness-150 hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                  >
                    <div className="relative w-[200px] h-[100px] transition-opacity duration-300">
                      <Image
                        src={logo.src || "/placeholder.svg"}
                        alt={logo.alt}
                        fill
                        className="object-contain filter brightness-200"
                        sizes="200px"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const companyLogos = [
  { src: "/logos/Google-Logo.wine.svg", alt: "Google Logo" },
  { src: "/logos/Tesla,_Inc.-Logo.wine.svg", alt: "Tesla Logo" },
  { src: "/logos/Amazon_(company)-Logo.wine.svg", alt: "Amazon Logo" },
  { src: "/logos/Meta_Platforms-Logo.wine.svg", alt: "Meta Logo" },
  { src: "/logos/The_Walt_Disney_Company-Logo.wine.svg", alt: "Walt Disney Logo" },
  { src: "/logos/McKinsey_&_Company-Logo.wine.svg", alt: "McKinsey Logo" },
  { src: "/logos/Lockheed_Martin-Logo.wine.svg", alt: "Lockheed Martin Logo" },
  { src: "/logos/ExxonMobil-Logo.wine.svg", alt: "ExxonMobil Logo" },
  { src: "/logos/Snapchat-Logo.wine.svg", alt: "Snapchat Logo" },
  { src: "/logos/Honda-Logo.wine.svg", alt: "Honda Logo" },
  { src: "/logos/Capital_One-Logo.wine.svg", alt: "Capital One Logo" },
  { src: "/logos/Moderna_logo.svg", alt: "Moderna Logo" },
  { src: "/logos/Marathon_Petroleum-Logo.wine.svg", alt: "Marathon Petroleum Logo" },
  { src: "/logos/Boston_Scientific_Logo.svg", alt: "Boston Scientific Logo" },
  { src: "/logos/Cargill-Logo.wine.svg", alt: "Cargill Logo" },
  { src: "/logos/scm.jpg", alt: "Stevens Capital Management Logo" },
  { src: "/logos/burns-and-mcdonnell-logo-vector.svg", alt: "Burns and McDonnell Logo" },
  { src: "/logos/GE_HealthCare_logo_2023.svg", alt: "GE Healthcare Logo" },
  { src: "/logos/Siemens-logo.svg", alt: "Siemens Logo" },
  { src: "/logos/Rivian_logo_and_wordmark.svg", alt: "Rivian Logo" },
  { src: "/logos/BP-Logo.wine.svg", alt: "BP Logo" },
  { src: "/logos/PepsiCo-Logo.wine.svg", alt: "PepsiCo Logo" },
  { src: "/logos/Tokyo_Electron-Logo.wine.svg", alt: "Tokyo Electron Logo" },
  { src: "/logos/Johnson_&_Johnson-Logo.wine.svg", alt: "Johnson & Johnson Logo" },
  { src: "/logos/Expedia-Logo.wine.svg", alt: "Expedia Logo" },
  { src: "/logos/Milwaukee_Logo.svg", alt: "Milwaukee Tool Logo" },
  { src: "/logos/Rockwell_Automation_logo_(2019).svg", alt: "Rockwell Automation Logo" },
  { src: "/logos/Eaton_Corporation_logo.svg.png", alt: "Eaton Corporation Logo" },
  { src: "/logos/Sub-Zero_(logo).svg", alt: "Sub-Zero Logo" },
  { src: "/logos/Honeywell-Logo.wine.svg", alt: "Honeywell Logo" },
  { src: "/logos/Epic_Systems.svg", alt: "Epic Systems Logo" },
]
