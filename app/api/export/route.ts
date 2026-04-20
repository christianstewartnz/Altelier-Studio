import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import sharp from "sharp"
import PDFDocument from "pdfkit"
import archiver from "archiver"

// ─── Types ────────────────────────────────────────────────────────────────────

type LogoComposition = {
  style: string
  lines: string[]
  punctuation: string
  punctuationPosition: string
  weight: "light" | "regular" | "bold"
  tracking: "tight" | "normal" | "wide" | "ultrawide"
  case: "upper" | "title" | "lower"
}

type ConceptRow = {
  id: string
  project_id: string
  brand_name: string
  tagline: string
  summary: string
  rationale: string
  colors: string[]
  wordmark_color: string
  color_rationale: string
  fonts: { heading: string; body: string }
  logo_text: string
  logo_composition: LogoComposition
  voice_sample: string
  attributes: string[]
}

type ProjectRow = {
  id: string
  user_id: string
  project_name: string
  paid_at: string | null
}

// ─── Pure SVG string generation (mirrors WordmarkSVG component exactly) ───────
// Cannot import WordmarkSVG (client component) or react-dom/server in a route.

const CHAR_WIDTH_FACTOR = 0.62

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function applyCase(text: string, c: string): string {
  if (c === "upper") return text.toUpperCase()
  if (c === "lower") return text.toLowerCase()
  return text
}

function letterSpacingFromTracking(t: string): string {
  if (t === "tight") return "-0.05em"
  if (t === "wide") return "0.2em"
  if (t === "ultrawide") return "0.45em"
  return "0.05em"
}

function fontWeightFromWeight(w: string): number {
  if (w === "light") return 300
  if (w === "bold") return 700
  return 400
}

function trackingEmValue(t: string): number {
  if (t === "tight") return -0.05
  if (t === "wide") return 0.20
  if (t === "ultrawide") return 0.45
  return 0.05
}

function estimateTextWidth(text: string, fontSize: number, tracking: string): number {
  return text.length * fontSize * (CHAR_WIDTH_FACTOR + trackingEmValue(tracking))
}

function textLengthAttr(text: string, fontSize: number, tracking: string, maxWidth: number): number | undefined {
  return estimateTextWidth(text, fontSize, tracking) > maxWidth ? maxWidth : undefined
}

function computeUltrawideSpacing(text: string, fontSize: number, maxWidth: number): string {
  if (!text || text.length === 0) return "0.55em"
  const charTotalWidth = text.length * fontSize * CHAR_WIDTH_FACTOR
  if (charTotalWidth >= maxWidth) return "0.05em"
  const spacingPx = (maxWidth - charTotalWidth) / text.length
  const spacingEm = spacingPx / fontSize
  const clamped = Math.min(0.55, Math.max(0.05, spacingEm))
  return `${clamped.toFixed(3)}em`
}

function tlAttrs(tl: number | undefined): string {
  return tl !== undefined ? ` textLength="${tl}" lengthAdjust="spacingAndGlyphs"` : ""
}

function textEl(
  x: number | string,
  y: number,
  opts: {
    anchor?: string
    fontSize: number
    fontFamily: string
    fontWeight?: number | string
    fill: string
    letterSpacing: string
    tl?: number | undefined
    content: string
  },
): string {
  const anchor = opts.anchor ?? "middle"
  const fw = opts.fontWeight !== undefined ? ` font-weight="${opts.fontWeight}"` : ""
  return (
    `<text x="${x}" y="${y}" text-anchor="${anchor}"` +
    ` font-size="${opts.fontSize}" font-family="${opts.fontFamily}"${fw}` +
    ` fill="${opts.fill}" letter-spacing="${opts.letterSpacing}"${tlAttrs(opts.tl)}>` +
    `${opts.content}</text>`
  )
}

