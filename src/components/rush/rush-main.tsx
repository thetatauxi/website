import Image from "next/image"
import Link from "next/link"
import { Instagram, Play } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RushPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="#">
          <span className="sr-only">Theta Tau</span>
          <span className="font-bold text-xl">ΕΠΤ</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#events">
            Events
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#why-us">
            Why Us
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#rush-video">
            Rush Video
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#instagram">
            Instagram
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#contact">
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Epsilon Pi Tau Rush 2024
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Join the premier engineering honor society and unlock your potential.
              </p>
              <div className="w-full max-w-sm space-y-2">
                <Button className="w-full" size="lg">
                  Sign Up for Rush
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="space-y-4 md:w-1/2">
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">Rush Flyer</h2>
                <p className="text-muted-foreground">
                  Check out our official rush flyer for all the details about our upcoming events and how to get involved.
                </p>
              </div>
              <div className="md:w-1/2 aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  alt="Rush Flyer"
                  className="object-cover"
                  height="300"
                  src="/placeholder.svg?height=300&width=400"
                  style={{
                    aspectRatio: "4/3",
                    objectFit: "cover",
                  }}
                  width="400"
                />
              </div>
            </div>
          </div>
        </section>
        <section id="events" className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">Rush Events</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Info Session</CardTitle>
                  <CardDescription>September 15, 2024 - 7:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  Learn about ΕΠΤ's history, values, and the benefits of membership. Q&A session included.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Engineering Challenge</CardTitle>
                  <CardDescription>September 17, 2024 - 6:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  Participate in a fun, team-based engineering challenge. Show off your skills and creativity!
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Social Mixer</CardTitle>
                  <CardDescription>September 20, 2024 - 8:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  Meet and mingle with current members in a relaxed setting. Refreshments will be provided.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section id="why-us" className="w-full py-12 md:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2 space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Why Join Epsilon Pi Tau?</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Epsilon Pi Tau offers a unique blend of academic excellence, professional development, and lifelong brotherhood. As a member, you'll join a community of like-minded engineers who support and inspire each other to reach new heights in their careers and personal lives.
                  </p>
                  <p>
                    Our fraternity provides unparalleled opportunities for leadership development, allowing you to take on roles that will enhance your organizational and management skills. Through our various projects and competitions, you'll have the chance to apply your engineering knowledge to real-world problems, pushing the boundaries of innovation.
                  </p>
                  <p>
                    We pride ourselves on our strong alumni network, which opens doors to internships, job opportunities, and mentorship from successful professionals in various engineering fields. By joining Epsilon Pi Tau, you're not just part of a college organization – you're joining a lifelong community dedicated to advancing the engineering profession.
                  </p>
                </div>
                <Button size="lg" className="mt-4">Learn More About ΕΠΤ</Button>
              </div>
              <div className="md:w-1/2 aspect-square overflow-hidden rounded-xl">
                <Image
                  alt="Epsilon Pi Tau members"
                  className="object-cover"
                  height="600"
                  src="/placeholder.svg?height=600&width=600"
                  style={{
                    aspectRatio: "1/1",
                    objectFit: "cover",
                  }}
                  width="600"
                />
              </div>
            </div>
          </div>
        </section>
        <section id="rush-video" className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Experience ΕΠΤ Rush</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Get a glimpse of what it's like to be part of Epsilon Pi Tau. Watch our rush video and see why we're more than just a fraternity.
              </p>
              <div className="w-full max-w-4xl aspect-video overflow-hidden rounded-xl border bg-muted">
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?height=720&width=1280"
                    alt="Rush Video Thumbnail"
                    width={1280}
                    height={720}
                    className="object-cover"
                  />
                  <Button
                    size="lg"
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90"
                    aria-label="Play rush video"
                  >
                    <Play className="w-8 h-8" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Click to play our 2024 Rush Video
              </p>
            </div>
          </div>
        </section>
        <section id="instagram" className="w-full py-12 md:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Instagram className="h-16 w-16" />
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Follow Our Journey</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Stay updated with our latest events, projects, and brotherhood activities on Instagram.
              </p>
              <Button size="lg" asChild className="mt-4">
                <Link href="https://www.instagram.com/epsilonpitau" target="_blank" rel="noopener noreferrer">
                  Follow @epsilonpitau
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer id="contact" className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2024 Epsilon Pi Tau. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy Policy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="mailto:rush@epsilonpitau.org">
            rush@epsilonpitau.org
          </Link>
        </nav>
      </footer>
    </div>
  )
}