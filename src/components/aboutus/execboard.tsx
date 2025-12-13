'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import Image from 'next/image'

const isPlaceholderImage = (src?: string) => {
  if (!src) return true
  return src === '/placeholder.svg' || src.endsWith('/TT.webp')
}

const executives = [
  { name: 'Paulina Castaneda', position: 'Regent', image: '/spring25_headshots/PaulinaC.webp' },
  { name: 'Annie Zhao', position: 'Vice Regent', image: '/spring25_headshots/AnnieZ.webp' },
  { name: 'Sydney Magee', position: 'Corresponding Secretary', image: '/spring25_headshots/SydneyM.webp' },
  { name: 'Ella Barsness', position: 'Scribe', image: '/spring25_headshots/EllaB.webp' },
  { name: 'Elizabeth Risgaard', position: 'Treasurer', image: '/spring25_headshots/ElizabethR.webp' },
  { name: 'Aadya Ganjigunta', position: 'Treasurer', image: '/spring25_headshots/AadyaG.webp' },
  { name: 'Bryan Heaton', position: 'Marshall', image: '/spring25_headshots/TT.webp' },
  { name: 'Kate Breisemeister', position: 'Marshall', image: '/spring25_headshots/KateB.webp' },
  { name: 'Alex Haas', position: 'Rush Chair', image: '/spring25_headshots/AlexH.webp' },
  { name: 'Fiona Dragan', position: 'Rush Chair', image: '/spring25_headshots/FionaD.webp' },
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
            <h2 className="text-5xl font-bold text-red-900 mb-4">Our Executive Board</h2>
            <div className="w-24 h-1 bg-linear-to-r from-red-600 to-red-800 mx-auto rounded-full"></div>
          </div>

          {/* Regent + Vice Regent */}
          <div className="mb-20 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Regent */}
              <div className="flex justify-center">
                <div className="relative group w-full max-w-md">
                  <div className="absolute -inset-1 bg-linear-to-r from-red-600 to-red-800 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-2xl h-full">
                    <div className="text-center">
                      <div className="relative mb-6">
                        <div className="absolute -inset-2 bg-linear-to-r from-red-600 to-red-800 rounded-full opacity-20"></div>
                        {isPlaceholderImage(regent.image) ? (
                          <div className="relative w-[300px] aspect-4/3 mx-auto rounded-xl bg-white/70 border-4 border-white shadow-xl overflow-hidden">
                            <Image
                              src={regent.image || "/placeholder.svg"}
                              alt={regent.name}
                              fill
                              className="object-contain p-2"
                              sizes="300px"
                            />
                          </div>
                        ) : (
                          <div className="relative w-[320px] h-[220px] mx-auto rounded-full border-4 border-white shadow-xl overflow-hidden">
                            <Image
                              src={regent.image || "/placeholder.svg"}
                              alt={regent.name}
                              fill
                              className="object-cover"
                              sizes="320px"
                            />
                          </div>
                        )}
                      </div>
                      <h3 className="text-3xl font-bold text-red-900 mb-2">{regent.name}</h3>
                      <p className="text-xl text-red-700 font-semibold">{regent.position}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vice Regent */}
              <div className="flex justify-center">
                <div className="relative group w-full max-w-md">
                  <div className="absolute -inset-1 bg-linear-to-r from-red-600 to-red-800 rounded-3xl blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-2xl h-full">
                    <div className="text-center">
                      <div className="relative mb-6">
                        <div className="absolute -inset-2 bg-linear-to-r from-red-600 to-red-800 rounded-full opacity-15"></div>
                        {isPlaceholderImage(viceRegent.image) ? (
                          <div className="relative w-[300px] aspect-4/3 mx-auto rounded-xl bg-white/70 border-4 border-white shadow-xl overflow-hidden">
                            <Image
                              src={viceRegent.image || "/placeholder.svg"}
                              alt={viceRegent.name}
                              fill
                              className="object-contain p-2"
                              sizes="300px"
                            />
                          </div>
                        ) : (
                          <div className="relative w-[320px] h-[220px] mx-auto rounded-full border-4 border-white shadow-xl overflow-hidden">
                            <Image
                              src={viceRegent.image || "/placeholder.svg"}
                              alt={viceRegent.name}
                              fill
                              className="object-cover"
                              sizes="320px"
                            />
                          </div>
                        )}
                      </div>
                      <h3 className="text-3xl font-bold text-red-900 mb-2">{viceRegent.name}</h3>
                      <p className="text-xl text-red-700 font-semibold">{viceRegent.position}</p>
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
                  <div className="absolute -inset-1 bg-linear-to-r from-red-400 to-red-600 rounded-2xl blur opacity-0 group-hover:opacity-25 transition duration-500"></div>
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                    <div className="text-center">
                      <div className="relative mb-4 inline-block">
                        {isPlaceholderImage(exec.image) ? (
                          <div className="relative w-[220px] h-[220px] mx-auto rounded-xl bg-white/70 border-[3px] border-red-200 shadow-lg overflow-hidden group-hover:border-red-400 transition-colors duration-300 flex items-center justify-center">
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
                          <div className="relative w-[220px] h-[220px] mx-auto rounded-full border-[3px] border-red-200 shadow-lg overflow-hidden group-hover:border-red-400 transition-colors duration-300">
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
                      <h3 className="text-2xl font-bold text-red-900 mb-2">{exec.name}</h3>
                      <p className="text-lg text-red-700">{exec.position}</p>
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