"use client"
import Image from "next/image"

export function RecruitmentHero() {
  const imageUrl = "/Fa26Rush.jpg"

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white dark:bg-black text-gray-900 dark:text-white container max-w-7xl mx-auto relative px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex items-center transition-colors duration-200">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
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

      <div className="absolute top-10 left-10 w-16 h-16 border-2 border-yellow-500 opacity-20 rotate-45 pointer-events-none"></div>
      <div className="absolute top-1/4 right-20 w-12 h-12 border-2 border-yellow-500 opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 border-2 border-yellow-500 opacity-20 rotate-12 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-8 h-8 bg-yellow-500 opacity-20 rotate-45 pointer-events-none"></div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center z-10 relative">
        <div className="space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start justify-center">
          <div className="space-y-4 max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-yellow-500">
              Record Breaking Rush
            </h1>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white">
              Rush Theta Tau
            </h2>
            <p className="text-gray-600 dark:text-gray-300 md:text-lg">
              Join a brotherhood of engineers dedicated to academic excellence, professional development, and community service. Follow our Instagram for more information and enter your email to get notified about rush.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSc_ja5EqrOJ6We4Mvk4xCVKMj1vbU1bV3wz6uzyqq-0NKvpKQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-yellow-500 text-white hover:bg-yellow-600 px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow transition-all duration-200"
            >
              Fill out the Interest Form
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end w-full">
          <div classNa
          me="w-full max-w-[550px] bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl shadow-lg border border-gray-100/80 dark:border-zinc-800 overflow-hidden flex items-center justify-center transition-colors duration-200">
            <div className="relative w-full aspect-[4/5] max-h-[580px] rounded-xl overflow-hidden">
              <Image
                src={imageUrl}
                alt="Rush Theta Tau Schedule"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"
                className="object-contain rounded-lg"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecruitmentHero
