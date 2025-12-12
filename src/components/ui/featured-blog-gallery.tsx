"use client"

import Image from "next/image"
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { BlogPost } from "@/lib/types"
import { useState, useEffect } from "react"

interface FeaturedBlogGalleryProps {
  posts: BlogPost[]
}

export function FeaturedBlogGallery({ posts }: FeaturedBlogGalleryProps) {
  const featuredPosts = posts.slice(0, 3)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused || featuredPosts.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredPosts.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused, featuredPosts.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredPosts.length)
  }

  const currentPost = featuredPosts[currentIndex]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        {/* Carousel container */}
        <div className="relative overflow-hidden rounded-2xl">
          <Link href={`/blog/${currentPost.slug}`} className="group block">
            <article className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
              {/* Image Section */}
              <div className="relative h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden">
                <Image
                  src={currentPost.image || "/placeholder.svg"}
                  alt={`Featured image for ${currentPost.title}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />

                {/* Featured badge */}
                <div className="absolute top-6 left-6 z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/90 backdrop-blur-sm text-accent-foreground text-sm font-semibold">
                    Featured
                  </div>
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
                  <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-4">{currentPost.date}</p>

                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2 text-balance">
                    {currentPost.title}
                  </h2>

                  <p className="text-white/90 text-lg leading-relaxed text-pretty max-w-3xl mb-6">
                    {currentPost.description}
                  </p>

                  {/* Read More Link */}
                  <div className="inline-flex items-center gap-2 text-white font-medium text-base group/link">
                    <span className="group-hover/link:underline">Read article</span>
                    <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </div>
              </div>
            </article>
          </Link>

          {/* Navigation buttons */}
          {featuredPosts.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* Navigation dots */}
        {featuredPosts.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {featuredPosts.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-8 bg-accent" : "w-2 bg-border hover:bg-accent/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
