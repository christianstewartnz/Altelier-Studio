import type { LogoComposition } from "./results-overview"

type WordmarkSVGProps = {
  composition: LogoComposition
  color: string
  headingFont: string
}

function applyCase(text: string, c: LogoComposition["case"]): string {
  if (c === "upper") return text.toUpperCase()
  if (c === "lower") return text.toLowerCase()
  return text
}

function letterSpacingFromTracking(t: LogoComposition["tracking"]): string {
  if (t === "tight") return "-0.05em"
  if (t === "wide") return "0.2em"
  if (t === "ultrawide") return "0.45em"
  return "0.05em"
}

function fontWeightFromWeight(w: LogoComposition["weight"]): number {
  if (w === "light") return 300
  if (w === "bold") return 700
  return 400
}

// ── Auto-scaling helpers ──────────────────────────────────────────────────────
// Average glyph width as a fraction of font-size for proportional fonts.
// Slightly conservative so we only compress when text genuinely overflows.
const CHAR_WIDTH_FACTOR = 0.62

function trackingEmValue(tracking: LogoComposition["tracking"]): number {
  if (tracking === "tight") return -0.05
  if (tracking === "wide") return 0.20
  if (tracking === "ultrawide") return 0.45
  return 0.05
}

function estimateTextWidth(text: string, fontSize: number, tracking: LogoComposition["tracking"]): number {
  return text.length * fontSize * (CHAR_WIDTH_FACTOR + trackingEmValue(tracking))
}

// Returns the SVG textLength value only when text would exceed maxWidth.
// Never returns a value larger than the natural estimate, so short names
// are never stretched.
function textLengthAttr(
  text: string,
  fontSize: number,
  tracking: LogoComposition["tracking"],
  maxWidth: number,
): number | undefined {
  return estimateTextWidth(text, fontSize, tracking) > maxWidth ? maxWidth : undefined
}

// For ultrawide style: compress letter-spacing instead of scaling glyphs,
// so characters retain their natural shape. Clamps between 0.05em and 0.55em.
function computeUltrawideSpacing(text: string, fontSize: number, maxWidth: number): string {
  if (!text || text.length === 0) return "0.55em"
  const charTotalWidth = text.length * fontSize * CHAR_WIDTH_FACTOR
  if (charTotalWidth >= maxWidth) return "0.05em"
  const spacingPx = (maxWidth - charTotalWidth) / text.length
  const spacingEm = spacingPx / fontSize
  const clamped = Math.min(0.55, Math.max(0.05, spacingEm))
  return `${clamped.toFixed(3)}em`
}

