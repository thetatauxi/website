import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAllPostSlugs, getPostData } from "@/lib/blog"
import { MDXRemote } from "next-mdx-remote/rsc"

export async function generateStaticParams() {
  const paths = getAllPostSlugs()
  return paths.map((path) => ({
    slug: path.params.slug,
  }))
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug)

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-red-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back to Blog</span>
        </Link>

        {/* Post Header */}
        <header className="mb-12">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-4">{post.date}</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
              {post.description}
            </p>
          )}
        </header>

        {/* Featured Image */}
        {post.image && (
          <div className="relative w-full h-[300px] md:h-[500px] rounded-xl overflow-hidden shadow-lg mb-12">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article Content */}
        <article className="max-w-3xl mx-auto">
          <div className="prose prose-lg prose-slate max-w-none 
            prose-headings:font-bold prose-headings:text-gray-900 
            prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-12
            prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10
            prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:text-gray-700 prose-ul:my-6
            prose-li:text-gray-700 prose-li:my-2
            prose-a:text-red-800 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
            prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
            blog-content">
            <MDXRemote source={post.content} />
          </div>
        </article>
      </div>
    </div>
  )
}
