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
        >
          {line0}
        </text>
      </svg>
    )
  }

  // ── 2. inline-ruled ──────────────────────────────────────────────────────────
  if (style === "inline-ruled") {
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
        >
          {line0}
        </text>
        <rect x="40" y="85" width="320" height="1" fill={fill} />
      </svg>
    )
  }

  // ── 3. stacked-ruled ─────────────────────────────────────────────────────────
  if (style === "stacked-ruled") {
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
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── 4. stacked-punctuation ───────────────────────────────────────────────────
  if (style === "stacked-punctuation") {
    const fontSize = 42
    const charWidth = fontSize * 0.6
    const trackingPx = tracking === "tight" ? -2 :
      tracking === "wide" ? 8 :
      tracking === "ultrawide" ? 20 : 2
    const textWidth = line1.length * (charWidth + trackingPx)
    const punctWidth = 24 * 0.6
    const totalWidth = textWidth + 8 + punctWidth
    const startX = (400 - totalWidth) / 2

    return (
      <svg {...svgProps} viewBox="0 0 400 130">
        <text
          x="200" y="50"
          textAnchor="middle"
          fontSize="42"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line0}
        </text>
        <text
          x={startX}
          y="95"
          textAnchor="start"
          fontSize="42"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
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
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── 6. offset-subtitle ───────────────────────────────────────────────────────
  if (style === "offset-subtitle") {
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
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── 7. weight-contrast ───────────────────────────────────────────────────────
  // Two stacked lines: first ultra-bold, second ultra-light — dramatic tonal split
  if (style === "weight-contrast") {
    return (
      <svg {...svgProps}>
        <text
          x="200" y="52"
          textAnchor="middle"
          fontSize="50"
          fontWeight="800"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line0}
        </text>
        <text
          x="200" y="90"
          textAnchor="middle"
          fontSize="38"
          fontWeight="200"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── 8. scale-contrast ────────────────────────────────────────────────────────
  // One dominant word fills the space; second line rendered small beneath it
  if (style === "scale-contrast") {
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
  // Single line with extreme tracking — architectural, minimal
  if (style === "ultrawide") {
    return (
      <svg {...svgProps} viewBox="0 0 400 120">
        <text
          x="200" y="72"
          textAnchor="middle"
          fontSize="30"
          fontWeight={fontWeight}
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing="0.55em"
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
  // Both words on one baseline with contrasting weights side by side
  if (style === "mixed-weight-inline") {
    const w0 = line0 + " "
    return (
      <svg {...svgProps}>
        <text
          x="200" y="70"
          textAnchor="middle"
          fontSize="44"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          <tspan fontWeight="700">{w0}</tspan>
          <tspan fontWeight="200">{line1}</tspan>
        </text>
      </svg>
    )
  }

  // ── 12. left-editorial ───────────────────────────────────────────────────────
  // Left-aligned stack with a thin rule accent on the left margin
  if (style === "left-editorial") {
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
        >
          {line1}
        </text>
      </svg>
    )
  }

  // ── fallback ─────────────────────────────────────────────────────────────────
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
      >
        {line0}
      </text>
    </svg>
  )
}