function buildSvgString(
  composition: LogoComposition,
  color: string,
  headingFont: string,
  bgColor?: string,
): string {
  const { style, lines, punctuation, tracking, case: textCase, weight } = composition
  const fill = color?.trim() ? color : "#171717"
  const ff = `'${headingFont}', serif`
  const ls = letterSpacingFromTracking(tracking)
  const fw = fontWeightFromWeight(weight)
  const line0 = xmlEscape(lines[0] ? applyCase(lines[0], textCase) : "")
  const line1 = xmlEscape(lines[1] ? applyCase(lines[1], textCase) : "")
  const punct = xmlEscape(punctuation && punctuation !== "none" ? punctuation : "—")
  const bg = bgColor ? `<rect width="100%" height="100%" fill="${bgColor}"/>` : ""
  const open = `<svg viewBox="0 0 400 120" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">`

  let body = ""

  if (style === "inline-clean") {
    const tl = textLengthAttr(line0, 48, tracking, 370)
    body = textEl(200, 70, { fontSize: 48, fontFamily: ff, fontWeight: fw, fill, letterSpacing: ls, tl, content: line0 })
  } else if (style === "inline-ruled") {
    const tl = textLengthAttr(line0, 48, tracking, 370)
    body = textEl(200, 70, { fontSize: 48, fontFamily: ff, fontWeight: fw, fill, letterSpacing: ls, tl, content: line0 })
      + `<rect x="40" y="85" width="320" height="1" fill="${fill}"/>`
  } else if (style === "stacked-ruled") {
    const tl0 = textLengthAttr(line0, 42, tracking, 370)
    const tl1 = textLengthAttr(line1, 42, tracking, 370)
    body = textEl(200, 45, { fontSize: 42, fontFamily: ff, fontWeight: fw, fill, letterSpacing: ls, tl: tl0, content: line0 })
      + `<rect x="40" y="58" width="320" height="1" fill="${fill}"/>`
      + textEl(200, 92, { fontSize: 42, fontFamily: ff, fontWeight: fw, fill, letterSpacing: ls, tl: tl1, content: line1 })
  } else if (style === "stacked-punctuation") {
    const fontSize = 42
    const trackingPx = tracking === "tight" ? -2 : tracking === "wide" ? 8 : tracking === "ultrawide" ? 20 : 2
    const textWidth = line1.length * (fontSize * CHAR_WIDTH_FACTOR + trackingPx)
    const punctWidth = 24 * CHAR_WIDTH_FACTOR
    const totalWidth = textWidth + 8 + punctWidth
    const clampedWidth = Math.min(360, totalWidth)
    const startX = (400 - clampedWidth) / 2
    const tl0 = textLengthAttr(line0, fontSize, tracking, 370)
    const applyLine1TL = totalWidth > 360
    body = textEl(200, 45, { fontSize: 42, fontFamily: ff, fill, letterSpacing: ls, tl: tl0, content: line0 })
      + `<text x="${startX}" y="88" text-anchor="start" font-size="42" font-family="${ff}" fill="${fill}" letter-spacing="${ls}"${applyLine1TL ? ` textLength="360" lengthAdjust="spacingAndGlyphs"` : ""}>`
      + `${line1}<tspan font-size="24" dy="12" dx="8" letter-spacing="0">${punct}</tspan></text>`
  } else if (style === "stacked-weighted") {
    const tl0 = textLengthAttr(line0, 52, tracking, 370)
    const tl1 = textLengthAttr(line1, 28, tracking, 370)
    body = textEl(200, 50, { fontSize: 52, fontFamily: ff, fontWeight: 700, fill, letterSpacing: ls, tl: tl0, content: line0 })
      + textEl(200, 92, { fontSize: 28, fontFamily: ff, fontWeight: 300, fill, letterSpacing: ls, tl: tl1, content: line1 })
  } else if (style === "offset-subtitle") {
    const tl0 = textLengthAttr(line0, 52, tracking, 370)
    const tl1 = textLengthAttr(line1, 17, "normal", 310)
    body = textEl(200, 60, { fontSize: 52, fontFamily: ff, fontWeight: fw, fill, letterSpacing: ls, tl: tl0, content: line0 })
      + textEl(320, 92, { anchor: "end", fontSize: 17, fontFamily: ff, fontWeight: 300, fill, letterSpacing: "0.12em", tl: tl1, content: line1 })
  } else if (style === "weight-contrast") {
    const tl0 = textLengthAttr(line0, 50, tracking, 370)
    const tl1 = textLengthAttr(line1, 38, tracking, 370)
    body = textEl(200, 55, { fontSize: 50, fontFamily: ff, fontWeight: 800, fill, letterSpacing: ls, tl: tl0, content: line0 })
      + textEl(200, 95, { fontSize: 38, fontFamily: ff, fontWeight: 200, fill, letterSpacing: ls, tl: tl1, content: line1 })
  } else if (style === "scale-contrast") {
    const tl0 = textLengthAttr(line0, 64, tracking, 370)
    body = textEl(200, 68, { fontSize: 64, fontFamily: ff, fontWeight: fw, fill, letterSpacing: ls, tl: tl0, content: line0 })
      + textEl(200, 100, { fontSize: 14, fontFamily: ff, fontWeight: 300, fill, letterSpacing: "0.35em", content: line1.toUpperCase() })
  } else if (style === "ultrawide") {
    const uwSpacing = computeUltrawideSpacing(line0, 30, 370)
    body = textEl(200, 72, { fontSize: 30, fontFamily: ff, fontWeight: fw, fill, letterSpacing: uwSpacing, content: line0 })
      + (line1 ? textEl(200, 100, { fontSize: 11, fontFamily: ff, fontWeight: 300, fill, letterSpacing: "0.5em", content: line1.toUpperCase() }) : "")
  } else if (style === "oversized-crop") {
    body = `<svg viewBox="0 0 400 120" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" overflow="hidden">`
      + bg
      + textEl(200, 88, { fontSize: 82, fontFamily: ff, fontWeight: 700, fill, letterSpacing: ls, content: line0 })
      + (line1 ? textEl(200, 112, { fontSize: 20, fontFamily: ff, fontWeight: 300, fill, letterSpacing: "0.2em", content: line1 }) : "")
      + `</svg>`
    return body
  } else if (style === "mixed-weight-inline") {
    const w0 = line0 + " "
    const tlCombined = textLengthAttr(w0 + line1, 44, tracking, 370)
    body = `<text x="200" y="70" text-anchor="middle" font-size="44" font-family="${ff}" fill="${fill}" letter-spacing="${ls}"${tlAttrs(tlCombined)}>`
      + `<tspan font-weight="700">${w0}</tspan><tspan font-weight="200">${line1}</tspan></text>`
  } else if (style === "left-editorial") {
    const tl0 = textLengthAttr(line0, 44, tracking, 350)
    const tl1 = textLengthAttr(line1, 44, tracking, 350)
    body = `<rect x="32" y="22" width="2" height="76" fill="${fill}" opacity="0.35"/>`
      + textEl(46, 55, { anchor: "start", fontSize: 44, fontFamily: ff, fontWeight: fw, fill, letterSpacing: ls, tl: tl0, content: line0 })
      + textEl(46, 95, { anchor: "start", fontSize: 44, fontFamily: ff, fontWeight: fw, fill, letterSpacing: ls, tl: tl1, content: line1 })
  } else {
    // fallback
    const tl = textLengthAttr(line0, 48, tracking, 370)
    body = textEl(200, 70, { fontSize: 48, fontFamily: ff, fontWeight: fw, fill, letterSpacing: ls, tl, content: line0 })
  }

  return `${open}${bg}${body}</svg>`
}

