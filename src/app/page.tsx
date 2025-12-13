"use client"

//import { HomeNavigation } from "@/components/home/home-navigation"
import { HomeHeroSection } from "@/components/home/home-header"
import { HomePillarsSection } from "@/components/home/home-pillars"
import { HomeAboutSection } from "@/components/home/home-about"
//import { HomeImpactSection } from "@/components/home/home-impact-section"
import { HomeOurNetwork } from "@/components/home/home-network"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HomeHeroSection />
      <HomePillarsSection />
      <HomeAboutSection />
      <HomeOurNetwork />
    </div>
  )
}