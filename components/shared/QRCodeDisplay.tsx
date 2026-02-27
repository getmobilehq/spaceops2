"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Printer, Copy, Check } from "lucide-react"

export function QRCodeDisplay({
  qrCodeUrl,
  roomName,
  scanUrl,
}: {
  qrCodeUrl: string
  roomName: string
  scanUrl: string
}) {
  const [copied, setCopied] = useState(false)

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/qr-codes/${qrCodeUrl}`

  async function handleDownload() {
    const res = await fetch(publicUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${roomName.replace(/\s+/g, "-").toLowerCase()}-qr.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${roomName} - QR Code</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; }
            img { width: 300px; height: 300px; }
            h2 { margin-top: 16px; font-size: 18px; color: #0D1B2A; }
            p { margin-top: 4px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <img src="${publicUrl}" alt="QR Code" />
          <h2>${roomName}</h2>
          <p>${scanUrl}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(scanUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={publicUrl}
        alt={`QR code for ${roomName}`}
        className="w-48 h-48 rounded border"
      />
      <p className="text-xs text-muted-foreground break-all text-center max-w-[200px]">
        {scanUrl}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-1 h-3.5 w-3.5" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-1 h-3.5 w-3.5" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Copy className="mr-1 h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy URL"}
        </Button>
      </div>
    </div>
  )
}