async function svgToPng(svgString: string): Promise<Buffer> {
  // sharp needs explicit pixel dimensions — replace the 100%/auto attrs
  const fixed = svgString
    .replace(/width="100%"/, 'width="400"')
    .replace(/height="auto"/, 'height="120"')
  return sharp(Buffer.from(fixed)).resize(1200).png().toBuffer()
}

// ─── Google Fonts helper ──────────────────────────────────────────────────────

type FontVariant = {
  weight: "400" | "700"
  style: "normal" | "italic"
  buffer: Buffer
}

// Returns up to four variants: regular, bold, italic, bold-italic.
// Uses IE9 UA so Google Fonts responds with TTF rather than WOFF2.
async function fetchGoogleFontVariants(fontName: string): Promise<FontVariant[]> {
  try {
    const family = fontName.replace(/\s+/g, "+")
    const cssUrl =
      `https://fonts.googleapis.com/css2?family=${family}` +
      `:ital,wght@0,400;0,700;1,400;1,700`
    const cssResp = await fetch(cssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
      },
    })
    if (!cssResp.ok) return []

    const css = await cssResp.text()

    // Collect one entry per @font-face block
    type Entry = { weight: "400" | "700"; style: "normal" | "italic"; url: string }
    const entries: Entry[] = []
    const blockRe = /@font-face\s*\{([^}]+)\}/g
    let m: RegExpExecArray | null
    while ((m = blockRe.exec(css)) !== null) {
      const block = m[1]
      const w = block.match(/font-weight:\s*(\d+)/)?.[1]
      if (w !== "400" && w !== "700") continue
      const s = block.match(/font-style:\s*(normal|italic)/)?.[1] ?? "normal"
      const urlMatch = block.match(/url\(['"]?([^'")]+)['"]?\)/)
      if (!urlMatch) continue
      entries.push({
        weight: w as "400" | "700",
        style: s as "normal" | "italic",
        url: urlMatch[1],
      })
    }

    // Download all variants in parallel
    const results = await Promise.all(
      entries.map(async ({ weight, style, url }) => {
        try {
          const r = await fetch(url)
          if (!r.ok) return null
          return { weight, style, buffer: Buffer.from(await r.arrayBuffer()) }
        } catch {
          return null
        }
      }),
    )

    return results.filter(Boolean) as FontVariant[]
  } catch {
    return []
  }
}

