import Link from "next/link"
import Image from "next/image"
import type { BlogPost } from "@/lib/blog"
import { ArrowRight } from "lucide-react"

interface BlogPostsGridProps {
  posts: BlogPost[]
  columns?: 2 | 3 | 4
  showArrow?: boolean
  fixedHeight?: boolean
}

export function BlogPostsGrid({ posts, columns = 3, showArrow = false, fixedHeight = false }: BlogPostsGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-8`}>
      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="group relative block overflow-hidden rounded-lg border-2 border-[#8B0000]/20 bg-gradient-to-br from-white/80 to-[#FFF5D7]/50 backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/20 hover:-translate-y-1"
        >
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8B0000]/5 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {post.image && (
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={post.image || "/placeholder.svg"}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {post.category && (
                <div className="absolute top-4 left-4 bg-[#8B0000]/90 backdrop-blur-sm text-[#D4AF37] text-xs font-semibold px-3 py-1 rounded-full border border-[#D4AF37]/30">
                  {post.category}
                </div>
              )}
            </div>
          )}
          <div className={`p-6 relative z-10 ${fixedHeight ? "h-52" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <time className="text-sm text-muted-foreground">{post.date}</time>
              {showArrow && (
                <ArrowRight className="w-5 h-5 text-[#8B0000] group-hover:text-[#D4AF37] transition-all duration-300 group-hover:translate-x-1" />
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-[#8B0000] transition-colors duration-300">
              {post.title}
            </h3>
            <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
