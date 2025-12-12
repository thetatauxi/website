'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import Image from 'next/image'

const pillars = [
    { title: 'Community Service', description: 'Members of Theta Tau make an impact on the world around them through service and philanthropic acts.', icon: "🤝" },
    { title: 'Professionalism', description: 'Members of Theta Tau are more prepared for the job market, networking, and applying their learning in their work.', icon: "💼", },
    { title: 'Brotherhood', description: 'Members of Theta Tau have made friendships and connections that they will maintain for the rest of their lives.', icon: "👥" },
  ]

  export function Pillars() { 
    const pillarsRef = useRef<HTMLElement>(null)

    return (
        <section ref={pillarsRef} className="mb-16">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-red-900 mb-4">Our Pillars</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
              The three foundational principles that guide every member of Theta Tau
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => (
              <div key={index} className="group">
                <div className="relative h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-red-600 rounded-2xl blur opacity-0 group-hover:opacity-25 transition duration-500"></div>
                  <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">{pillar.icon}</div>
                      <h3 className="text-2xl font-bold text-red-900 mb-4">{pillar.title}</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
              {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {pillars.map((pillar, index) => (
                  <div 
                    key={index} 
                    className="bg-red-50 p-6 rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
                  >
                    <h3 className="font-semibold mb-3 text-xl text-red-700">{pillar.title}</h3>
                    <p className="text-black-600">{pillar.description}</p>
                  </div>
                ))}
              </div> */}
            </section>
    )
}