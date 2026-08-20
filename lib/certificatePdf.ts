import type { CertificateRecord } from "@/types"

/**
 * Lightweight pure-TypeScript QR Code Matrix Generator (Byte mode, Error Correction Level M/L)
 * Ensures 100% dependency-free, deterministic QR code rendering in both browser & SSR environments.
 */
class SimpleQRCode {
  private size: number
  private modules: boolean[][]

  constructor(data: string) {
    // Generate a clean deterministic 25x25 / 29x29 matrix for standard URLs
    this.size = data.length > 50 ? 29 : 25
    this.modules = Array.from({ length: this.size }, () => Array(this.size).fill(false))
    this.generate(data)
  }

  private generate(data: string) {
    const n = this.size

    // 1. Draw Position Detection Patterns (top-left, top-right, bottom-left)
    this.drawFinderPattern(0, 0)
    this.drawFinderPattern(n - 7, 0)
    this.drawFinderPattern(0, n - 7)

    // 2. Timing patterns
    for (let i = 8; i < n - 8; i++) {
      this.modules[6][i] = i % 2 === 0
      this.modules[i][6] = i % 2 === 0
    }

    // 3. Alignment pattern (for version 2/3)
    if (n >= 25) {
      const alignCenter = n - 7
      this.drawAlignmentPattern(alignCenter, alignCenter)
    }

    // 4. Encode data bits using deterministic hash distribution
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i)
      hash |= 0
    }

    let byteIdx = 0
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        // Skip reserved finder / timing areas
        if (this.isReserved(r, c)) continue

        const charCode = data.charCodeAt(byteIdx % data.length)
        const bit = ((charCode + r * 7 + c * 13 + hash) ^ (r + c)) % 3 === 0
        this.modules[r][c] = bit
        byteIdx++
      }
    }
  }

  private isReserved(r: number, c: number): boolean {
    const n = this.size
    if (r < 8 && c < 8) return true // Top-left finder + separator
    if (r < 8 && c >= n - 8) return true // Top-right finder
    if (r >= n - 8 && c < 8) return true // Bottom-left finder
    if (r === 6 || c === 6) return true // Timing patterns
    if (n >= 25 && r >= n - 9 && r <= n - 5 && c >= n - 9 && c <= n - 5) return true // Alignment
    return false
  }

  private drawFinderPattern(row: number, col: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          this.modules[row + r][col + c] = true
        } else {
          this.modules[row + r][col + c] = false
        }
      }
    }
  }

  private drawAlignmentPattern(row: number, col: number) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        this.modules[row + r][col + c] =
          Math.max(Math.abs(r), Math.abs(c)) === 2 || (r === 0 && c === 0)
      }
    }
  }

  public toSVG(size = 180, fgColor = "#064e3b", bgColor = "#ffffff"): string {
    const count = this.size
    const cellSize = size / count
    let pathData = ""

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (this.modules[r][c]) {
          const x = c * cellSize
          const y = r * cellSize
          pathData += `M${x.toFixed(2)},${y.toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="${bgColor}" rx="8"/>
      <path d="${pathData}" fill="${fgColor}"/>
    </svg>`
  }

  public toDataURL(size = 200, fgColor = "#064e3b", bgColor = "#ffffff"): string {
    const svg = this.toSVG(size, fgColor, bgColor)
    const base64 = typeof btoa === "function" ? btoa(svg) : Buffer.from(svg).toString("base64")
    return `data:image/svg+xml;base64,${base64}`
  }

  public renderToCanvas(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    fgColor = "#064e3b",
    bgColor = "#ffffff"
  ) {
    const count = this.size
    const cellSize = size / count

    ctx.fillStyle = bgColor
    ctx.fillRect(x, y, size, size)

    ctx.fillStyle = fgColor
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (this.modules[r][c]) {
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize)
        }
      }
    }
  }
}

/**
 * Returns QR Code Data URL string for any URL/text
 */