export function WordmarkSVG({ composition, color, headingFont }: WordmarkSVGProps) {
  const { style, lines, punctuation, punctuationPosition, tracking, case: textCase, weight } = composition
  const fill = color?.trim() ? color : "#171717"
  const fontFamily = `'${headingFont}', serif`
  const letterSpacing = letterSpacingFromTracking(tracking)
  const fontWeight = fontWeightFromWeight(weight)

  const line0 = lines[0] ? applyCase(lines[0], textCase) : ""
  const line1 = lines[1] ? applyCase(lines[1], textCase) : ""
  const punct = punctuation && punctuation !== "none" ? punctuation : "—"

  const svgProps = {
    viewBox: "0 0 400 120",
    width: "100%" as const,
    height: "auto" as const,
    xmlns: "http://www.w3.org/2000/svg" as const,
    role: "img" as const,
    "aria-hidden": true as const,
  }

  // ── 1. inline-clean ──────────────────────────────────────────────────────────
  if (style === "inline-clean") {
    const tl0 = textLengthAttr(line0, 48, tracking, 370)
    return (
      <svg {...svgProps}>
        <text
          x="200" y="70"
          textAnchor="middle"
          fontSize="48"
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl0 !== undefined && { textLength: tl0, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line0}
        </text>
      </svg>
    )
  }

  // ── 2. inline-ruled ──────────────────────────────────────────────────────────
  if (style === "inline-ruled") {
    const tl0 = textLengthAttr(line0, 48, tracking, 370)
    return (
      <svg {...svgProps}>
        <text
          x="200" y="70"
          textAnchor="middle"
          fontSize="48"
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl0 !== undefined && { textLength: tl0, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line0}
        </text>
        <rect x="40" y="85" width="320" height="1" fill={fill} />
      </svg>
    )
  }

  // ── 3. stacked-ruled ─────────────────────────────────────────────────────────
  if (style === "stacked-ruled") {
    const tl0 = textLengthAttr(line0, 42, tracking, 370)
    const tl1 = textLengthAttr(line1, 42, tracking, 370)
    return (
      <svg {...svgProps}>
        <text
          x="200" y="45"
          textAnchor="middle"
          fontSize="42"
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl0 !== undefined && { textLength: tl0, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line0}
        </text>
        <rect x="40" y="58" width="320" height="1" fill={fill} />
        <text
          x="200" y="92"
          textAnchor="middle"
          fontSize="42"
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl1 !== undefined && { textLength: tl1, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── 4. stacked-punctuation ───────────────────────────────────────────────────
  if (style === "stacked-punctuation") {
    const fontSize = 42
    const trackingPx = tracking === "tight" ? -2 :
      tracking === "wide" ? 8 :
      tracking === "ultrawide" ? 20 : 2
    const textWidth = line1.length * (fontSize * CHAR_WIDTH_FACTOR + trackingPx)
    const punctWidth = 24 * CHAR_WIDTH_FACTOR
    const totalWidth = textWidth + 8 + punctWidth
    // Clamp to safe width so startX is always accurate for the rendered size
    const clampedWidth = Math.min(360, totalWidth)
    const startX = (400 - clampedWidth) / 2
    const tl0 = textLengthAttr(line0, fontSize, tracking, 370)
    const applyLine1TL = totalWidth > 360

    return (
      <svg {...svgProps} viewBox="0 0 400 120">
        <text
          x="200" y="45"
          textAnchor="middle"
          fontSize="42"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl0 !== undefined && { textLength: tl0, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line0}
        </text>
        <text
          x={startX}
          y="88"
          textAnchor="start"
          fontSize="42"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(applyLine1TL && { textLength: 360, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line1}
          <tspan
            fontSize="24"
            dy="12"
            dx="8"
            letterSpacing="0"
          >
            {punct}
          </tspan>
        </text>
      </svg>
    )
  }

  // ── 5. stacked-weighted ──────────────────────────────────────────────────────
  if (style === "stacked-weighted") {
    const tl0 = textLengthAttr(line0, 52, tracking, 370)
    const tl1 = textLengthAttr(line1, 28, tracking, 370)
    return (
      <svg {...svgProps}>
        <text
          x="200" y="50"
          textAnchor="middle"
          fontSize="52"
          fontWeight="700"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl0 !== undefined && { textLength: tl0, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line0}
        </text>
        <text
          x="200" y="92"
          textAnchor="middle"
          fontSize="28"
          fontWeight="300"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl1 !== undefined && { textLength: tl1, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── 6. offset-subtitle ───────────────────────────────────────────────────────
  if (style === "offset-subtitle") {
    const tl0 = textLengthAttr(line0, 52, tracking, 370)
    // line1 is small (17px) right-anchored at x=320 — guard against unusually long subtitles
    const tl1 = textLengthAttr(line1, 17, "normal", 310)
    return (
      <svg {...svgProps}>
        <text
          x="200" y="60"
          textAnchor="middle"
          fontSize="52"
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl0 !== undefined && { textLength: tl0, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line0}
        </text>
        <text
          x="320" y="92"
          textAnchor="end"
          fontSize="17"
          fontWeight="300"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing="0.12em"
          {...(tl1 !== undefined && { textLength: tl1, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── 7. weight-contrast ───────────────────────────────────────────────────────
  // Two stacked lines: first ultra-bold, second ultra-light — dramatic tonal split
  if (style === "weight-contrast") {
    const tl0 = textLengthAttr(line0, 50, tracking, 370)
    const tl1 = textLengthAttr(line1, 38, tracking, 370)
    return (
      <svg {...svgProps}>
        <text
          x="200" y="55"
          textAnchor="middle"
          fontSize="50"
          fontWeight="800"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl0 !== undefined && { textLength: tl0, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line0}
        </text>
        <text
          x="200" y="95"
          textAnchor="middle"
          fontSize="38"
          fontWeight="200"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl1 !== undefined && { textLength: tl1, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── 8. scale-contrast ────────────────────────────────────────────────────────
  // One dominant word fills the space; second line rendered small beneath it
  if (style === "scale-contrast") {
    const tl0 = textLengthAttr(line0, 64, tracking, 370)
    return (
      <svg {...svgProps}>
        <text
          x="200" y="68"
          textAnchor="middle"
          fontSize="64"
          fontWeight={fontWeight}
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl0 !== undefined && { textLength: tl0, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line0}
        </text>
        <text
          x="200" y="100"
          textAnchor="middle"
          fontSize="14"
          fontWeight="300"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing="0.35em"
        >
          {line1.toUpperCase()}
        </text>
      </svg>
    )
  }

  // ── 9. ultrawide ─────────────────────────────────────────────────────────────
  // Single line with extreme tracking — architectural, minimal.
  // Long names compress letter-spacing rather than scaling glyphs to preserve
  // the architectural character of the style.
  if (style === "ultrawide") {
    const uwSpacing = computeUltrawideSpacing(line0, 30, 370)
    return (
      <svg {...svgProps} viewBox="0 0 400 120">
        <text
          x="200" y="72"
          textAnchor="middle"
          fontSize="30"
          fontWeight={fontWeight}
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={uwSpacing}
        >
          {line0}
        </text>
        {line1 && (
          <text
            x="200" y="100"
            textAnchor="middle"
            fontSize="11"
            fontWeight="300"
            fontFamily={fontFamily}
            fill={fill}
            letterSpacing="0.5em"
          >
            {line1.toUpperCase()}
          </text>
        )}
      </svg>
    )
  }

  // ── 10. oversized-crop ───────────────────────────────────────────────────────
  // Text is intentionally large so it clips at the SVG edges — editorial
  if (style === "oversized-crop") {
    return (
      <svg {...svgProps} style={{ overflow: "hidden" }}>
        <text
          x="200" y="88"
          textAnchor="middle"
          fontSize="82"
          fontWeight="700"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line0}
        </text>
        {line1 && (
          <text
            x="200" y="112"
            textAnchor="middle"
            fontSize="20"
            fontWeight="300"
            fontFamily={fontFamily}
            fill={fill}
            letterSpacing="0.2em"
          >
            {line1}
          </text>
        )}
      </svg>
    )
  }

  // ── 11. mixed-weight-inline ──────────────────────────────────────────────────
  // Both words on one baseline with contrasting weights side by side.
  // textLength on the parent <text> distributes proportionally across tspans.
  if (style === "mixed-weight-inline") {
    const w0 = line0 + " "
    const combinedText = w0 + line1
    const tlCombined = textLengthAttr(combinedText, 44, tracking, 370)
    return (
      <svg {...svgProps}>
        <text
          x="200" y="70"
          textAnchor="middle"
          fontSize="44"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tlCombined !== undefined && { textLength: tlCombined, lengthAdjust: "spacingAndGlyphs" })}
        >
          <tspan fontWeight="700">{w0}</tspan>
          <tspan fontWeight="200">{line1}</tspan>
        </text>
      </svg>
    )
  }

  // ── 12. left-editorial ───────────────────────────────────────────────────────
  // Left-aligned stack with a thin rule accent on the left margin.
  // Text starts at x=46, so available width to right edge is ~350px.
  if (style === "left-editorial") {
    const tl0 = textLengthAttr(line0, 44, tracking, 350)
    const tl1 = textLengthAttr(line1, 44, tracking, 350)
    return (
      <svg {...svgProps}>
        <rect x="32" y="22" width="2" height="76" fill={fill} opacity="0.35" />
        <text
          x="46" y="55"
          textAnchor="start"
          fontSize="44"
          fontWeight={fontWeight}
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl0 !== undefined && { textLength: tl0, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line0}
        </text>
        <text
          x="46" y="95"
          textAnchor="start"
          fontSize="44"
          fontWeight={fontWeight}
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
          {...(tl1 !== undefined && { textLength: tl1, lengthAdjust: "spacingAndGlyphs" })}
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── fallback ─────────────────────────────────────────────────────────────────
  const tlFallback = textLengthAttr(line0, 48, tracking, 370)
  return (
    <svg {...svgProps}>
      <text
        x="200" y="70"
        textAnchor="middle"
        fontSize="48"
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fill={fill}
        letterSpacing={letterSpacing}
        {...(tlFallback !== undefined && { textLength: tlFallback, lengthAdjust: "spacingAndGlyphs" })}
      >
        {line0}
      </text>
    </svg>
  )
}
