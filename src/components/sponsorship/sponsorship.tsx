"use client"

import { Button } from "@/components/ui/button"
import Badge from "@/components/ui/badge"

export default function SponsorshipPage() {
  const sponsors = [
    {
      name: "Kohler",
      tier: "Jacqueminot",
      logo: "/Kohler.jpeg",
      website: "https://www.kohler.com/en",
      description: "THE BOLD LOOK OF KOHLER®",
    },
    {
      name: "Pentair",
      tier: "Gold",
      logo: "/pentair_logo.png",
      website: "https://www.pentair.com/",
      description: "Move, Improve and Enjoy Water",
    },
    {
      name: "Boston Scientific",
      tier: "Maroon",
      logo: "/boston_scientific.jpg",
      website: "https://www.bostonscientific.com/en-US/home.html",
      description: "Advancing Science for life",
    },
  ]

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "bg-gray-100 text-gray-900"
      case "Gold":
        return "bg-amber-100 text-amber-700"
      case "Silver":
        return "bg-slate-100 text-slate-700"
      case "Maroon":
        return "bg-red-900 text-white"
      case "Jacqueminot":
        return "bg-slate-100 text-slate-700"
      default:
        return "bg-red-100 text-red-700"
    }
  }

 const handleDownloadPDF = () => {
  const link = document.createElement("a");
  link.href = "/Theta%20Tau%20UW-Madison%202025%20Sponsorship%20packet.pdf";
  link.download = "Theta Tau UW-Madison 2025 Sponsorship packet.pdf";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative overflow-hidden">
      {/* Background with Geometric Lines and Abstract Graphics */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-no-repeat bg-center opacity-20 z-0"
        style={{ backgroundImage: "url(/abstract-geometric-pattern.svg)" }}
      ></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-700 to-yellow-500 opacity-15 z-0"></div>
      {/* Circuit board pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M20 20h60v60h-60z" stroke="currentColor" strokeWidth="1" fill="none" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
              <circle cx="80" cy="20" r="2" fill="currentColor" />
              <circle cx="20" cy="80" r="2" fill="currentColor" />
              <circle cx="80" cy="80" r="2" fill="currentColor" />
              <path d="M20 20h20v20h20v20h20" stroke="currentColor" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      </div>

      {/* Geometric shapes */}
      <div className="absolute top-20 right-20 w-32 h-32 border-2 border-amber-400 opacity-20 rotate-45"></div>
      <div className="absolute bottom-40 left-20 w-24 h-24 border-2 border-amber-400 opacity-15 rotate-12"></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-amber-400 opacity-10 rotate-45"></div>

      {/* Engineering-themed lines */}
      <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 1200 800">
        <path d="M0 200 Q300 150 600 200 T1200 200" stroke="rgb(251 191 36)" strokeWidth="2" fill="none" />
        <path d="M0 600 Q300 550 600 600 T1200 600" stroke="rgb(251 191 36)" strokeWidth="1" fill="none" />
        <path d="M200 0 Q250 200 300 400 T400 800" stroke="rgb(251 191 36)" strokeWidth="1" fill="none" />
      </svg>
      {/* Header */}
      <header className="relative z-10 text-center py-12">
        <h1 className="text-5xl font-semibold text-gray-800 mb-4">Sponsorship Opportunities</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Partner with the next generation of engineering leaders.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        {/* Why Sponsor Us */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">Why Sponsor Us?</h2>
          <div className="flex flex-col lg:flex-row items-start gap-12">
            <div className="flex-1">
              <p className="text-xl text-gray-600 mb-6">
                Partnering with our chapter is an opportunity to support the development of future engineers while
                increasing your organization’s visibility on campus. Sponsorships directly fund our professional
                development programs, technical workshops, and community initiatives that prepare members to be leaders
                in their fields. In return, we offer recognition across our events and platforms, along with meaningful
                opportunities to connect with talented, motivated students.
              </p>
            </div>
            <div className="flex-1 lg:max-w-2xl">
              <img
                src="/spr25initiation.jpeg"
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* Sponsors Section */}
        <section>
  <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
    Our Valued Sponsors
  </h2>
  <div className="flex flex-wrap justify-center gap-12">
    {sponsors.map((sponsor, index) => (
      <div
        key={index}
        className="flex-1 min-w-[320px] max-w-lg bg-white rounded-lg shadow-xl p-10 text-center border border-red-300 hover:shadow-2xl transition-all duration-300"
      >
        <div className="mb-6">
          <Badge
            className={`inline-block px-4 py-2 rounded-full text-sm ${getTierColor(
              sponsor.tier
            )}`}
          >
            {sponsor.tier}
          </Badge>
        </div>
        <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
          <img
            src={sponsor.logo || "/placeholder.svg"}
            alt={`${sponsor.name} logo`}
            className="h-28 mx-auto object-contain mb-6" // ⬅️ increased from h-16 → h-28
          />
          <h3 className="text-2xl font-semibold text-gray-800">
            {sponsor.name}
          </h3>
        </a>
        <p className="text-gray-500 text-base mb-6">{sponsor.description}</p>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-300 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-full bg-transparent"
          asChild
        >
          <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
            Visit Website
          </a>
        </Button>
      </div>
    ))}
  </div>
</section>


        {/* Call to Action Section */}
        <section className="text-center bg-gradient-to-r from-red-600 to-yellow-500 p-12 rounded-lg shadow-xl mt-16">
          <h3 className="text-2xl font-semibold text-white mb-4">Ready to Join Our Sponsor Family?</h3>
          <p className="text-gray-100 mb-6">
            Contact us today to learn more about our sponsorship packages and partnership opportunities.
          </p>
          <div className="flex justify-center gap-6">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-md"
              asChild
            >
              <a href="mailto:sponsorship@thetatauxi.org?">Contact Us</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/20 py-3 px-8 rounded-md bg-transparent"
              onClick={handleDownloadPDF}
            >
              Download Package Info
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
