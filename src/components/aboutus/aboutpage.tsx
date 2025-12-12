"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import Image from "next/image"

const executives = [
  { name: "Ryan Hogan", position: "Regent", image: "/exec_headshots/Ryan_hogan.JPG?height=100&width=100" },
  { name: "Bennett Kinney", position: "Vice Regent", image: "/exec_headshots/Bennett_Kinney.JPG?height=100&width=100" },
  { name: "Ben Levy", position: "Corresponding Secretary", image: "/exec_headshots/Ben_Levy.JPG?height=100&width=100" },
  { name: "Kate Briesemeister", position: "Scribe", image: "/exec_headshots/Kate_Briesemeister.jpg?height=100&width=100" },
  { name: "Liam Gaiden", position: "Treasurer", image: "/exec_headshots/Liam_Gaiden.jpg?height=100&width=100" },
  { name: "Gianna McLeod", position: "Treasurer", image: "/exec_headshots/Gianna_McLeod.jpg?height=100&width=100" },
  { name: "Katie Mangus", position: "Marshall", image: "/exec_headshots/Katie_Mangus.JPG?height=100&width=100" },
  { name: "Ike Fritz", position: "Marshall", image: "/placeholder.svg?height=100&width=100" },
]

const pillars = [
  {
    title: "Community Service",
    description:
      "Members of Theta Tau make an impact on the world around them through service and philanthropic acts.",
  },
  {
    title: "Professionalism",
    description:
      "Members of Theta Tau are more prepared for the job market, networking, and applying their learning in their work.",
  },
  {
    title: "Brotherhood",
    description:
      "Members of Theta Tau have made friendships and connections that they will maintain for the rest of their lives.",
  },
]

const xiChapterImages = [
  "/ttbanquet.jpg?height=400&width=600",
  "/elections.jpg?height=400&width=600",
  "/advisor_dinner.jpg?height=400&width=600",
  "/fall24elections.jpg?height=400&width=600",
]

const historyImages = [
  "/banquetpic.jpg?height=400&width=600",
  "/electionscandid.JPG?height=400&width=600",
  "/retreatpic.jpg?height=400&width=600",
  "/banquetpic1.jpg?height=400&width=600",
]

function ImageCarousel({ images, name }: { images: string[]; name: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="relative overflow-hidden rounded-lg shadow-md">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((src, index) => (
          <Image
            key={index}
            src={src}
            alt={`${name} Image ${index + 1}`}
            width={600}
            height={400}
            className="flex-shrink-0"
          />
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  // ✅ CORRECTLY TYPED REFS
  const executivesRef = useRef<HTMLElement | null>(null)
  const xiChapterRef = useRef<HTMLElement | null>(null)
  const pillarsRef = useRef<HTMLElement | null>(null)
  const historyRef = useRef<HTMLElement | null>(null)

  // ✅ CORRECTLY TYPED SCROLL FUNCTION
  const scrollToSection = useCallback(
    (ref: React.RefObject<HTMLElement | null>) => {
      if (!ref.current) return
      ref.current.scrollIntoView({ behavior: "smooth" })
    },
    []
  )

  return (
    <div className="relative min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold mb-8 text-center text-red-800">About Us</h1>

        {/* Navigation */}
        <nav className="mb-12">
          <ul className="flex flex-wrap justify-center gap-4">
            {[
              { ref: executivesRef, text: "Executive Board" },
              { ref: xiChapterRef, text: "Xi Chapter" },
              { ref: pillarsRef, text: "Our Pillars" },
              { ref: historyRef, text: "Our History" },
            ].map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => scrollToSection(item.ref)}
                  className="px-6 py-2 bg-red-50 rounded-full shadow-md text-red-700 hover:bg-red-700 hover:text-white transition-colors duration-300"
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Executive Board */}
        <section ref={executivesRef} className="mb-16">
          <h2 className="text-3xl font-semibold mb-6 text-center text-red-800">Our Executive Board</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {executives.map((exec, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 bg-red-50 rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
              >
                <Image
                  src={exec.image}
                  alt={exec.name}
                  width={100}
                  height={100}
                  className="rounded-full mb-4 border-2 border-red-300"
                />
                <h3 className="font-semibold text-lg text-red-700">{exec.name}</h3>
                <p className="text-sm text-red-600">{exec.position}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Xi Chapter */}
        <section ref={xiChapterRef} className="mb-16">
          <h2 className="text-3xl font-semibold mb-6 text-center text-red-800">Xi Chapter</h2>
          <div className="bg-red-50 p-8 rounded-lg shadow-lg flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              <ImageCarousel images={xiChapterImages} name="Xi Chapter" />
            </div>
            <div className="w-full md:w-2/3 space-y-4 text-black">
              <p>
                The Xi Chapter of Theta Tau was founded at the University of Wisconsin–Madison on May
                15, 1920.
              </p>
              <p>
                Throughout our history, Xi Chapter has produced alumni who have made significant
                contributions to engineering and beyond.
              </p>
              <p>
                Today, Xi Chapter continues to uphold Theta Tau’s values while adapting to the
                evolving engineering landscape.
              </p>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section ref={pillarsRef} className="mb-16">
          <h2 className="text-3xl font-semibold mb-6 text-center text-red-800">Our Pillars</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => (
              <div
                key={index}
                className="bg-red-50 p-6 rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
              >
                <h3 className="font-semibold mb-3 text-xl text-red-700">{pillar.title}</h3>
                <p className="text-black">{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* History */}
        <section ref={historyRef} className="mb-16">
          <h2 className="text-3xl font-semibold mb-6 text-center text-red-800">Our History</h2>
          <div className="bg-red-50 p-8 rounded-lg shadow-lg flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3 space-y-4 text-black">
              <p>
                Theta Tau is the oldest and largest co-ed professional engineering fraternity in the
                United States, founded in 1904.
              </p>
              <p>
                Through our pillars of professional development, service, and brotherhood, we
                cultivate leaders who make lasting impacts.
              </p>
            </div>
            <div className="w-full md:w-1/3">
              <ImageCarousel images={historyImages} name="Theta Tau History" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
