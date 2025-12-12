'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
import { globeConfig, sampleArcs } from "@/data/globe-data"
import { EmailCollector } from "@/lib/email-collector"

const World = dynamic(() => import("../ui/globe").then((m) => m.World), {
    ssr: false,
});

export function HomeCTA() {
    return (
        <section className="relative">
            {/* Top slanted divider */}
            <div
                className="absolute -top-24 left-0 right-0 h-32 bg-white transform -skew-y-3 origin-top-right z-20"
            />
            <div className="relative bg-[#062056] min-h-screen flex items-center justify-center overflow-hidden py-20">
                <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
                    {/* Content Section */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-lg md:flex-shrink-0 z-20">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                            Connect with Theta Tau
                        </h2>
                        <p className="mt-4 text-gray-200 md:text-xl">
                            Stay informed about upcoming recruitment events and professional development opportunities.
                        </p>
                        <div className="w-full max-w-sm space-y-2 mt-6">
                            <EmailCollector source="home_cta" />
                            <p className="text-xs text-gray-300">
                                Receive updates about recruitment events and important deadlines.
                            </p>
                        </div>
                    </div>

                    {/* Globe Section */}
                    <div className="absolute top-[-100px] right-[-300px] w-[1800px] h-[1500px] md:right-[-800px] md:top-[-500px]">
                        <div className="absolute inset-0">
                            <World data={sampleArcs} globeConfig={globeConfig} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
