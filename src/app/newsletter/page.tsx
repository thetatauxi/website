"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, ExternalLink } from "lucide-react"

export default function AlumniLetterPage() {
  const [pdfUrl, setPdfUrl] = useState("/Semester S25 Newsletter.pdf")
  const [pdfExists, setPdfExists] = useState(false)

  // Check if the PDF file exists
  useEffect(() => {
    const checkPdfExists = async () => {
      try {
        const response = await fetch(pdfUrl)
        setPdfExists(response.ok)
        console.log(`PDF check at ${pdfUrl}: ${response.ok ? "Found" : "Not found"}`)
      } catch (error) {
        console.error(`Error checking PDF at ${pdfUrl}:`, error)
        setPdfExists(false)
      }
    }

    checkPdfExists()
  }, [pdfUrl])

  return (
    <div className="container mx-auto py-8 px-4 bg-gradient-to-b from-red-50 to-yellow-50 min-h-screen">
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-3">
          <div className="h-10 w-10 bg-red-900 text-yellow-400 flex items-center justify-center font-bold text-xl rounded-full">
            θT
          </div>
          <h1 className="text-3xl font-bold text-red-900">Theta Tau</h1>
        </div>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-red-900 text-white">
          <CardTitle className="text-center text-2xl">Spring 2025 Newsletter</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500">Current path: {pdfUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
              >
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open PDF
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
              >
                <a href={pdfUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center">
            {/* PDF Viewer using iframe - much more reliable than react-pdf */}
            <div className="w-full border border-red-800 shadow-md" style={{ height: "800px" }}>
              {pdfExists ? (
                <iframe src={`${pdfUrl}#toolbar=0&navpanes=0`} className="w-full h-full" title="Alumni Letter PDF" />
              ) : (
                <div className="flex flex-col justify-center items-center h-full p-4">
                  <div className="text-red-600 font-medium mb-4">Failed to load PDF</div>
                  <div className="text-sm text-gray-700 bg-gray-100 p-4 rounded-md max-w-full overflow-auto">
                    <p className="font-medium mb-2">Troubleshooting steps:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Verify the PDF file is in the public directory at the root level</li>
                      <li>Check the filename and extension (case-sensitive: "Semester-S25-Newsletter.pdf")</li>
                      <li>Try uploading the PDF again</li>
                      <li>Check if the PDF can be opened directly in a browser</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