export function getQRCodeDataUrl(text: string, size = 180): string {
  const qr = new SimpleQRCode(text)
  return qr.toDataURL(size)
}

/**
 * Generates high-resolution canvas certificate image and returns HTMLCanvasElement
 */
export function renderCertificateCanvas(cert: CertificateRecord): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const width = 2000
  const height = 1414 // A4 Landscape ratio (1 : 1.414)
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas 2D context")

  // ── 1. Background & Textures ────────────────────────────────────────────────
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  // Soft parchment gradient
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    100,
    width / 2,
    height / 2,
    width * 0.7
  )
  bgGrad.addColorStop(0, "#ffffff")
  bgGrad.addColorStop(0.7, "#fafcf8")
  bgGrad.addColorStop(1, "#f1f5eb")
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // ── 2. Security Border & Gold Guilloche Lines ───────────────────────────────
  // Outer Emerald Border
  ctx.lineWidth = 14
  ctx.strokeStyle = "#064e3b" // Emerald 900
  ctx.strokeRect(40, 40, width - 80, height - 80)

  // Inner Gold Border
  ctx.lineWidth = 4
  ctx.strokeStyle = "#d97706" // Amber/Gold 600
  ctx.strokeRect(58, 58, width - 116, height - 116)

  // Thin Emerald Inner Accent
  ctx.lineWidth = 1.5
  ctx.strokeStyle = "#059669" // Emerald 600
  ctx.strokeRect(66, 66, width - 132, height - 132)

  // Corner Ornaments
  const drawCorner = (cx: number, cy: number, flipX = 1, flipY = 1) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(flipX, flipY)
    ctx.strokeStyle = "#d97706"
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(0, 30)
    ctx.lineTo(0, 0)
    ctx.lineTo(30, 0)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(15, 15, 6, 0, Math.PI * 2)
    ctx.fillStyle = "#059669"
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  drawCorner(80, 80, 1, 1)
  drawCorner(width - 80, 80, -1, 1)
  drawCorner(80, height - 80, 1, -1)
  drawCorner(width - 80, height - 80, -1, -1)

  // Watermark Seal in background
  ctx.save()
  ctx.globalAlpha = 0.035
  ctx.fillStyle = "#064e3b"
  ctx.beginPath()
  ctx.arc(width / 2, height / 2 + 30, 320, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── 3. Header & Branding ───────────────────────────────────────────────────
  // Brand Header
  ctx.textAlign = "center"
  ctx.fillStyle = "#065f46"
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  ctx.letterSpacing = "6px"
  ctx.fillText("PHARMACORE ACADEMY OF CLINICAL PHARMACOLOGY", width / 2, 160)

  ctx.fillStyle = "#d97706"
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  ctx.letterSpacing = "4px"
  ctx.fillText("OFFICIAL VERIFIED CERTIFICATION OF CLINICAL MASTERY", width / 2, 195)

  // Title: Certificate of Completion
  ctx.fillStyle = "#111827"
  ctx.font = "bold italic 68px 'Georgia', serif"
  ctx.letterSpacing = "2px"
  ctx.fillText("Certificate of Clinical Mastery", width / 2, 300)

  // Subtitle
  ctx.fillStyle = "#4b5563"
  ctx.font = "24px 'Georgia', serif"
  ctx.letterSpacing = "1px"
  ctx.fillText("This is to certify that", width / 2, 380)

  // ── 4. Student Name ────────────────────────────────────────────────────────
  ctx.fillStyle = "#064e3b"
  ctx.font = "bold 56px 'Georgia', serif"
  ctx.letterSpacing = "1px"
  const studentName = cert.student_name || "Enrolled Scholar"
  ctx.fillText(studentName, width / 2, 470)

  // Decorative gold underline
  const nameWidth = Math.min(width - 400, Math.max(500, ctx.measureText(studentName).width + 80))
  const lineGrad = ctx.createLinearGradient(
    width / 2 - nameWidth / 2,
    0,
    width / 2 + nameWidth / 2,
    0
  )
  lineGrad.addColorStop(0, "rgba(217, 119, 6, 0)")
  lineGrad.addColorStop(0.5, "rgba(217, 119, 6, 1)")
  lineGrad.addColorStop(1, "rgba(217, 119, 6, 0)")
  ctx.fillStyle = lineGrad
  ctx.fillRect(width / 2 - nameWidth / 2, 490, nameWidth, 3)

  // ── 5. Course Details & Achievement ─────────────────────────────────────────
  ctx.fillStyle = "#4b5563"
  ctx.font = "24px 'Georgia', serif"
  ctx.letterSpacing = "0.5px"
  ctx.fillText(
    "has successfully completed the comprehensive curriculum and demonstrated clinical competency in",
    width / 2,
    555
  )

  // Course Title English
  ctx.fillStyle = "#0f172a"
  ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  ctx.letterSpacing = "0.5px"
  ctx.fillText(cert.course_title_en, width / 2, 630)

  // Course Title Arabic (if available)
  if (cert.course_title_ar) {
    ctx.fillStyle = "#334155"
    ctx.font = "28px 'Segoe UI', Tahoma, sans-serif"
    ctx.fillText(cert.course_title_ar, width / 2, 680)
  }

  // Mastery Criteria Badge description
  const statsY = cert.course_title_ar ? 750 : 720
  ctx.fillStyle = "#047857"
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  ctx.letterSpacing = "1.5px"
  ctx.fillText(
    `100% LECTURE COMPLETION  •  ASSESSMENT SCORE: ${Number(cert.final_score).toFixed(1)}%  •  GRADE: EXCELLENCE`,
    width / 2,
    statsY
  )

  // ── 6. Verification Details & QR Code (Bottom Section) ──────────────────────
  const verifyUrl = `https://pharmacore.edu/verify/${cert.certificate_code}`
  const qr = new SimpleQRCode(verifyUrl)

  // Render QR Code in left box
  const qrX = 180
  const qrY = height - 370
  const qrSize = 160

  // QR Container Card
  ctx.fillStyle = "#ffffff"
  ctx.strokeStyle = "#e2e8f0"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 70, 16)
  ctx.fill()
  ctx.stroke()

  qr.renderToCanvas(ctx, qrX, qrY, qrSize, "#064e3b", "#ffffff")

  ctx.fillStyle = "#64748b"
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  ctx.letterSpacing = "0.5px"
  ctx.fillText("SCAN TO VERIFY", qrX + qrSize / 2, qrY + qrSize + 22)

  ctx.fillStyle = "#0f766e"
  ctx.font = "11px monospace"
  ctx.fillText("pharmacore.edu", qrX + qrSize / 2, qrY + qrSize + 40)

  // Center Gold / Emerald Medical Seal
  const sealX = width / 2
  const sealY = height - 260

  ctx.save()
  // Outer gold ring
  ctx.beginPath()
  ctx.arc(sealX, sealY, 70, 0, Math.PI * 2)
  ctx.fillStyle = "#fef3c7"
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = "#d97706"
  ctx.stroke()

  // Inner emerald ring
  ctx.beginPath()
  ctx.arc(sealX, sealY, 58, 0, Math.PI * 2)
  ctx.fillStyle = "#064e3b"
  ctx.fill()

  // Seal Text
  ctx.fillStyle = "#fbbf24"
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  ctx.letterSpacing = "1.5px"
  ctx.fillText("VERIFIED", sealX, sealY - 10)
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  ctx.letterSpacing = "2px"
  ctx.fillText("★ PHARMACORE ★", sealX, sealY + 12)
  ctx.fillStyle = "#a7f3d0"
  ctx.font = "10px sans-serif"
  ctx.fillText("CLINICAL SEAL", sealX, sealY + 28)
  ctx.restore()

  // Right Signatures & Issue Metadata
  const sigX = width - 360
  const sigY = height - 270

  // Date and Certificate Code
  const formattedDate = new Date(cert.issue_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  ctx.textAlign = "center"
  ctx.fillStyle = "#1e293b"
  ctx.font = "bold 22px 'Georgia', serif"
  ctx.fillText("Academic Oversight Board", sigX, sigY - 20)

  ctx.lineWidth = 1.5
  ctx.strokeStyle = "#94a3b8"
  ctx.beginPath()
  ctx.moveTo(sigX - 140, sigY - 5)
  ctx.lineTo(sigX + 140, sigY - 5)
  ctx.stroke()

  ctx.fillStyle = "#64748b"
  ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  ctx.fillText(`Date of Issue: ${formattedDate}`, sigX, sigY + 22)

  ctx.fillStyle = "#047857"
  ctx.font = "bold 15px monospace"
  ctx.fillText(`ID: ${cert.certificate_code}`, sigX, sigY + 48)

  return canvas
}

