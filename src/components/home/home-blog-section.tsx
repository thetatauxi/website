import Link from 'next/link';
import { getSortedPostsData } from '@/lib/blog';
import { BlogPostsGrid } from '../ui/blog-posts-grid';

export async function HomeBlogSection() {
    const allPosts = await getSortedPostsData();
    // Get the latest 3 posts
    const recentPosts = allPosts.slice(0, 3);

    return (
        <section className="bg-white container max-w-7xl mx-auto py-32">
            {/* Header with Blog title and View all link */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-5xl font-bold text-gray-900">Blog</h2>
                <Link
                    href="/blog"
                    className="text-xl text-gray-600 hover:text-gray-900 transition-colors duration-200 border-b border-transparent hover:border-gray-900"
                >
                    View all articles
                </Link>
            </div>

            <p className="text-xl text-gray-600 mb-16">
                Stay updated with our latest news, events, and stories!
            </p>

            <BlogPostsGrid
                posts={recentPosts}
                columns={3}
                showArrow={true}
                fixedHeight={true}
            />
        </section>
    );
}