function variantLabel(weight: "400" | "700", style: "normal" | "italic"): string {
  if (weight === "700" && style === "italic") return "Bold-Italic"
  if (weight === "700") return "Bold"
  if (style === "italic") return "Italic"
  return "Regular"
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

type PdfDoc = InstanceType<typeof PDFDocument>

function bufferPdf(fn: (doc: PdfDoc) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ autoFirstPage: false, margin: 50 })
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
    fn(doc)
    doc.end()
  })
}

function safeHex(h: string): string {
  const s = h.trim()
  return s.startsWith("#") ? s : `#${s}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = safeHex(hex).replace("#", "")
  return {
    r: parseInt(c.slice(0, 2), 16) || 0,
    g: parseInt(c.slice(2, 4), 16) || 0,
    b: parseInt(c.slice(4, 6), 16) || 0,
  }
}

function rule(doc: PdfDoc, y: number) {
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#e5e5e5").lineWidth(0.5).stroke()
}

// ─── Colour Palette PDF ───────────────────────────────────────────────────────

function buildColourPalettePdf(concept: ConceptRow): Promise<Buffer> {
  return bufferPdf((doc) => {
    doc.addPage()

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#171717")
      .text("Colour Palette", 50, 50)
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#888888")
      .text(concept.brand_name, 50, 82)
    rule(doc, 108)

    const sw = 86
    const sh = 86
    const gap = 12
    const startY = 130

    concept.colors.slice(0, 5).forEach((hex, i) => {
      const x = 50 + i * (sw + gap)
      const rgb = hexToRgb(hex)

      doc.rect(x, startY, sw, sh).fill(safeHex(hex))

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#171717")
        .text(hex.toUpperCase(), x, startY + sh + 8, {
          width: sw,
          align: "center",
        })

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#666666")
        .text(`${rgb.r}, ${rgb.g}, ${rgb.b}`, x, startY + sh + 22, {
          width: sw,
          align: "center",
        })
    })

    if (concept.color_rationale) {
      rule(doc, startY + sh + 52)
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#333333")
        .text(concept.color_rationale, 50, startY + sh + 68, { width: 495 })
    }
  })
}

// ─── Typography PDF ───────────────────────────────────────────────────────────

function buildTypographyPdf(
  concept: ConceptRow,
  headingFontBuffer: Buffer | null,
  bodyFontBuffer: Buffer | null,
): Promise<Buffer> {
  return bufferPdf((doc) => {
    doc.addPage()

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#171717")
      .text("Typography", 50, 50)
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#888888")
      .text(concept.brand_name, 50, 82)
    rule(doc, 108)

    // Heading font
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888888")
      .text("HEADING FONT", 50, 128)
    doc
      .font("Helvetica")
      .fontSize(13)
      .fillColor("#171717")
      .text(concept.fonts.heading, 50, 144)

    // registerFont only supports TTF/OTF — wrap so WOFF2 from Google doesn't crash
    let useHeadingFont = false
    if (headingFontBuffer) {
      try {
        doc.registerFont("HeadingFont", headingFontBuffer)
        useHeadingFont = true
      } catch {
        // font format unsupported (e.g. WOFF2) — fall back to Helvetica
      }
    }
    doc.font(useHeadingFont ? "HeadingFont" : "Helvetica")
    doc.fontSize(38).fillColor("#171717").text(concept.brand_name, 50, 168)

    const gfHeading = `https://fonts.google.com/specimen/${concept.fonts.heading.replace(/\s+/g, "+")}`
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#0066cc")
      .text(`Download: ${gfHeading}`, 50, 222)

    rule(doc, 252)

    // Body font
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888888")
      .text("BODY FONT", 50, 272)
    doc
      .font("Helvetica")
      .fontSize(13)
      .fillColor("#171717")
      .text(concept.fonts.body, 50, 288)

    const specimen = `${concept.tagline}. ${concept.summary ?? ""}`.slice(0, 220)
    let useBodyFont = false
    if (bodyFontBuffer) {
      try {
        doc.registerFont("BodyFont", bodyFontBuffer)
        useBodyFont = true
      } catch {
        // font format unsupported — fall back to Helvetica
      }
    }
    doc.font(useBodyFont ? "BodyFont" : "Helvetica")
    doc.fontSize(13).fillColor("#333333").text(specimen, 50, 312, { width: 495 })

    const gfBody = `https://fonts.google.com/specimen/${concept.fonts.body.replace(/\s+/g, "+")}`
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#0066cc")
      .text(`Download: ${gfBody}`, 50, 410)

    rule(doc, 435)

    // Usage guidance
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#171717")
      .text("Usage Guidance", 50, 452)
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#444444")
      .text(
        `Use ${concept.fonts.heading} for headlines, display text, and brand mark applications. ` +
          `Use ${concept.fonts.body} for body copy, captions, and UI text. ` +
          `Both fonts are available free via Google Fonts.`,
        50,
        472,
        { width: 495 },
      )
  })
}

