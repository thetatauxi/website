import Link from "next/link"
import Image from "next/image"
import { Camera, Code, Briefcase, Mail } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black py-6 md:py-0 transition-colors duration-200">
            <div className="container max-w-7xl mx-auto flex flex-col gap-8 md:gap-12 px-4 md:px-6 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resources</h3>
                        <nav className="flex flex-col gap-2">
                            <Link className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:underline" href="/about">
                                About Us
                            </Link>
                            <Link className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:underline" href="/blog">
                                Blog
                            </Link>
                            <Link className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:underline" href="/members">
                                Members
                            </Link>
                            <Link className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:underline" href="/sponsorship">
                                Sponsorship
                            </Link>
                        </nav>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact</h3>
                        <a
                            href="mailto:contact@thetatau.org"
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:underline"
                        >
                            <Mail className="h-5 w-5 text-red-700 dark:text-red-400" aria-hidden="true" />
                            Email
                        </a>
                        <a
                            href="https://www.instagram.com/thetatauxi/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:underline"
                        >
                            <Camera className="h-5 w-5 text-red-700 dark:text-red-400" aria-hidden="true" />
                            Instagram
                        </a>
                        <a
                            href="https://www.linkedin.com/in/thetatauxi/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:underline"
                        >
                            <Briefcase className="h-5 w-5 text-red-700 dark:text-red-400" aria-hidden="true" />
                            LinkedIn
                        </a>
                    </div>
                    <div className="flex flex-col gap-2 justify-center items-start">
                        <Image
                            src="/ASM Black and White Logo & Disclaimer - Transparent.png"
                            alt="ASM Logo"
                            width={300}
                            height={150}
                            className="object-contain dark:invert dark:opacity-90 transition-all"
                        />
                    </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
                                © {new Date().getFullYear()} Theta Tau Engineering Fraternity. All rights reserved.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <a
                                href="https://github.com/thetatauxi/website"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:underline"
                            >
                                <Code className="h-4 w-4" aria-hidden="true" />
                                View on GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
