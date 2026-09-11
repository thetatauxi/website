'use client'

import { useRef } from 'react'
import Image from 'next/image'

const isPlaceholderImage = (src?: string) => {
  if (!src) return true
  return src === '/placeholder.svg' || src.endsWith('/TT.webp')
}

const executives = [
  { name: 'Elizabeth Risgaard', position: 'Regent', image: '/exec/fall26_headshots/Elizabeth.jpg' },
  { name: 'Ella	Barsness', position: 'Vice Regent', image: '/exec/fall26_headshots/Ella.jpg' },
  { name: 'Kellie Mueller', position: 'Corresponding Secretary', image: '/exec/fall26_headshots/Kellie.jpg' },
  { name: 'Annika Chudy', position: 'Scribe', image: '/exec/fall26_headshots/Annika.jpg' },
  { name: 'Finley Moss', position: 'Treasurer', image: '/exec/fall26_headshots/Finley.jpg' },
  { name: 'Annie Zhao', position: 'Elder', image: '/exec/fall26_headshots/Annie.jpg' },
  { name: 'Ben Bossman', position: 'Marshall', image: '/exec/fall26_headshots/Ben.jpg' },
  { name: 'Violet Urdahl', position: 'Marshall', image: '/exec/fall26_headshots/Violet.jpg' },
  { name: 'Julia Hyman', position: 'Rush Chair', image: '/exec/fall26_headshots/Julia.jpg' },
  { name: 'Philip Gu', position: 'Rush Chair', image: '/exec/fall26_headshots/Philip.jpg' },
]

const regent = executives[0]
const viceRegent = executives[1]
const otherExecutives = executives.slice(2)

export function ExecBoard() {
  const executivesRef = useRef<HTMLElement>(null)
  return (
    <div className="container mx-auto px-4 pb-16">
      {/* Executive Board Section */}
      <section ref={executivesRef} className="mt-16 mb-32">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-red-900 dark:text-red-400 mb-4">Our Executive Board</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full"></div>
        </div>

        {/* Regent + Vice Regent */}
        <div className="mb-20 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Regent */}
            <div className="flex justify-center">
              <div className="relative group w-full max-w-md">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-800 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl h-full transition-colors duration-200">
                  <div className="text-center">
                    <div className="relative mb-6">
                      {isPlaceholderImage(regent.image) ? (
                        <div className="relative w-[300px] aspect-4/3 mx-auto rounded-full bg-white/70 dark:bg-zinc-800 border-[3px] border-red-200 dark:border-red-900/60 shadow-lg overflow-hidden group-hover:border-red-400 transition-colors duration-300">
                          <Image
                            src={regent.image || "/placeholder.svg"}
                            alt={regent.name}
                            fill
                            className="object-cover"
                            sizes="300px"
                          />
                        </div>
                      ) : (
                        <div className="relative w-[220px] h-[220px] mx-auto rounded-full border-[3px] border-red-200 dark:border-red-900/60 shadow-lg overflow-hidden group-hover:border-red-400 transition-colors duration-300">
                          <Image
                            src={regent.image || "/placeholder.svg"}
                            alt={regent.name}
                            fill
                            className="object-cover"
                            sizes="300px"
                          />
                        </div>
                      )}
                    </div>
                    <h3 className="text-3xl font-bold text-red-900 dark:text-red-400 mb-2">{regent.name}</h3>
                    <p className="text-xl text-red-700 dark:text-red-300 font-semibold">{regent.position}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vice Regent */}
            <div className="flex justify-center">
              <div className="relative group w-full max-w-md">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-800 rounded-3xl blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl h-full transition-colors duration-200">
                  <div className="text-center">
                    <div className=" mb-6">
                      {isPlaceholderImage(viceRegent.image) ? (
                        <div className="relative w-[300] aspect-4/3 mx-auto rounded-full border-[3px] border-red-200 dark:border-red-900/60 shadow-lg overflow-hidden group-hover:border-red-400 transition-colors duration-300">
                          <Image
                            src={viceRegent.image || "/placeholder.svg"}
                            alt={viceRegent.name}
                            fill
                            className="object-cover"
                            sizes="220px"
                          />
                        </div>
                      ) : (
                        <div className="relative w-[220px] h-[220px] mx-auto rounded-full border-[3px] border-red-200 dark:border-red-900/60 shadow-lg overflow-hidden group-hover:border-red-400 transition-colors duration-300">
                          <Image
                            src={viceRegent.image || "/placeholder.svg"}
                            alt={viceRegent.name}
                            fill
                            className="object-cover"
                            sizes="220px"
                          />
                        </div>
                      )}
                    </div>
                    <h3 className="text-3xl font-bold text-red-900 dark:text-red-400 mb-2">{viceRegent.name}</h3>
                    <p className="text-xl text-red-700 dark:text-red-300 font-semibold">{viceRegent.position}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Executives - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {otherExecutives.map((exec) => (
            <div key={exec.name} className="group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-red-600 rounded-2xl blur opacity-0 group-hover:opacity-25 transition duration-500"></div>
                <div className="relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  <div className="text-center">
                    <div className="relative mb-4 inline-block">
                      {isPlaceholderImage(exec.image) ? (
                        <div className="relative w-[220px] h-[220px] mx-auto rounded-xl bg-white/70 dark:bg-zinc-800 border-[3px] border-red-200 dark:border-red-900/60 shadow-lg overflow-hidden group-hover:border-red-400 transition-colors duration-300 flex items-center justify-center">
                          <div className="relative w-full aspect-4/3 max-w-[200px]">
                            <Image
                              src={exec.image || "/placeholder.svg"}
                              alt={exec.name}
                              fill
                              className="object-contain"
                              sizes="200px"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-[220px] h-[220px] mx-auto rounded-full border-[3px] border-red-200 dark:border-red-900/60 shadow-lg overflow-hidden group-hover:border-red-400 transition-colors duration-300">
                          <Image
                            src={exec.image || "/placeholder.svg"}
                            alt={exec.name}
                            fill
                            className="object-cover"
                            sizes="220px"
                          />
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-red-900 dark:text-red-400 mb-2">{exec.name}</h3>
                    <p className="text-lg text-red-700 dark:text-red-300">{exec.position}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
