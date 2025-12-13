"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronUp } from "lucide-react"
import { members, type Member, sortPledgeClasses } from "@/lib/members"

// Memoized Member Card Component
const MemberCard = memo(({ member }: { member: Member }) => {
  return (
    <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="relative w-full pb-[100%] mb-3 overflow-hidden rounded-md bg-gray-100">
          <Image
            src={member.imageUrl || "/placeholder.svg"}
            alt={member.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
            quality={85}
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
  )
})

MemberCard.displayName = "MemberCard"

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Memoize pledge classes - only recalculate if members change
  const pledgeClasses = useMemo(
    () =>
      Array.from(new Set(members.map((member) => member.pledgeClass)))
        .sort(sortPledgeClasses)
        .reverse(), // Most recent first
    [],
  )

  // Memoize filtered members - only recalculate when searchTerm or activeFilter changes
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = !activeFilter || member.pledgeClass === activeFilter
      return matchesSearch && matchesFilter
    })
  }, [searchTerm, activeFilter])

  // Memoize grouped members - only recalculate when filteredMembers changes
  const groupedMembers = useMemo(() => {
    const grouped = filteredMembers.reduce(
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
    Object.keys(grouped).forEach((pledgeClass) => {
      grouped[pledgeClass].sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  }, [filteredMembers])

  // Memoize sorted pledge class entries
  const sortedPledgeClassEntries = useMemo(() => {
    return Object.entries(groupedMembers)
      .sort(([a], [b]) => sortPledgeClasses(a, b))
      .reverse()
  }, [groupedMembers])

  // Memoize scroll to top handler
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  // Memoize filter handlers
  const handleFilterChange = useCallback((filter: string | null) => {
    setActiveFilter(filter)
  }, [])

  // Show scroll-to-top button when scrolled down with throttling
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const next = window.scrollY > 300
          setShowScrollTop((prev) => (prev === next ? prev : next))
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
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
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange(null)}
                className={`hover:cursor-pointer border ${
                  activeFilter === null
                    ? "bg-red-700 text-white border-transparent hover:bg-red-800"
                    : "bg-white text-gray-700 border-gray-300 hover:text-red-700 hover:border-red-300"
                }`}
              >
                All
              </Button>
              {pledgeClasses.map((pledgeClass) => (
                <Button
                  key={pledgeClass}
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange(pledgeClass)}
                  className={`hover:cursor-pointer border ${
                    activeFilter === pledgeClass
                      ? "bg-red-700 text-white border-transparent hover:bg-red-800"
                      : "bg-white text-gray-700 border-gray-300 hover:text-red-700 hover:border-red-300"
                  }`}
                >
                  {pledgeClass}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {sortedPledgeClassEntries.length > 0 ? (
          sortedPledgeClassEntries.map(([pledgeClass, members]) => (
            <div key={pledgeClass} className="mb-12">
              <h2 className="text-xl font-semibold mb-6 text-red-700 border-b border-red-200 pb-2">
                {pledgeClass}
                <span className="text-gray-500 text-sm ml-2">({members.length} members)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {members.map((member) => (
                  <MemberCard key={member.id} member={member} />
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
