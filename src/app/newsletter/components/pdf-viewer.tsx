"use client"

import { useEffect, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"

// Define props interface
interface PDFViewerProps {
  pdfUrl: string
  pageNumber: number
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void
}

export default function PDFViewer({ pdfUrl, pageNumber, onDocumentLoadSuccess }: PDFViewerProps) {
  const [isClient, setIsClient] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if the PDF file exists
  useEffect(() => {
    const checkPdfExists = async () => {
      try {
        const response = await fetch(pdfUrl)
        if (!response.ok) {
          setPdfError(`PDF not found (Status: ${response.status}). Check that the file exists at ${pdfUrl}`)
        } else {
          // Check if the response is actually a PDF
          const contentType = response.headers.get("content-type")
          if (contentType && !contentType.includes("application/pdf")) {
            setPdfError(`File exists but is not a PDF (Content-Type: ${contentType})`)
          } else {
            setPdfError(null)
          }
        }
      } catch (error) {
        setPdfError(`Error checking PDF: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    checkPdfExists()
  }, [pdfUrl])

  useEffect(() => {
    // Only set up pdfjs on the client side
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      setIsClient(true)
    } catch (error) {
      console.error("Error setting up PDF.js worker:", error)
      setPdfError(`Error setting up PDF viewer: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [])

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-[600px] w-full border border-red-800 shadow-md">
        <div className="animate-pulse text-red-700">Initializing PDF viewer...</div>
      </div>
    )
  }

  if (pdfError) {
    return (
      <div className="flex flex-col justify-center items-center h-[600px] w-full border border-red-800 shadow-md p-4">
        <div className="text-red-600 font-medium mb-4">Failed to load PDF</div>
        <div className="text-red-600 text-sm mb-4">{pdfError}</div>
        <div className="text-sm text-gray-700 bg-gray-100 p-4 rounded-md max-w-full overflow-auto">
          <p className="font-medium mb-2">Troubleshooting steps:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Verify the PDF file is in the public directory at the root level</li>
            <li>Check the filename and extension (case-sensitive: "Semester-S25-Newsletter.pdf")</li>
            <li>Try using an absolute URL (e.g., "https://yoursite.com/Semester-S25-Newsletter.pdf")</li>
            <li>Check browser console for additional errors</li>
            <li>Try a different PDF file to see if the issue is specific to this file</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
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
        <div className="flex flex-col justify-center items-center h-[600px] w-full text-red-600 p-4">
          <p className="font-medium mb-2">Failed to render PDF</p>
          <p className="text-sm mb-4">
            The file was found but could not be rendered. It may be corrupted or in an unsupported format.
          </p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Open PDF directly
          </a>
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
  )
}