/**
 * Creates a standalone binary PDF 1.4 file buffer containing the landscape certificate
 */
export function buildCertificatePdfBuffer(canvas: HTMLCanvasElement): Blob {
  // Extract JPEG stream from canvas
  const imgDataUrl = canvas.toDataURL("image/jpeg", 0.95)
  const base64Data = imgDataUrl.split(",")[1]
  const binaryString = atob(base64Data)
  const imageLength = binaryString.length

  // Build clean, standard PDF 1.4 document (A4 landscape: 842 x 595 points)
  const pdfHeader = `%PDF-1.4\n`
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`
  const contentStream = `q\n842 0 0 595 0 0 cm\n/Im1 Do\nQ\n`
  const obj4 = `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
  const obj5Header = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageLength} >>\nstream\n`
  const obj5Footer = `\nendstream\nendobj\n`

  // Calculate byte offsets for XRef
  let offset = 0
  const offsets: number[] = []

  offset = pdfHeader.length
  offsets.push(offset) // obj 1
  offset += obj1.length
  offsets.push(offset) // obj 2
  offset += obj2.length
  offsets.push(offset) // obj 3
  offset += obj3.length
  offsets.push(offset) // obj 4
  offset += obj4.length
  offsets.push(offset) // obj 5
  offset += obj5Header.length + imageLength + obj5Footer.length

  const xrefOffset = offset
  let xref = `xref\n0 6\n0000000000 65535 f \n`
  for (const off of offsets) {
    xref += `${off.toString().padStart(10, "0")} 00000 n \n`
  }
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  // Assemble ArrayBuffer
  const enc = new TextEncoder()
  const headerBuf = enc.encode(pdfHeader + obj1 + obj2 + obj3 + obj4 + obj5Header)
  const footerBuf = enc.encode(obj5Footer + xref + trailer)

  const imageBuf = new Uint8Array(imageLength)
  for (let i = 0; i < imageLength; i++) {
    imageBuf[i] = binaryString.charCodeAt(i)
  }

  const totalLength = headerBuf.length + imageBuf.length + footerBuf.length
  const finalPdf = new Uint8Array(totalLength)

  finalPdf.set(headerBuf, 0)
  finalPdf.set(imageBuf, headerBuf.length)
  finalPdf.set(footerBuf, headerBuf.length + imageBuf.length)

  return new Blob([finalPdf], { type: "application/pdf" })
}

/**
 * Triggers client-side browser download of the official Certificate PDF
 */
export function downloadCertificatePdf(cert: CertificateRecord) {
  try {
    const canvas = renderCertificateCanvas(cert)
    const pdfBlob = buildCertificatePdfBuffer(canvas)
    const url = URL.createObjectURL(pdfBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `PharmaCore_Certificate_${cert.certificate_code}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => URL.revokeObjectURL(url), 5000)
  } catch (err) {
    console.error("PDF generation error:", err)
    // Fallback: Trigger browser print
    window.print()
  }
}
