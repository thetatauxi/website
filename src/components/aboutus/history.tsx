'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import Image from 'next/image'

const historyImages = [
    '/rush_fall25_thouse.jpg?height=400&width=600',
    '/electionscandid.JPG?height=400&width=600',
    '/execpic.JPG?height=400&width=600',
    '/IMG_6621.jpg?height=400&width=600'
  ]

  function ImageCarousel({ images, name }: { images: string[], name: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="relative overflow-hidden rounded-lg shadow-md w-full">
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)`, width: `${images.length * 25}%` }}
      >
        {images.map((src, index) => (
          <div key={index} className="w-full flex-shrink-0">
            <Image
              src={src}
              alt={`${name} Image ${index + 1}`}
              width={600}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}



  export function OurHistory() {
    const historyRef = useRef<HTMLElement>(null)

    return (
        <section ref={historyRef} className="mb-16">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-red-900 mb-4">Our History</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full"></div>
          </div>
<div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 p-8">
                <ImageCarousel images={historyImages} name="Theta Tau History" />
              </div>
              <div className="lg:w-1/2 p-8 lg:p-12">
                <div className="h-full flex flex-col justify-center">
                  <h3 className="text-3xl font-bold text-red-900 mb-6">Since 1904</h3>
                  <div className="space-y-6 text-gray-700 leading-relaxed">
                    <p>
                      Theta Tau is the oldest and largest co-ed professional engineering fraternity in the United States. Since its founding at the University of Minnesota in 1904, we have shaped the engineering profession by fostering brotherhood among engineering students and professionals. Theta Tau was founded at the University of Minnesota by Erich J. Schrader, Elwin L. Vinal, William M. Lewis, and Isaac B. Hanks.
                    </p>
                    <p>
                      Our organization emphasizes professional development, academic excellence, personal integrity, and a strong sense of fraternal brotherhood. Through our three pillars of professional development, service, and brotherhood, we cultivate leaders who make lasting impacts in their communities and the engineering field.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    )
}