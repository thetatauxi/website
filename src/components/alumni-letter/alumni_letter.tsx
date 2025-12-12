"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function AlumniLetterPage() {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState<number>(1)

  // Path to your PDF file
  const pdfUrl = "/Semester S25 Newsletter.pdf"

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset
      return newPageNumber >= 1 && newPageNumber <= (numPages || 1) ? newPageNumber : prevPageNumber
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 bg-gradient-to-b from-red-50 to-yellow-50 min-h-screen">
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-3">
          <div className="h-10 w-10 bg-red-900 text-yellow-400 flex items-center justify-center font-bold text-xl rounded-full">
            Tθ
          </div>
          <h1 className="text-3xl font-bold text-red-900">Theta Tau</h1>
        </div>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-red-900 text-white">
          <CardTitle className="text-center text-2xl">Alumni Letter</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
            >
              <a href={pdfUrl} download>
                <Download className="mr-2 h-4 w-4" />
                Download Letter
              </a>
            </Button>
          </div>

          <div className="flex flex-col items-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              className="border border-red-800 shadow-md"
              loading={
                <div className="flex justify-center items-center h-[600px] w-full">
                  <div className="animate-pulse text-red-700">Loading PDF...</div>
                </div>
              }
              error={
                <div className="flex justify-center items-center h-[600px] w-full text-red-600">
                  Failed to load PDF. Please ensure the file exists at {pdfUrl}
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="max-w-full"
                width={600}
              />
            </Document>

            {numPages && (
              <div className="flex items-center justify-between w-full max-w-md mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <p className="text-sm text-red-800">
                  Page {pageNumber} of {numPages}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages}
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
