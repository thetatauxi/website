"use client"
import Image from "next/image"

export default function RushPage() {
  const activities = [
    {
      title: "Brotherhood Retreat",
      description:
        "Brotherhood in Theta Tau means joining a supportive community of peers who share your goals and passions. Become part of something bigger—where you'll find encouragement, connections, and opportunities to succeed.",
      image: "/20240908_204437_752C9A.jpeg?height=400&width=600&text=Brotherhood+Retreat",
    },
    {
      title: "Professional Development",
      description:
        "Connect with successful θT alumni. Gain skills and connections to jumpstart your career. Learn more about our professional network on our ",
      image: "/fall24elections.jpg?height=400&width=600&text=Pro+Dev",
      link: "https://www.linkedin.com/your-linkedin-profile",
    },
    {
      title: "Food Fridays",
      description:
        "Experience the vibrant life at Theta Tau. Our Food Fridays foster strong bonds and create lasting memories among brothers.",
      image: "/20241124_104032_7C0C75.JPEG?height=400&width=600&text=Food+Fridays",
    },
    {
      title: "Study Tables",
      description:
        "Stay motivated, learn from peers, and excel academically while building strong connections with fellow engineering students.",
      image: "/electionscandid.JPG?height=400&width=600&text=Study+Tables",
    },
    {
      title: "Career Fairs",
      description:
        "Explore career building opportunities at our exclusive career fair workshops. Elevate your resume, sharpen your interview skills, and unlock doors to internships and jobs that set you apart.",
      image: "/20240428_211420_7565D5-768x1024.jpeg?height=400&width=600&text=Career+Fair",
    },
    {
      title: "Community Service",
      description:
        "Make a positive impact on your community and grow alongside your fellow brothers while building teamwork and leadership skills.",
      image: "/94883.jpg?height=400&width=600&text=Comm+Serve",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white relative">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8 text-center text-maroon-700">
          Life at Theta Tau
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activities.map((activity, index) => (
            <div key={index} className="flex flex-col space-y-4 relative z-10">
              <div className="aspect-video overflow-hidden rounded-xl shadow-lg">
                <Image
                  alt={`Theta Tau ${activity.title}`}
                  className="object-cover w-full h-full"
                  height="400"
                  src={activity.image || "/placeholder.svg"}
                  width="600"
                />
              </div>
              <h3 className="text-xl font-bold text-maroon-700">{activity.title}</h3>
              <p className="text-gray-600">
                {activity.link ? (
                  <>
                    {activity.description}{" "}
                    <a
                      href={activity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      LinkedIn page
                    </a>
                  </>
                ) : (
                  activity.description
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