// ─── Brand Guidelines PDF ─────────────────────────────────────────────────────

function buildBrandGuidelinesPdf(concept: ConceptRow): Promise<Buffer> {
  return bufferPdf((doc) => {
    // Page 1 — Cover
    doc.addPage()
    doc
      .font("Helvetica-Bold")
      .fontSize(44)
      .fillColor("#171717")
      .text(concept.brand_name, 50, 220, { align: "center", width: 495 })
    doc
      .font("Helvetica")
      .fontSize(18)
      .fillColor("#555555")
      .text(concept.tagline, 50, 278, { align: "center", width: 495 })
    doc
      .moveTo(220, 330)
      .lineTo(375, 330)
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .stroke()
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#aaaaaa")
      .text("Brand Guidelines", 50, 348, { align: "center", width: 495 })

    // Page 2 — Brand Rationale
    doc.addPage()
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#171717")
      .text("Brand Rationale", 50, 50)
    rule(doc, 82)
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#333333")
      .text(concept.rationale, 50, 100, { width: 495 })

    const attrsY = Math.min(doc.y + 40, 580)
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888888")
      .text("BRAND ATTRIBUTES", 50, attrsY)
    const attrs = (concept.attributes ?? []).join("   ·   ")
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#171717")
      .text(attrs, 50, attrsY + 18, { width: 495 })

    // Page 3 — Colour Palette
    doc.addPage()
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#171717")
      .text("Colour Palette", 50, 50)
    rule(doc, 82)

    const sw = 80
    const sh = 80
    const gap = 12
    const startY = 104

    concept.colors.slice(0, 5).forEach((hex, i) => {
      const x = 50 + i * (sw + gap)
      const rgb = hexToRgb(hex)
      doc.rect(x, startY, sw, sh).fill(safeHex(hex))
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor("#171717")
        .text(hex.toUpperCase(), x, startY + sh + 6, {
          width: sw,
          align: "center",
        })
      doc
        .font("Helvetica")
        .fontSize(6)
        .fillColor("#666666")
        .text(`RGB ${rgb.r} ${rgb.g} ${rgb.b}`, x, startY + sh + 18, {
          width: sw,
          align: "center",
        })
    })

    if (concept.color_rationale) {
      rule(doc, startY + sh + 50)
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#333333")
        .text(concept.color_rationale, 50, startY + sh + 66, { width: 495 })
    }

    // Page 4 — Typography
    doc.addPage()
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#171717")
      .text("Typography", 50, 50)
    rule(doc, 82)

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888888")
      .text("HEADING FONT", 50, 100)
    doc
      .font("Helvetica")
      .fontSize(28)
      .fillColor("#171717")
      .text(concept.fonts.heading, 50, 116)

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888888")
      .text("BODY FONT", 50, 176)
    doc
      .font("Helvetica")
      .fontSize(20)
      .fillColor("#333333")
      .text(concept.fonts.body, 50, 192)

    rule(doc, 240)
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#444444")
      .text(
        `Use ${concept.fonts.heading} for headlines and brand applications. ` +
          `Use ${concept.fonts.body} for body copy and UI text. ` +
          `Both are available free at fonts.google.com.`,
        50,
        258,
        { width: 495 },
      )

    // Page 5 — Brand Voice
    doc.addPage()
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#171717")
      .text("Brand Voice", 50, 50)
    rule(doc, 82)

    if (concept.voice_sample) {
      // Quote mark
      doc
        .font("Helvetica-Bold")
        .fontSize(60)
        .fillColor("#e5e5e5")
        .text("\u201C", 44, 90)
      doc
        .font("Helvetica")
        .fontSize(14)
        .fillColor("#171717")
        .text(concept.voice_sample, 50, 130, { width: 495 })
    }

    if (concept.summary) {
      rule(doc, 340)
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#888888")
        .text("BRAND SUMMARY", 50, 358)
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#333333")
        .text(concept.summary, 50, 378, { width: 495 })
    }
  })
}

