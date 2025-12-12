import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { type BlogPost } from '@/lib/blog';

interface FeaturedBlogPostProps {
    post: BlogPost;
}

export function FeaturedBlogPost({ post}: FeaturedBlogPostProps) {
    return (
        <div className="bg-gray-100 rounded-lg overflow-hidden shadow-lg mb-12 relative max-w-5xl mx-auto">
            <Link href={`/blog/${post.slug}`} className="absolute top-6 right-10">
                <div className="flex items-center rounded-full border-2 border-gray-600 transition duration-200 ease-in-out hover:border-red-800 hover:translate-x-1">
                    <div className="h-12 w-12 flex items-center justify-center bg-white rounded-full transition duration-200 ease-in-out hover:bg-red-100 hover:text-red-800">
                        <ArrowRight className="h-7 w-7" />
                    </div>
                </div>
            </Link>
            <div className="flex flex-col md:flex-row min-h-[400px]">
                <div className="md:w-1/2 h-[400px]">
                    <Image
                        src={post.image}
                        alt={`Featured image for ${post.title}`}
                        width={400}
                        height={400}
                        className="w-full h-[400px] object-cover"
                    />
                </div>
                <div className="md:w-1/2 p-6 pt-32 flex flex-col justify-end">
                    <p className="text-gray-600 mb-2">{post.date}</p>
                    <Link
                        href={`/blog/${post.slug}`}
                        className="text-3xl font-bold mb-4 transition hover:text-red-800 hover:underline decoration-red-800"
                    >
                        {post.title}
                    </Link>
                    <p className="mb-4">{post.description}</p>
                </div>
            </div>
        </div>
    );
}
