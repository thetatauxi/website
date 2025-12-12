import Link from "next/link"
import { Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RushInstagram() {
  return (
    <div className="bg-white relative">
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
                        linear-gradient(rgba(30, 64, 175, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(30, 64, 175, 0.3) 1px, transparent 1px)
                    `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="absolute top-10 left-10 w-12 h-12 border-2 border-blue-800 opacity-20 rotate-45"></div>
      <div className="absolute top-1/2 right-10 w-16 h-16 border-2 border-blue-800 opacity-20"></div>
      <div className="absolute bottom-10 left-1/3 w-8 h-8 bg-blue-800 opacity-20 rotate-45"></div>

      <section
        id="instagram"
        className="w-full py-6 md:py-12 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white relative z-10"
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Instagram className="h-16 w-16" />
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Follow Our Journey</h2>
            <p className="mx-auto max-w-[700px] text-blue-100 md:text-xl">
              Stay updated with our latest events, projects, and brotherhood activities on Instagram.
            </p>
            <Button
              size="lg"
              asChild
              className="mt-4 bg-white text-blue-800 hover:bg-blue-50 border-2 border-white hover:border-blue-100"
            >
              <Link href="https://www.instagram.com/thetatauxi" target="_blank" rel="noopener noreferrer">
                Follow @thetatauxi
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
