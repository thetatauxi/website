import fs from "fs"
import path from "path"
import matter from "gray-matter"

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

const postsDirectory = path.join(process.cwd(), "src/content/blog")

function getExcerpt(content: string, maxLength: number = 200): string {
  // Remove markdown formatting and get plain text
  const plainText = content
    .replace(/[#*`\[\]()]/g, "")
    .replace(/\n+/g, " ")
    .trim()
  
  if (plainText.length <= maxLength) {
    return plainText
  }
  
  return plainText.substring(0, maxLength).trim() + "..."
}

export async function getSortedPostsData(): Promise<BlogPost[]> {
  try {
    const fileNames = fs.readdirSync(postsDirectory)
    const allPostsData = fileNames
      .filter((name) => name.endsWith(".mdx"))
      .map((fileName) => {
        const slug = fileName.replace(/\.mdx$/, "")
        const fullPath = path.join(postsDirectory, fileName)
        const fileContents = fs.readFileSync(fullPath, "utf8")
        const { data, content } = matter(fileContents)

        const excerpt = getExcerpt(content)
        const description = data.description || excerpt

        return {
          slug,
          title: data.title || "Untitled",
          date: data.date || "",
          description,
          excerpt,
          image: data.image || "/placeholder.svg",
          content,
          category: data.category,
        } as BlogPost
      })

    // Sort posts by date (newest first)
    return allPostsData.sort((a, b) => {
      if (a.date < b.date) {
        return 1
      } else {
        return -1
      }
    })
  } catch (error) {
    console.error("Error reading blog posts:", error)
    return []
  }
}

export async function getPostData(slug: string): Promise<BlogPost> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`)
    const fileContents = fs.readFileSync(fullPath, "utf8")
    const { data, content } = matter(fileContents)

    // Remove the first heading if it matches the title
    let processedContent = content
    const title = data.title || "Untitled"
    const titlePattern = new RegExp(`^##?\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm')
    if (titlePattern.test(processedContent)) {
      processedContent = processedContent.replace(titlePattern, '').trim()
    }

    const excerpt = getExcerpt(processedContent)
    const description = data.description || excerpt

    return {
      slug,
      title,
      date: data.date || "",
      description,
      excerpt,
      image: data.image || "/placeholder.svg",
      content: processedContent,
      category: data.category,
    } as BlogPost
  } catch (error) {
    throw new Error(`Post with slug "${slug}" not found`)
  }
}

export function getAllPostSlugs() {
  try {
    const fileNames = fs.readdirSync(postsDirectory)
    return fileNames
      .filter((name) => name.endsWith(".mdx"))
      .map((fileName) => {
        const slug = fileName.replace(/\.mdx$/, "")
        return {
          params: {
            slug,
          },
        }
      })
  } catch (error) {
    console.error("Error reading blog post slugs:", error)
    return []
  }
}
