import Image from "next/image"

export default function RushWhyUs() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
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

      <div className="absolute top-20 right-10 w-16 h-16 border-2 border-blue-800 opacity-20 rotate-45"></div>
      <div className="absolute top-1/3 left-10 w-12 h-12 border-2 border-blue-800 opacity-20"></div>
      <div className="absolute bottom-20 right-1/4 w-20 h-20 border-2 border-blue-800 opacity-20 rotate-12"></div>
      <div className="absolute bottom-10 left-10 w-8 h-8 bg-blue-800 opacity-20 rotate-45"></div>

      <section id="why-us" className="w-full py-12 md:py-24 z-10 relative">
        <div className="container px-4 md:px-6">
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
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-900">
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
                  href="https://thetatau.org/" // Replace with your desired link
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="bg-blue-800 text-white py-2 px-6 rounded-md hover:bg-blue-900 transition-all border-2 border-blue-800 hover:border-blue-900">
                    Learn More About θT
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
