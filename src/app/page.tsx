"use client"

//import { HomeNavigation } from "@/components/home/home-navigation"
import { HomeHeroSection } from "@/components/new-home/home-header"
import { HomePillarsSection } from "@/components/new-home/home-pillars"
import { HomeAboutSection } from "@/components/new-home/home-about"
//import { HomeImpactSection } from "@/components/home/home-impact-section"
import { HomeOurNetwork } from "@/components/new-home/home-network"

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