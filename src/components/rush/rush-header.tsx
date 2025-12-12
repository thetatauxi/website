// import { Button } from "@/components/ui/button"

// export default function RushHeader() {
//   return (
//     <div className="min-h-screen bg-background flex flex-col">
//       <main className="flex-1">
//         <section className="w-full py-12 md:py-24 lg:py-32">
//           <div className="container px-4 md:px-6">
//             <div className="flex flex-col items-center space-y-4 text-center">
//               <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
//                 Theta Tau Rush 2024
//               </h1>
//               <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
//                 Learn about our community of engineers, and discover opportunities in leadership and service.
//               </p>
//               <div className="w-full max-w-sm space-y-2">
//                 <Button className="w-full" size="lg">
//                   Sign Up for Rush
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </section>
//         </main>
//     </div>
//   )
// }
// "use client";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { EmailCollector } from "@/lib/email-collector";
// import Image from "next/image";

// export function RecruitmentHero() {
//     const imageUrl = "/Spring25Rush.jpeg";

//     return (
//         <div className="h-[80vh] bg-white container max-w-7xl mx-auto">
//             <div className="h-full md:flex md:items-center md:justify-between md:gap-8">
//                 <div className="flex-1 space-y-8 pt-20 md:pt-0">
//                     <div className="space-y-4">
//                         <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-black">
//                             Rush Theta Tau
//                         </h1>
//                         <p className="text-gray-600 md:text-xl max-w-[600px]">
//                             Learn about our community of engineers, and discover opportunities in leadership and service.
//                         </p>
//                     </div>
//                     <div className="w-full max-w-sm space-y-2">
//                         <EmailCollector 
//                             source="recruitment_hero"
//                             className="[&_button]:bg-black [&_button]:text-white [&_button]:hover:bg-black/90 [&_input]:border-gray-300"
//                         />
//                         <p className="text-xs text-gray-500">
//                             Sign up to get notified about our rush events and deadlines.
//                         </p>
//                     </div>
//                 </div>
//                 <div className="mt-8 md:mt-16 flex items-center justify-center md:justify-end">
//                     <div className="w-full md:w-[650px] h-[450px] md:h-[650px] rounded-xl overflow-hidden">
//                         <Image
//                             src={imageUrl}
//                             alt="Rush Theta Tau"
//                             className="w-full h-full object-contain scale-105 rounded-2xl"
//                             width={650}
//                             height={650}
//                         />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

"use client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { EmailCollector } from "@/lib/email-collector";
import Image from "next/image";

export function RecruitmentHero() {
  const imageUrl = "/Fall25RushFlyer.jpeg"

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

      <div className="absolute top-10 left-10 w-16 h-16 border-2 border-blue-800 opacity-20 rotate-45"></div>
      <div className="absolute top-1/4 right-20 w-12 h-12 border-2 border-blue-800 opacity-20"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 border-2 border-blue-800 opacity-20 rotate-12"></div>
      <div className="absolute bottom-10 right-10 w-8 h-8 bg-blue-800 opacity-20 rotate-45"></div>

      <div className="h-full md:flex md:items-center md:justify-between md:gap-8 z-10 relative">
        <div className="flex-1 space-y-8 pt-20 md:pt-0">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-blue-900">
              Building the Blueprint
            </h1>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800">Rush Theta Tau</h2>
            <p className="text-gray-600 md:text-xl max-w-[600px]">
              Join a brotherhood of engineers dedicated to academic excellence, professional development, and community service. Follow our instagram for more information and enter your email to get notified about rush.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <EmailCollector
              source="recruitment_hero"
              className="[&_button]:bg-blue-800 [&_button]:text-white [&_button]:hover:bg-blue-900"
            />
            <p className="text-xs text-blue-600">Sign up to get notified about our rush events and deadlines.</p>
          </div>
        </div>
        <div className="mt-8 md:mt-16 flex items-center justify-center md:justify-end">
          <div className="w-full md:w-[650px] h-[400px] md:h-[650px] max-h-[650px] rounded-xl overflow-hidden">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt="Rush Theta Tau"
              className="w-full h-full object-contain scale-105 rounded-lg"
              width={650}
              height={650}
            />
          </div>
        </div>
      </div>
      <div className="mt-16">{/* Your next section content goes here */}</div>
    </div>
  )
}

export default RecruitmentHero
