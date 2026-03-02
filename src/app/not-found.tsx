import Link from "next/link"
import { ArrowLeft, Compass, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#FFF5D7] px-4 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute right-12 top-16 h-24 w-24 rotate-45 border-2 border-[#D4AF37]/30" />
        <div className="absolute bottom-16 left-10 h-20 w-20 rotate-12 border-2 border-[#8B0000]/20" />
        <div className="absolute left-1/4 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#D4AF37]/20 to-transparent" />
        <div className="absolute top-1/3 h-px w-full bg-gradient-to-r from-transparent via-[#8B0000]/15 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl rounded-2xl border border-[#8B0000]/15 bg-white/90 p-8 text-center shadow-xl md:p-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#8B0000]">Page Not Found</p>
        <h1 className="mb-4 text-6xl font-bold leading-none text-[#8B0000] md:text-7xl">404</h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-700 md:text-xl">
          We could not find that page. Try one of the main destinations below.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-[#8B0000] text-white hover:bg-[#A52A2A]">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Back Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-[#D4AF37] text-[#8B0000] hover:bg-[#FFF5D7]">
            <Link href="/rush">
              <Compass aria-hidden="true" />
              Visit Rush
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-[#D4AF37] text-[#8B0000] hover:bg-[#FFF5D7]">
            <Link href="/blog">
              <Newspaper aria-hidden="true" />
              Read Blog
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
