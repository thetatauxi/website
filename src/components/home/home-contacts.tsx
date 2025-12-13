import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, Instagram, Linkedin, Github } from "lucide-react"

export function ContactSection() {
  return (
    <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-[#2a0808]">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">Get In Touch</h2>
            <p className="text-gray-300 md:text-lg">
              Have questions about our fraternity or events? Reach out to us and we'll get back to you soon.
            </p>
            <div className="space-y-4">
              <Link
                href="mailto:contact@thetatau.org"
                className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5 text-[#ff6b6b]" />
                <span>contact@thetatau.org</span>
              </Link>
            </div>
            <div className="flex gap-4 mt-6">
              <Link
                href="https://www.instagram.com/thetatauxi/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-[#8B0000] text-[#ff6b6b] transition-colors hover:bg-[#8B0000]/10"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="https://www.linkedin.com/in/thetatauxi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-[#8B0000] text-[#ff6b6b] transition-colors hover:bg-[#8B0000]/10"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link
                href="https://github.com/aadya-g/theta-tau"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-[#8B0000] text-[#ff6b6b] transition-colors hover:bg-[#8B0000]/10"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none text-gray-200">
                  Name
                </label>
                <input
                  id="name"
                  className="flex h-10 w-full rounded-md border border-[#3d0c0c] bg-[#1a0505] px-3 py-2 text-sm text-white ring-offset-[#8B0000] placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B0000] focus-visible:ring-offset-2"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none text-gray-200">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-[#3d0c0c] bg-[#1a0505] px-3 py-2 text-sm text-white ring-offset-[#8B0000] placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B0000] focus-visible:ring-offset-2"
                  placeholder="Your email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium leading-none text-gray-200">
                Subject
              </label>
              <input
                id="subject"
                className="flex h-10 w-full rounded-md border border-[#3d0c0c] bg-[#1a0505] px-3 py-2 text-sm text-white ring-offset-[#8B0000] placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B0000] focus-visible:ring-offset-2"
                placeholder="Subject"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium leading-none text-gray-200">
                Message
              </label>
              <textarea
                id="message"
                className="flex min-h-[120px] w-full rounded-md border border-[#3d0c0c] bg-[#1a0505] px-3 py-2 text-sm text-white ring-offset-[#8B0000] placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B0000] focus-visible:ring-offset-2"
                placeholder="Your message"
              ></textarea>
            </div>
            <Button className="w-full bg-[#8B0000] hover:bg-[#a50000] text-white">Send Message</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

