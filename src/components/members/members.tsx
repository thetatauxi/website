"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronUp } from "lucide-react"

// Define the Member type
type Member = {
  id: number
  name: string
  imageUrl: string
  pledgeClass: string
  linkedinUrl: string
}

// Sample data for members
const members: Member[] = [
  {
    id: 1,
    name: "Lily Anderson",
    imageUrl: "/spring25_headshots/LilyA.JPG?height=200&width=200",
    pledgeClass: "Fall 2022",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 2,
    name: "Ike Fritz",
    imageUrl: "/spring25_headshots/IkeF.JPG?height=200&width=200",
    pledgeClass: "Fall 2022",
    linkedinUrl: "https://www.linkedin.com/in/ike-fritz",
  },
  {
    id: 3,
    name: "Duncan Lawler",
    imageUrl: "/spring25_headshots/Duncan.JPG?height=200&width=200",
    pledgeClass: "Fall 2022",
    linkedinUrl: "https://www.linkedin.com/in/duncannlawler",
  },
  {
    id: 4,
    name: "Liam Gaiden",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2022",
    linkedinUrl: "https://www.linkedin.com/in/liam-gaiden",
  },
  {
    id: 5,
    name: "Mariana Alibali",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2022",
    linkedinUrl: "https://www.linkedin.com/in/mariana-alibali",
  },
  {
    id: 6,
    name: "Rhea Marwaha",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2022",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 7,
    name: "Grace Bowen",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2022",
    linkedinUrl: "https://www.linkedin.com/in/grace-bowen-1047a6247/",
  },
  {
    id: 8,
    name: "Ryan Hogan",
    imageUrl: "/spring25_headshots/RyanH.JPG?height=200&width=200",
    pledgeClass: "Spring 2023",
    linkedinUrl: "https://www.linkedin.com/in/ryanhogan77",
  },
  {
    id: 9,
    name: "Caden McDaniel",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2023",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 10,
    name: "Sami Breault",
    imageUrl: "/spring25_headshots/SamiB.JPG?height=200&width=200",
    pledgeClass: "Spring 2023",
    linkedinUrl: "https://www.linkedin.com/in/samantha-breault-0b015b291",
  },
  {
    id: 11,
    name: "Noah Kleven",
    imageUrl: "/spring25_headshots/NoahK.png?height=200&width=200",
    pledgeClass: "Spring 2023",
    linkedinUrl: "http://linkedin.com/in/noah-kleven",
  },
  {
    id: 12,
    name: "Eliza Robinson",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2023",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 13,
    name: "Ben Levy",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2023",
    linkedinUrl: "https://www.linkedin.com/in/ben-levy-125781206",
  },
  {
    id: 14,
    name: "Zack Wagner",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2023",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 15,
    name: "Arshiya Chugh",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2023",
    linkedinUrl: "https://www.linkedin.com/in/arshiya-chugh-b67114261",
  },
  {
    id: 16,
    name: "Mihir Patil",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 17,
    name: "Drew Hay",
    imageUrl: "/spring25_headshots/DrewH.png?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/drewzhay",
  },
  {
    id: 18,
    name: "Bryan Heaton",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/bryanmheaton",
  },
  {
    id: 19,
    name: "Chase Ott",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/chaseott",
  },
  {
    id: 20,
    name: "Logan Soderholm",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 21,
    name: "Meghan Kaminski",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 22,
    name: "Navya Jain",
    imageUrl: "/spring25_headshots/NavyaJ.png?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 23,
    name: "Theo Fowler",
    imageUrl: "/spring25_headshots/TheoF.JPG?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl:
      "https://www.linkedin.com/in/theo-fowler-82037432a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
  },
  {
    id: 24,
    name: "Drew Polzin",
    imageUrl: "/spring25_headshots/DrewP.JPG?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 25,
    name: "Annelise Jacobsen",
    imageUrl: "/spring25_headshots/AnneliseJ.JPG?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 26,
    name: "Zahabiyah Boty",
    imageUrl: "/spring25_headshots/ZahabiyahB.png?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/zahabiyah-boty/",
  },
  {
    id: 27,
    name: "Jackie Behring",
    imageUrl: "/spring25_headshots/JackieBehring.png?height=200&width=200",
    pledgeClass: "Fall 2023",
    linkedinUrl: "https://www.linkedin.com/in/jacqueline-behring-645853310/",
  },
  {
    id: 28,
    name: "Gianna McLeod",
    imageUrl: "/spring25_headshots/GiannaM.png?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/gianna-mcleod/",
  },
  {
    id: 29,
    name: "Ben Bossman",
    imageUrl: "/spring25_headshots/BenBossman.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 30,
    name: "Sophia Prondzinski",
    imageUrl: "/spring25_headshots/SophiaP.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/sophia-prondzinski",
  },
  {
    id: 31,
    name: "Sydney Magee",
    imageUrl: "/spring25_headshots/SydneyM.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/sydney-magee-a9a0232b4",
  },
  {
    id: 32,
    name: "Elaine Wixted",
    imageUrl: "/spring25_headshots/ElaineW.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 33,
    name: "Peter Vasterling",
    imageUrl: "/spring25_headshots/PeterV.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/peter-vasterling",
  },
  {
    id: 34,
    name: "Annie Zhao",
    imageUrl: "/spring25_headshots/AnnieZ.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/-annie-zhao/",
  },
  {
    id: 35,
    name: "Paulina Castaneda",
    imageUrl: "/spring25_headshots/PaulinaC.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/paulina-castaneda1",
  },
  {
    id: 36,
    name: "Bennett Kinney",
    imageUrl: "/spring25_headshots/BennettK.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/bennett-kinney-2893b9199/",
  },
  {
    id: 37,
    name: "Kate Breisemeister",
    imageUrl: "/spring25_headshots/KateB.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/katebriesemeister/",
  },
  {
    id: 38,
    name: "Shubh Arora",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 39,
    name: "Izzy Zeman",
    imageUrl: "/spring25_headshots/IzzyZ.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  }, 
  {
    id: 40,
    name: "Henry Czupryna",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/henry-czupryna-2b3044250/",
  },
  {
    id: 41,
    name: "Elizabeth Risgaard",
    imageUrl: "/spring25_headshots/ElizabethR.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/elizabeth-risgaard-960b642b2",
  },
  {
    id: 42,
    name: "Jack Pinto",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl:
      "https://www.linkedin.com/in/john-pinto-590465162?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
  },
  {
    id: 43,
    name: "Drew Kastenshmidt",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/drew-kastenschmidt-369580327/",
  },
  {
    id: 44,
    name: "Kayla Radtke",
    imageUrl: "/spring25_headshots/KaylaR.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/kayla-radtke",
  },
  {
    id: 45,
    name: "Masa Abboud",
    imageUrl: "/spring25_headshots/MasaA.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 46,
    name: "Jaden Tan",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/jaden-tann",
  },
  {
    id: 47,
    name: "Walter Van Dyke",
    imageUrl: "/spring25_headshots/WalterVD.JPG?height=200&width=200",
    pledgeClass: "Spring 2024",
    linkedinUrl: "https://www.linkedin.com/in/walter-van-dyke",
  },
  {
    id: 48,
    name: "Garret Donohue",
    imageUrl: "/spring25_headshots/GarretD.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/garret-donohue",
  },
  {
    id: 49,
    name: "Abby Burger",
    imageUrl: "/spring25_headshots/AbbyB.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/abby-burger-07708232a",
  },
  {
    id: 50,
    name: "Violet Urdahl",
    imageUrl: "/spring25_headshots/VioletU.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/violet-urdahl",
  },
  {
    id: 51,
    name: "Hadeel Manimaran",
    imageUrl: "/spring25_headshots/HadeelM.png?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/hadeelmanimaran/",
  },
  {
    id: 52,
    name: "Damek Mangum",
    imageUrl: "/spring25_headshots/DamekM.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/damek-mangum-b93186223",
  },
  {
    id: 53,
    name: "Ben Walther",
    imageUrl: "/spring25_headshots/BenW.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/ben-walther-304305307/",
  },
  {
    id: 54,
    name: "Siri Stolen",
    imageUrl: "/spring25_headshots/SiriStolen.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 55,
    name: "Aadya Ganjigunta",
    imageUrl: "/spring25_headshots/AadyaG.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/aadyaganjigunta",
  },
  {
    id: 56,
    name: "Christian Sacia-Garcia",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/christian-sacia-garcia",
  },
  {
    id: 57,
    name: "Chandini Krejcarek",
    imageUrl: "/spring25_headshots/ChandiniK.png?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 58,
    name: "Neil Deore",
    imageUrl: "/spring25_headshots/NeilD.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/neildeore",
  },
  {
    id: 59,
    name: "Emma Stroshane",
    imageUrl: "/spring25_headshots/EmmaS.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/EmmaStroshane",
  },
  {
    id: 60,
    name: "Julia Geng",
    imageUrl: "/spring25_headshots/JuliaG.png?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/julia-geng-543b672a8/",
  },
  {
    id: 61,
    name: "Alex Haas",
    imageUrl: "/spring25_headshots/AlexH.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 62,
    name: "Ellie Fecko",
    imageUrl: "/spring25_headshots/TT.png?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/thetatauxi/",
  },
  {
    id: 63,
    name: "Joseph McIlwain",
    imageUrl: "/spring25_headshots/JosephM.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/joseph-mcilwain-a79382331",
  },
  {
    id: 64,
    name: "Alan Chen",
    imageUrl: "/spring25_headshots/AlanC.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "http://linkedin.com/in/alan-chen-52122a2a2",
  },
  {
    id: 65,
    name: "Noahdiah Lisowski",
    imageUrl: "/spring25_headshots/NoahdiahL.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/NoahdiahLisowski",
  },
  {
    id: 66,
    name: "Sam Snyder",
    imageUrl: "/spring25_headshots/SamS.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/sam-snyder-318942327",
  },
  {
    id: 67,
    name: "Evan Loe",
    imageUrl: "/spring25_headshots/EvanL.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/evan-loe-a940b0266/",
  },
  {
    id: 68,
    name: "Carson Donze",
    imageUrl: "/spring25_headshots/CarsonDonze.JPG?height=200&width=200",
    pledgeClass: "Fall 2024",
    linkedinUrl: "https://www.linkedin.com/in/carson-donze-52b48632a/",
  },
  {
    id: 69,
    name: "Annika Chudy",
    imageUrl: "/spring25_headshots/AnnikaC.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/annika-chudy/",
  },
  {
    id: 70,
    name: "Arik Sargeant",
    imageUrl: "/spring25_headshots/ArikSargeant.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/arik-sargeant-8286a0325/",
  },
  {
    id: 71,
    name: "Ben Belew",
    imageUrl: "/spring25_headshots/BenBelew.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/ben-belew-7b6b51327/",
  },
  {
    id: 72,
    name: "Colin Lazzara",
    imageUrl: "/spring25_headshots/ColinL.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/colin-lazzara-724900353/",
  },
  {
    id: 73,
    name: "Darcy Moore",
    imageUrl: "/spring25_headshots/DarcyM.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/darcy-moore/",
  },
  {
    id: 74,
    name: "Ella Barsness",
    imageUrl: "/spring25_headshots/EllaB.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/ella-barsness-54760422b/",
  },
  {
    id: 75,
    name: "Everett Kaeli",
    imageUrl: "/spring25_headshots/EverettK.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/everett-kaeli-71a10a304/",
  },
  {
    id: 76,
    name: "Fiona Dragan",
    imageUrl: "/spring25_headshots/FionaD.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/fiona-dragan/",
  },
  {
    id: 77,
    name: "Gage Helgeson",
    imageUrl: "/spring25_headshots/GageH.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/gage-helgeson-57269234b/",
  },
  {
    id: 78,
    name: "Hunter Cooke",
    imageUrl: "/spring25_headshots/HunterC.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/hunter-cooke-a5926a29a/",
  },
  {
    id: 79,
    name: "Jamie Lennon",
    imageUrl: "/spring25_headshots/JamieL.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/jamie-lennon-795216306/",
  },
  {
    id: 80,
    name: "Jessica Rolain",
    imageUrl: "/spring25_headshots/JessicaR.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/jessica-r-5b477a235/",
  },
  {
    id: 81,
    name: "Julia Hyman",
    imageUrl: "/spring25_headshots/JuliaH.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/julia-hyman-279a96343/",
  },
  {
    id: 82,
    name: "Katie Duffy",
    imageUrl: "/spring25_headshots/KatieD.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/katie-m-duffy/",
  },
  {
    id: 83,
    name: "Katie Jenson",
    imageUrl: "/spring25_headshots/KatieJenson.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/katie-jenson-23bb22335/",
  },
  {
    id: 84,
    name: "Lauren Anderson",
    imageUrl: "/spring25_headshots/LaurenA.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/lauren-anderson-15b0a1349/",
  },
  {
    id: 85,
    name: "Leonardo Losch",
    imageUrl: "/spring25_headshots/LeonardoL.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/leonardo-losch-3a64462a3/",
  },
  {
    id: 86,
    name: "Luke Van Overmeiren",
    imageUrl: "/spring25_headshots/LukeVO.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/luke-van-overmeiren-bba3b834b/",
  },
  {
    id: 87,
    name: "Lydia Lim",
    imageUrl: "/spring25_headshots/LydiaL.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/lydialim06/",
  },
  {
    id: 88,
    name: "Philip Gu",
    imageUrl: "/spring25_headshots/PhilipG.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/philip-gu-3892b3337/",
  },
  {
    id: 89,
    name: "Sabrina Garcia",
    imageUrl: "/spring25_headshots/SabrinaG.JPG?height=200&width=200",
    pledgeClass: "Spring 2025",
    linkedinUrl: "https://www.linkedin.com/in/sabrina-garcia-657942304/",
  },
]

// Sort pledge classes chronologically
const sortPledgeClasses = (a: string, b: string): number => {
  const [aSeason, aYear] = a.split(" ")
  const [bSeason, bYear] = b.split(" ")

  if (aYear !== bYear) {
    return Number.parseInt(aYear) - Number.parseInt(bYear)
  }

  const seasonOrder = { Spring: 0, Summer: 1, Fall: 2, Winter: 3 }
  return seasonOrder[aSeason as keyof typeof seasonOrder] - seasonOrder[bSeason as keyof typeof seasonOrder]
}

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Get unique pledge classes
  const pledgeClasses = Array.from(new Set(members.map((member) => member.pledgeClass)))
    .sort(sortPledgeClasses)
    .reverse() // Most recent first

  // Filter members based on search and active filter
  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !activeFilter || member.pledgeClass === activeFilter
    return matchesSearch && matchesFilter
  })

  // Group members by pledge class and sort alphabetically within each group
  const groupedMembers = filteredMembers.reduce(
    (groups, member) => {
      const { pledgeClass } = member
      if (!groups[pledgeClass]) {
        groups[pledgeClass] = []
      }
      groups[pledgeClass].push(member)
      return groups
    },
    {} as Record<string, Member[]>,
  )

  // Sort members alphabetically within each pledge class
  Object.keys(groupedMembers).forEach((pledgeClass) => {
    groupedMembers[pledgeClass].sort((a, b) => a.name.localeCompare(b.name))
  })

  // Handle scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Show scroll-to-top button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="sticky top-0 z-10 bg-white shadow-sm py-4 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-center text-red-800 mb-6">Our Members</h1>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search bar */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            {/* Pledge class filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant={activeFilter === null ? "default" : "outline"}
                onClick={() => setActiveFilter(null)}
                className={`text-sm ${activeFilter === null ? "bg-red-700 hover:bg-red-800" : "text-gray-700 hover:text-red-700"}`}
              >
                All
              </Button>
              {pledgeClasses.map((pledgeClass) => (
                <Button
                  key={pledgeClass}
                  variant={activeFilter === pledgeClass ? "default" : "outline"}
                  onClick={() => setActiveFilter(pledgeClass)}
                  className={`text-sm ${activeFilter === pledgeClass ? "bg-red-700 hover:bg-red-800" : "text-gray-700 hover:text-red-700"}`}
                >
                  {pledgeClass}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {Object.keys(groupedMembers).length > 0 ? (
          Object.entries(groupedMembers)
            .sort(([a], [b]) => sortPledgeClasses(a, b))
            .reverse()
            .map(([pledgeClass, members]) => (
              <div key={pledgeClass} className="mb-12">
                <h2 className="text-xl font-semibold mb-6 text-red-700 border-b border-red-200 pb-2">
                  {pledgeClass}
                  <span className="text-gray-500 text-sm ml-2">({members.length} members)</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {members.map((member) => (
                    <Card
                      key={member.id}
                      className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <CardContent className="p-4">
                        <div className="relative w-full pb-[100%] mb-3 overflow-hidden rounded-md bg-gray-100">
                          <Image
                            src={member.imageUrl || "/placeholder.svg"}
                            alt={member.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <Link
                          href={member.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center font-medium text-gray-800 hover:text-red-600 transition-colors block truncate"
                          title={member.name}
                        >
                          {member.name}
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-12 text-gray-500">No members found matching your search.</div>
        )}
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-red-700 text-white rounded-full shadow-lg hover:bg-red-800 transition-colors duration-300 z-20"
          aria-label="Scroll to top"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  )
}
