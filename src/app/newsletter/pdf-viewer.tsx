import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

interface PDFViewerProps {
  pdfUrl: string;
  pageNumber: number;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
}

export default function PDFViewer({ pdfUrl, pageNumber, onDocumentLoadSuccess }: PDFViewerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure this runs only in the browser
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      setIsClient(true);
    }
  }, []);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-[600px] w-full border border-red-800 shadow-md">
        <div className="animate-pulse text-red-700">Loading PDF viewer...</div>
      </div>
    );
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
  );
}