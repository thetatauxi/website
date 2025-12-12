'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import Image from 'next/image'

const xiChapterImages = [
    '/exec_fall25.png?height=400&width=600',
    '/elections.JPG?height=400&width=600',
    '/advisor_dinner.jpg?height=400&width=600',
    '/ike+katie_banquet.jpeg?height=400&width=600',
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
        style={{ transform: `translateX(-${currentIndex * 100}%)`, width: `${images.length*25}%` }}
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


export function XiChapter() {
    const xiChapterRef = useRef<HTMLElement>(null)

    const scrollToSection = useCallback((ref: React.RefObject<HTMLElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth' })
      }, [])

      return (
        <section ref={xiChapterRef} className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-red-900 mb-4">Xi Chapter</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full"></div>
          </div>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 p-8 lg:p-12">
                <div className="h-full flex flex-col justify-center">
                  <h3 className="text-3xl font-bold text-red-900 mb-6">A Century of Excellence</h3>
                  <div className="space-y-6 text-gray-700 leading-relaxed">
                    <p>
                      The Xi Chapter of Theta Tau was founded at the University of Wisconsin-Madison on January 13, 1923. For over a century, our chapter has been a cornerstone of engineering excellence and professional development on campus.
                    </p>
                    <p>
                      Throughout our history, Xi Chapter has produced numerous distinguished alumni who have made significant contributions to the field of engineering and beyond. Our members have gone on to become industry leaders, innovators, and educators.
                    </p>
                    <p>
                      Today, Xi Chapter continues to uphold the values and traditions of Theta Tau while adapting to the ever-changing landscape of engineering. We are committed to fostering a diverse and inclusive community of future engineers who will shape the world of tomorrow.
                    </p>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 p-4">
                <ImageCarousel images={xiChapterImages} name="Xi Chapter" />
              </div>
            </div>
          </div>
      </section>
      )
    }