// ─── ZIP helper ───────────────────────────────────────────────────────────────

function buildZipBuffer(
  files: { path: string; buffer: Buffer }[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const archive = archiver("zip", { zlib: { level: 6 } })
    archive.on("data", (chunk: Buffer) => chunks.push(chunk))
    archive.on("end", () => resolve(Buffer.concat(chunks)))
    archive.on("error", reject)
    for (const { path, buffer } of files) {
      archive.append(buffer, { name: path })
    }
    archive.finalize()
  })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { conceptId } = body as { conceptId?: string }
    if (!conceptId) {
      return NextResponse.json({ error: "conceptId required" }, { status: 400 })
    }

    // Fetch concept
    const { data: concept, error: conceptError } = await supabase
      .from("concepts")
      .select("*")
      .eq("id", conceptId)
      .single()

    if (conceptError || !concept) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 })
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, project_name, paid_at")
      .eq("id", concept.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const p = project as ProjectRow

    // Authorization: concept must belong to the authenticated user's project
    if (p.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Paywall: free-trial users must have paid for this project; regular accounts bypass
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_free_trial")
      .eq("id", user.id)
      .single()

    const isFreeTrial = Boolean(profile?.is_free_trial)

    if (isFreeTrial && !p.paid_at) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 })
    }

    const c = concept as unknown as ConceptRow
    const composition = c.logo_composition as LogoComposition
    const headingFont = c.fonts.heading
    const brandColor = safeHex(c.colors?.[0] ?? "#171717")
    const wordmarkColor = c.wordmark_color ?? "#171717"

    // ── SVGs ────────────────────────────────────────────────────────────────────
    // Primary:          wordmarkColor text on transparent (or brandColor bg)
    // Reversed:         brandColor (colors[0]) text on transparent (or wordmarkColor bg)
    // Matches the Identity section in the UI exactly.
    const svgPrimary = buildSvgString(composition, wordmarkColor, headingFont)
    const svgReversed = buildSvgString(composition, brandColor, headingFont)
    const svgPrimaryOnBrand = buildSvgString(composition, wordmarkColor, headingFont, brandColor)
    const svgReversedOnBrand = buildSvgString(composition, brandColor, headingFont, wordmarkColor)

    // ── PNGs + font variants (all in parallel) ─────────────────────────────────
    const [
      pngPrimary,
      pngReversed,
      pngPrimaryOnBrand,
      pngReversedOnBrand,
      headingVariants,
      bodyVariants,
    ] = await Promise.all([
      svgToPng(svgPrimary),
      svgToPng(svgReversed),
      svgToPng(svgPrimaryOnBrand),
      svgToPng(svgReversedOnBrand),
      fetchGoogleFontVariants(c.fonts.heading),
      fetchGoogleFontVariants(c.fonts.body),
    ])

    // Pull the regular-weight buffer for PDF font specimens
    const headingFontBuffer =
      headingVariants.find((v) => v.weight === "400" && v.style === "normal")?.buffer ?? null
    const bodyFontBuffer =
      bodyVariants.find((v) => v.weight === "400" && v.style === "normal")?.buffer ?? null

    // ── PDFs ────────────────────────────────────────────────────────────────────
    const [palettePdf, typographyPdf, guidelinesPdf] = await Promise.all([
      buildColourPalettePdf(c),
      buildTypographyPdf(c, headingFontBuffer, bodyFontBuffer),
      buildBrandGuidelinesPdf(c),
    ])

    // ── ZIP assembly ────────────────────────────────────────────────────────────
    const headingFontSlug = c.fonts.heading.replace(/\s+/g, "-")
    const bodyFontSlug = c.fonts.body.replace(/\s+/g, "-")

    const files: { path: string; buffer: Buffer }[] = [
      { path: "logos/wordmark-primary.svg", buffer: Buffer.from(svgPrimary) },
      { path: "logos/wordmark-reversed.svg", buffer: Buffer.from(svgReversed) },
      {
        path: "logos/wordmark-primary-on-brand.svg",
        buffer: Buffer.from(svgPrimaryOnBrand),
      },
      {
        path: "logos/wordmark-reversed-on-brand.svg",
        buffer: Buffer.from(svgReversedOnBrand),
      },
      { path: "logos/wordmark-primary.png", buffer: pngPrimary },
      { path: "logos/wordmark-reversed.png", buffer: pngReversed },
      { path: "logos/wordmark-primary-on-brand.png", buffer: pngPrimaryOnBrand },
      {
        path: "logos/wordmark-reversed-on-brand.png",
        buffer: pngReversedOnBrand,
      },
      { path: "pdfs/colour-palette.pdf", buffer: palettePdf },
      { path: "pdfs/typography.pdf", buffer: typographyPdf },
      { path: "pdfs/brand-guidelines.pdf", buffer: guidelinesPdf },
    ]

    // Add all font variants; deduplicate by path (heading = body edge case)
    const seenFontPaths = new Set<string>()
    for (const { fontName, slug, variants } of [
      { fontName: c.fonts.heading, slug: headingFontSlug, variants: headingVariants },
      { fontName: c.fonts.body,    slug: bodyFontSlug,    variants: bodyVariants },
    ]) {
      void fontName
      for (const { weight, style, buffer } of variants) {
        const label = variantLabel(weight, style)
        const filePath = `fonts/${slug}-${label}.ttf`
        if (!seenFontPaths.has(filePath)) {
          seenFontPaths.add(filePath)
          files.push({ path: filePath, buffer })
        }
      }
    }

    const zipBuffer = await buildZipBuffer(files)

    // ── Upload to Supabase Storage (service role bypasses RLS) ──────────────────
    const storage = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    ).storage

    // Create bucket on first use — safe to call if it already exists
    await storage.createBucket("exports", {
      public: false,
      fileSizeLimit: 104857600,
    })

    const storagePath = `${user.id}/${conceptId}/brand-package.zip`

    const { error: uploadError } = await storage
      .from("exports")
      .upload(storagePath, zipBuffer, {
        contentType: "application/zip",
        upsert: true,
      })

    if (uploadError) {
      console.error("[export] storage upload error:", uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 },
      )
    }

    // ── Signed URL (24 h) ────────────────────────────────────────────────────────
    const { data: signed, error: signError } = await storage
      .from("exports")
      .createSignedUrl(storagePath, 86400)

    if (signError || !signed) {
      console.error("[export] signed url error:", signError)
      return NextResponse.json(
        { error: "Could not generate download URL" },
        { status: 500 },
      )
    }

    // ── Record in exports table ──────────────────────────────────────────────────
    await supabase.from("exports").upsert(
      {
        concept_id: conceptId,
        user_id: user.id,
        project_id: p.id,
        file_url: signed.signedUrl,
        downloaded_at: new Date().toISOString(),
      },
      { onConflict: "concept_id" },
    )

    return NextResponse.json({ downloadUrl: signed.signedUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[export] unhandled error:", msg, err)
    return NextResponse.json({ error: `Export failed: ${msg}` }, { status: 500 })
  }
}
