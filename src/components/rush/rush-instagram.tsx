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

      <div className="absolute top-10 left-10 w-12 h-12 border-2 border-yellow-500 opacity-20 rotate-45"></div>
      <div className="absolute top-1/2 right-10 w-16 h-16 border-2 border-yellow-500 opacity-20"></div>
      <div className="absolute bottom-10 left-1/3 w-8 h-8 bg-yellow-500 opacity-20 rotate-45"></div>

      <section
        id="instagram"
        className="w-full py-6 md:py-12 bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 text-white relative z-10"
      >
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Instagram className="h-16 w-16" aria-hidden="true" />
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Follow Our Journey</h2>
            <p className="mx-auto max-w-[700px] text-yellow-100 md:text-xl">
              Stay updated with our latest events, projects, and brotherhood activities on Instagram.
            </p>
            <Button
              size="lg"
              asChild
              className="mt-4 bg-white text-yellow-500 hover:bg-yellow-50 border-2 border-white hover:border-yellow-100"
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
