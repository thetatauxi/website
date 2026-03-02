"use client"
import Image from "next/image"

export function RecruitmentHero() {
  const imageUrl = "/Sp26Rush.png"

  return (
    <div className="h-[80vh] bg-white container max-w-7xl mx-auto relative">
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

      <div className="absolute top-10 left-10 w-16 h-16 border-2 border-yellow-500 opacity-20 rotate-45"></div>
      <div className="absolute top-1/4 right-20 w-12 h-12 border-2 border-yellow-500 opacity-20"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 border-2 border-yellow-500 opacity-20 rotate-12"></div>
      <div className="absolute bottom-10 right-10 w-8 h-8 bg-yellow-500 opacity-20 rotate-45"></div>

      <div className="h-full lg:flex lg:items-center lg:justify-between lg:gap-8 z-10 relative">
        <div className="flex-1 space-y-8 pt-20 lg:pt-0">
          <div className="text-center p-4 lg:text-left space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-yellow-500">
              Unsung Heroes
            </h1>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800">Rush Theta Tau</h2>
            <p className="mx-auto text-gray-600 md:text-xl max-w-[600px]">
              Join a brotherhood of engineers dedicated to academic excellence, professional development, and community service. Follow our Instagram for more information and enter your email to get notified about rush.
            </p>
          </div>
          <div className="text-center lg:text-left lg:ml-4">
            <a 
              href="https://docs.google.com/forms/d/1F3PW5Ye29jUTyRqRyF0LhV2pCIDeCz_wsnE1jnYtmQs/edit" 
              target="_blank" 
              className="bg-yellow-500 text-white hover:bg-yellow-600 px-4 py-3 rounded-md text-center">
                Fill out the Interest Form
            </a>
          </div>
        </div>
        <div className="mt-8 md:mt-16 flex items-center justify-center lg:justify-end">
          <div className="w-full md:w-[650px] h-[400px] md:h-[650px] max-h-[650px] rounded-xl overflow-hidden">
            <Image
              src={imageUrl}
              alt="Rush Theta Tau"
              className="w-full h-full object-contain rounded-lg"
              width={650}
              height={650}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecruitmentHero
