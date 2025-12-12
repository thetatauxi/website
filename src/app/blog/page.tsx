import { getSortedPostsData } from "@/lib/blog"
import { FeaturedBlogGallery } from "@/components/ui/featured-blog-gallery"
import { BlogPostsGrid } from "@/components/ui/blog-posts-grid"

export default async function Blog() {
  const allPosts = await getSortedPostsData()
  const remainingPosts = allPosts.slice(3)

  return (
    <div className="min-h-screen bg-background">
      <section className="px-4 pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 text-balance">Blog</h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-pretty">
              Read about our events and learn more about what θT has to offer.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8"></h2>
          <FeaturedBlogGallery posts={allPosts} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        <div className="h-px bg-border" />
      </div>

      <section className="px-4 pt-24 md:pt-32 pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">All blog posts</h2>
          <BlogPostsGrid posts={remainingPosts} columns={3} showArrow={false} fixedHeight={false} />
        </div>
      </section>
    </div>
  )
}