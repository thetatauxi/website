import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Heart, Users } from "lucide-react"

export function HomePillarsSection() {
  return (
    <section
      id="pillars"
      className="
        py-20 px-4
        bg-[#FFF5D7]
      "
    >
      <div className="container mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance text-[#750901]">
            Our Three Pillars
          </h2>
          <p className="text-xl text-black max-w-2xl mx-auto text-pretty">
            The foundation of Theta Tau is built on three core principles that guide
            everything we do
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* --- Pillar 1 --- */}
          <Card className="border-2 border-[#750901]/20 bg-white/10 backdrop-blur-sm 
            hover:border-[#750901] hover:shadow-2xl hover:shadow-[#750901]/20 
            transition-all duration-300 hover:-translate-y-2 group text-white">
            <CardContent className="p-8 space-y-4">
              <div className="h-14 w-14 rounded-xl bg-[#750901]/20 
                  flex items-center justify-center 
                  group-hover:bg-[#750901]/40 transition-colors">
                <Briefcase className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-black">Professional Development</h3>
              <p className="text-black leading-relaxed">
                Prepare for successful engineering careers through workshops,
                networking events, and mentorship from industry leaders.
              </p>
            </CardContent>
          </Card>

          {/* --- Pillar 2 --- */}
          <Card className="border-2 border-[#D4AF37]/20 bg-white/10 backdrop-blur-sm 
            hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/20 
            transition-all duration-300 hover:-translate-y-2 group text-white">
            <CardContent className="p-8 space-y-4">
              <div className="h-14 w-14 rounded-xl bg-[#8B0000]/20 
                  flex items-center justify-center 
                  group-hover:bg-[#8B0000]/40 transition-colors">
                <Heart className="h-7 w-7 text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-black">Community Service</h3>
              <p className="leading-relaxed text-black">
                Make a lasting impact through volunteer initiatives, outreach 
                programs, and engineering projects that benefit our community.
              </p>
            </CardContent>
          </Card>

          {/* --- Pillar 3 --- */}
          <Card className="border-2 border-[#750901]/20 bg-white/10 backdrop-blur-sm 
            hover:border-[#750901] hover:shadow-2xl hover:shadow-[#750901]/20 
            transition-all duration-300 hover:-translate-y-2 group text-white">
            <CardContent className="p-8 space-y-4">
              <div className="h-14 w-14 rounded-xl bg-[#750901]/20 
                  flex items-center justify-center 
                  group-hover:bg-[#750901]/40 transition-colors">
                <Users className="h-7 w-7 text-[#750901]" />
              </div>
              <h3 className="text-2xl font-bold text-black">Brotherhood</h3>
              <p className="text-black leading-relaxed">
                Build lifelong connections with fellow engineers who share your 
                values, ambitions, and commitment to excellence.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
