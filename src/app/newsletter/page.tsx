"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"

export default function AlumniLetterPage() {
  const pdfUrl = "/Semester S25 Newsletter.pdf"
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
    <div className="min-h-full bg-linear-to-b from-stone-50 to-stone-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-stone-900 mb-2">Spring 2025 Newsletter</h1>
          <p className="text-stone-600">Stay connected with the latest from Theta Tau</p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mb-6">
          <Button
            variant="outline"
            asChild
            className="border-red-800 text-red-800 hover:bg-red-800 hover:text-white transition-colors"
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
              Download PDF
            </a>
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-stone-200">
          <div className="h-[85vh] min-h-[600px]">
            {pdfExists ? (
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full"
                title="Spring 2025 Newsletter"
              />
            ) : (
              <div className="flex flex-col justify-center items-center h-full p-8 text-center">
                <div className="text-red-700 font-semibold text-lg mb-4">
                  Unable to load the newsletter
                </div>
                <p className="text-stone-600 mb-6 max-w-md">
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
