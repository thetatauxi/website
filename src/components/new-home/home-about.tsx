"use client"

export function HomeAboutSection() {
  return (
    <section
      id="about"
      className="
        py-20 px-4
        bg-gradient-to-b from-[#FFF5D7] to-[#0A0000]
        text-white
      "
    >
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* IMAGE */}
          <div className="relative h-[600px] rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 border-2 border-[#D4AF37]/30 rounded-2xl group-hover:border-[#D4AF37] transition-colors z-10" />
            <img
              src="/nationals2025.JPEG"
              alt="Brotherhood"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Gold-red gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B0000]/30 via-transparent to-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* TEXT */}
          <div className="space-y-6">
            <div>
              <div className="text-sm font-semibold text-black mb-2 tracking-wider">
                SINCE 1904
              </div>

              {/* Ensure visibility as gradient transitions */}
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance text-white drop-shadow-lg">
                A Legacy of Excellence
              </h2>
            </div>

            <p className="text-lg leading-relaxed text-gray-200">
              Founded in 1904, Theta Tau is the oldest and foremost professional engineering
              fraternity. Our Xi chapter is dedicated to developing engineers who combine technical
              excellence with strong character and leadership skills.
            </p>

            <p className="text-lg leading-relaxed text-gray-200">
              We foster an environment of mutual respect and professionalism, enriched by the
              diversity of engineering disciplines and demographics. Our culture emphasizes lifelong
              relationships and connections grounded in a strong bond of fraternal fellowship.
            </p>

            <div className="pt-4">
              <blockquote className="border-l-4 border-[#D4AF37] pl-6 italic text-lg text-gray-100">
                "Whatsoever thy hand findeth to do, do it with thy might..."
                <footer className="text-sm text-gray-300 mt-2">
                  — Ecclesiastes 9:10
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
