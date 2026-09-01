"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"

export default function AlumniLetterPage() {
  const pdfUrl = "/newsletters/2026/feb2026.png"
  const [pdfExists, setPdfExists] = useState(true)

  useEffect(() => {
    const checkPdfExists = async () => {
      try {
        const response = await fetch(pdfUrl, { method: "HEAD" })
        setPdfExists(response.ok)
      } catch {
        setPdfExists(false)
      }
    }
    checkPdfExists()
  }, [])

  return (
    <div className="min-h-full bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">February 2026 Newsletter</h1>
          <p className="text-gray-600 dark:text-gray-400">Stay connected with the latest from Theta Tau</p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mb-6">
          <Button
            variant="outline"
            asChild
            className="border-red-800 text-red-800 dark:border-red-500 dark:text-red-400 hover:bg-red-800 hover:text-white dark:hover:bg-red-900 dark:hover:text-white transition-colors"
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </a>
          </Button>
          <Button
            asChild
            className="bg-red-800 text-white hover:bg-red-900 transition-colors"
          >
            <a href={pdfUrl} download>
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden border border-stone-200 dark:border-zinc-800 transition-colors duration-200">
          <div className="h-[85vh] min-h-[600px]">
            {pdfExists ? (
              <img
                src={pdfUrl}
                alt="February 2026 Newsletter"
                className="w-full h-full object-contain bg-[#EBEBD7] dark:bg-zinc-950"
              />
            ) : (
              <div className="flex flex-col justify-center items-center h-full p-8 text-center">
                <div className="text-red-700 dark:text-red-400 font-semibold text-lg mb-4">
                  Unable to load the newsletter
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  The PDF file could not be found. Please try downloading it directly or check back later.
                </p>
                <Button
                  asChild
                  className="bg-red-800 text-white hover:bg-red-900"
                >
                  <a href={pdfUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Try Download
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
