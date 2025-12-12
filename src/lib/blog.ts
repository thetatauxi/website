export type BlogPost = {
  slug: string
  title: string
  date: string
  description: string
  excerpt: string
  image: string
  content: string
  category?: string
}

const mockPosts: BlogPost[] = [
  {
    slug: "annual-gala-2024",
    title: "Annual Brotherhood Gala 2024",
    date: "2024-03-15",
    description:
      "Celebrating excellence and brotherhood at our annual gala event with distinguished alumni and industry leaders.",
    excerpt:
      "Celebrating excellence and brotherhood at our annual gala event with distinguished alumni and industry leaders.",
    image: "/formal-gala-event-with-people-in-suits.jpg",
    content: "Our annual gala brought together brothers past and present...",
    category: "Events",
  },
  {
    slug: "networking-workshop",
    title: "Professional Networking Workshop",
    date: "2024-02-28",
    description:
      "Learn essential networking skills from industry professionals and successful alumni in this hands-on workshop.",
    excerpt:
      "Learn essential networking skills from industry professionals and successful alumni in this hands-on workshop.",
    image: "/group-of-diverse-engineering-students.jpg",
    content: "This workshop focused on developing professional networking skills...",
    category: "Professional Development",
  },
  {
    slug: "community-service-day",
    title: "Community Service Day",
    date: "2024-02-10",
    description:
      "Brothers came together to give back to our community through various service projects and volunteer initiatives.",
    excerpt:
      "Brothers came together to give back to our community through various service projects and volunteer initiatives.",
    image: "/community-volunteers.png",
    content: "Our brothers dedicated their time to making a difference...",
    category: "Community",
  },
]

export async function getSortedPostsData(): Promise<BlogPost[]> {
  // Return mock data sorted by date (newest first)
  return [...mockPosts].sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export async function getPostData(slug: string): Promise<BlogPost> {
  const post = mockPosts.find((p) => p.slug === slug)
  if (!post) {
    throw new Error(`Post with slug "${slug}" not found`)
  }
  return post
}

export function getAllPostSlugs() {
  return mockPosts.map((post) => {
    return {
      params: {
        slug: post.slug,
      },
    }
  })
}
