import Image from "next/image"

export default function RushWhyUs() {
  return (
    <div className="bg-white flex flex-col">

      <div className="absolute top-20 right-10 w-16 h-16 border-2 border-yellow-500 opacity-20 rotate-45"></div>
      <div className="absolute top-1/3 left-10 w-12 h-12 border-2 border-yellow-500 opacity-20"></div>
      <div className="absolute bottom-20 right-1/4 w-20 h-20 border-2 border-yellow-500 opacity-20 rotate-12"></div>
      <div className="absolute bottom-10 left-10 w-8 h-8 bg-yellow-500 opacity-20 rotate-45"></div>

      <section id="why-us" className="py-16 z-10 relative">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Image Section */}
            <div className="md:w-1/2 aspect-square overflow-hidden rounded-xl">
              <Image
                alt="Theta Tau members"
                className="object-cover"
                height="600"
                src="/execpic.JPG?height=600&width=600"
                style={{
                  aspectRatio: "1/1",
                  objectFit: "cover",
                }}
                width="600"
              />
            </div>
            {/* Text Section */}
            <div className="md:w-1/2 space-y-6 p-6">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-yellow-500">
                Why Join Theta Tau?
              </h2>
              <div className="space-y-4 text-gray-700 md:text-lg">
                <p>
                  Theta Tau offers a unique blend of professional development, philanthropic service, and lifelong
                  brotherhood. As a member, you'll join a community of like-minded engineers who support and inspire
                  each other to reach new heights in their careers and personal lives.
                </p>
                <p>
                  Our fraternity provides unparalleled opportunities for leadership development, allowing you to take on
                  roles that will enhance your organizational and management skills.
                </p>
                <p>
                  We pride ourselves on our strong alumni network, which opens doors to internships, job opportunities,
                  and mentorship. By joining Theta Tau, you're not just part of a college organization—you're joining a
                  lifelong community.
                </p>
              </div>
              {/* Button Section with Gap */}
              <div className="mt-4">
                <a
                  href="https://thetatau.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-yellow-500 text-white py-2 px-6 rounded-md hover:bg-yellow-600 transition-colors border-2 border-yellow-500 hover:border-yellow-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2"
                >
                  Learn More About θT
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
