import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAllPostSlugs, getPostData } from "@/lib/blog"


export async function generateStaticParams() {
  const paths = getAllPostSlugs()
  return paths.map((path) => ({
    slug: path.params.slug,
  }))
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug)

  const PostContent = (await import(`@/content/blog/${params.slug}.mdx`)).default

  return (
    <article className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 pt-8 pb-16 max-w-5xl">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors duration-200 mb-12 group"
          >
            <ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="font-medium">Back to Blog</span>
          </Link>

          {/* Post Header */}
          <div className="mb-8">
            <p className="text-accent text-sm font-medium uppercase tracking-wider mb-4">{post.date}</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed text-pretty">{post.description}</p>
          </div>

          {/* Featured Image */}
          <div className="relative h-[300px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg">
            <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto prose prose-lg max-w-none">
          <PostContent />
        </div>
      </div>
    </article>
  )
}
