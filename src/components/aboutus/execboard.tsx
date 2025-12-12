'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import Image from 'next/image'

const executives = [
  { name: 'Ike Fritz', position: 'Regent', image: '/exec_fall25_headshots/Ike_regent_headshot.JPG?height=200&width=200' },
  { name: 'Liza Robinson', position: 'Vice Regent', image: '/exec_fall25_headshots/Liza_VR_headshot.JPG?height=100&width=100' },
  { name: 'Ben Levy', position: 'Corresponding Secretary', image:'/exec_fall25_headshots/Ben_CorrSec_headshot.JPG?height=100&width=100' },
  { name: 'Violet Urdahl', position: 'Scribe', image: '/exec_fall25_headshots/Violet_scribe_headshot.jpeg?height=100&width=100' },
  { name: 'Gianna McLeod', position: 'Treasurer', image: '/exec_fall25_headshots/Gianna_treasurer_headshot.jpeg?height=100&width=100'  },
  { name: 'Elizabeth Risgaard', position: 'Treasurer', image: '/exec_fall25_headshots/Elizabeth_treasurer_headshot.JPG?height=100&width=100' },
  { name: 'Lily Anderson', position: 'Marshall', image: '/exec_fall25_headshots/Lily_marshall_headshot.jpeg?height=100&width=100' },
  { name: 'Bennett Kinney', position: 'Marshall', image: '/exec_fall25_headshots/Bennett_marshall_headshot.JPG?height=100&width=100' },
  { name: 'Abby Burger', position: 'Rush Chair', image: '/exec_fall25_headshots/abby_rush_headshot.JPG?height=100&width=100' },
]

const regent = executives[0]
  const otherExecutives = executives.slice(1)

export function ExecBoard() {
    const executivesRef = useRef<HTMLElement>(null)
    return (
       <div className="container mx-auto px-4 pb-16">
        {/* Executive Board Section */}
        <section ref={executivesRef} className="mt-16 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-red-900 mb-4">Our Executive Board</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full"></div>
          </div>

          {/* Regent - Special Layout */}
          <div className="mb-20">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-800 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-md">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-red-800 rounded-full opacity-20"></div>
                      <Image
                        src={regent.image || "/placeholder.svg"}
                        alt={regent.name}
                        width={250}
                        height={250}
                        className="relative rounded-full border-4 border-white shadow-xl"
                      />
                    </div>
                    <h3 className="text-3xl font-bold text-red-900 mb-2">{regent.name}</h3>
                    <p className="text-xl text-red-700 font-semibold">{regent.position}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other Executives - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {otherExecutives.map((exec, index) => (
              <div key={index} className="group">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-red-600 rounded-2xl blur opacity-0 group-hover:opacity-25 transition duration-500"></div>
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                    <div className="text-center">
                      <div className="relative mb-4 inline-block">
                        <Image
                          src={exec.image || "/placeholder.svg"}
                          alt={exec.name}
                          width={300}
                          height={300}
                          className="rounded-full border-3 border-red-200 shadow-lg group-hover:border-red-400 transition-colors duration-300"
                        />
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