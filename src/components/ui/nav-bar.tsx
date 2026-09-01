"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { X, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import { logoutAction } from "@/app/actions"
import { useAuthLoading } from "@/components/providers/auth-loading-provider"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { showAuthLoading } = useAuthLoading()

  return (
    <>
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-200">
        <div className="container max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-20 px-3 relative">
            <Link href="/" className="flex-shrink-0" aria-label="Theta Tau home">
              <LogoIcon className="h-10 w-10 text-primary transition-colors" />
            </Link>

            {pathname === "/members-only" && (
              <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
                <span className="text-sm sm:text-lg md:text-xl font-bold text-red-800 dark:text-red-500 tracking-wider whitespace-nowrap">
                  MEMBER PORTAL
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Switcher */}
              <ThemeToggle />

              {pathname === "/members-only" && (
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all active:scale-95"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed top-0 right-0 h-full w-[300px] sm:w-[400px] bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800/60">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav id="mobile-menu" className="flex flex-col gap-2 mt-4 px-6">
                <NavLink href="/" onClick={() => setIsOpen(false)}>
                  <span className="text-lg">Home</span>
                </NavLink>
                <NavLink href="/about" onClick={() => setIsOpen(false)}>
                  <span className="text-lg">About Us</span>
                </NavLink>
                <NavLink href="/rush" onClick={() => setIsOpen(false)}>
                  <span className="text-lg">Rush</span>
                </NavLink>
                <NavLink href="/blog" onClick={() => setIsOpen(false)}>
                  <span className="text-lg">Blog</span>
                </NavLink>
                <NavLink href="/members" onClick={() => setIsOpen(false)}>
                  <span className="text-lg">Members</span>
                </NavLink>
                <NavLink href="/sponsorship" onClick={() => setIsOpen(false)}>
                  <span className="text-lg">Sponsorship</span>
                </NavLink>
                <NavLink href="/newsletter" onClick={() => setIsOpen(false)}>
                  <span className="text-lg">Newsletter</span>
                </NavLink>
                <div className="my-2 border-t border-gray-200 dark:border-gray-800"></div>
                <NavLink
                  href="/members-only"
                  onClick={() => {
                    setIsOpen(false)
                    showAuthLoading()
                  }}
                >
                  <span className="text-lg font-semibold text-red-800 dark:text-red-400">Member Portal</span>
                </NavLink>
              </nav>
            </div>

            {/* Mobile Footer with Theme Toggle */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Appearance
              </span>
              <ThemeToggle showLabel className="bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        </>
      )}
    </>
  )
}

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-gray-700 dark:text-gray-200 hover:text-red-800 dark:hover:text-red-400 flex items-center px-3 py-2 rounded-md text-sm font-medium nav-link transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
    >
      {children}
    </Link>
  )
}

function LogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 500 500"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      aria-hidden="true"
      {...props}
    >
      <g
        transform="translate(0.000000,500.000000) scale(0.100000,-0.100000)"
        fill="currentColor"
        stroke="none"
        vectorEffect="non-scaling-stroke"
      >
        <path
          d="M1119 3764 c-247 -44 -471 -158 -642 -327 -179 -176 -289 -388 -343
-662 -25 -126 -25 -414 0 -540 124 -623 588 -1015 1202 -1015 147 0 247 13
363 46 202 59 360 152 507 299 175 174 284 381 341 648 26 118 25 468 0 585
-54 246 -156 447 -308 607 -181 190 -424 318 -683 360 -112 18 -335 18 -437
-1z m379 -140 c84 -17 195 -65 264 -112 146 -101 266 -289 322 -505 53 -203
60 -266 61 -532 0 -221 -3 -263 -23 -362 -28 -141 -62 -245 -115 -353 -57
-116 -186 -247 -302 -307 -139 -72 -209 -88 -370 -88 -126 1 -148 4 -220 28
-121 42 -219 102 -304 187 -88 86 -130 154 -179 283 -160 428 -123 1077 82
1420 163 274 468 406 784 341z"
        />
        <path
          d="M817 2823 c-3 -5 0 -42 5 -83 10 -79 4 -479 -7 -517 -7 -20 -4 -23
23 -23 26 0 32 5 42 36 18 54 96 130 148 144 29 7 138 10 335 8 276 -3 294 -4
332 -24 50 -27 67 -46 100 -111 21 -42 31 -53 51 -53 l24 0 -7 88 c-10 114
-10 344 0 455 l8 87 -25 0 c-20 0 -29 -9 -44 -43 -28 -63 -77 -113 -130 -134
-41 -16 -81 -18 -332 -18 -209 0 -295 3 -322 13 -49 17 -112 82 -135 137 -13
34 -23 45 -40 45 -12 0 -24 -3 -26 -7z"
        />
        <path
          d="M2806 3578 c-3 -90 -7 -230 -8 -313 l-3 -150 45 0 45 0 6 65 c14 135
77 251 173 316 88 60 187 84 381 94 94 5 178 10 188 10 16 0 17 -52 15 -1058
l-3 -1058 -28 -42 c-37 -57 -90 -81 -203 -94 l-94 -11 0 -28 0 -29 520 0 520
0 0 29 0 28 -97 11 c-115 13 -174 44 -207 107 -21 40 -21 47 -24 1093 l-2
1052 142 -5 c174 -8 262 -19 335 -45 163 -57 256 -175 283 -358 5 -37 10 -71
10 -75 0 -5 19 -7 43 -5 l42 3 -3 210 c-1 116 -5 256 -8 313 l-6 102 -1028 0
-1028 0 -6 -162z"
        />
      </g>
    </svg>
  )
}
