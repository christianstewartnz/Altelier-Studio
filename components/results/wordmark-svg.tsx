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
  return "0.05em"
}

export function WordmarkSVG({ composition, color, headingFont }: WordmarkSVGProps) {
  const { style, lines, punctuation, tracking, case: textCase } = composition
  const fill = color?.trim() ? color : "#171717"
  const fontFamily = `'${headingFont}', serif`
  const letterSpacing = letterSpacingFromTracking(tracking)

  const line0 = lines[0] ? applyCase(lines[0], textCase) : ""
  const line1 = lines[1] ? applyCase(lines[1], textCase) : ""

  const svgProps = {
    viewBox: "0 0 400 120",
    width: "100%" as const,
    height: "auto" as const,
    xmlns: "http://www.w3.org/2000/svg" as const,
    role: "img" as const,
    "aria-hidden": true as const,
  }

  if (style === "inline-clean") {
    return (
      <svg {...svgProps}>
        <text
          x="200" y="70"
          textAnchor="middle"
          fontSize="48"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line0}
        </text>
      </svg>
    )
  }

  if (style === "inline-ruled") {
    return (
      <svg {...svgProps}>
        <text
          x="200" y="70"
          textAnchor="middle"
          fontSize="48"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line0}
        </text>
        <rect x="40" y="85" width="320" height="1" fill={fill} />
      </svg>
    )
  }

  if (style === "stacked-ruled") {
    return (
      <svg {...svgProps}>
        <text
          x="200" y="45"
          textAnchor="middle"
          fontSize="42"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line0}
        </text>
        <rect x="40" y="65" width="320" height="1" fill={fill} />
        <text
          x="200" y="95"
          textAnchor="middle"
          fontSize="42"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line1}
        </text>
      </svg>
    )
  }

  if (style === "stacked-punctuation") {
    const punct = punctuation && punctuation !== "none" ? punctuation : "—"
    return (
      <svg {...svgProps}>
        <text
          x="200" y="45"
          textAnchor="middle"
          fontSize="42"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line0}
        </text>
        <text
          x="185" y="95"
          textAnchor="middle"
          fontSize="42"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line1}
        </text>
        <text
          x="340" y="95"
          fontSize="42"
          fontFamily={fontFamily}
          fill={fill}
        >
          {punct}
        </text>
      </svg>
    )
  }

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
          x="200" y="95"
          textAnchor="middle"
          fontSize="32"
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

  if (style === "offset-subtitle") {
    return (
      <svg {...svgProps}>
        <text
          x="200" y="60"
          textAnchor="middle"
          fontSize="52"
          fontFamily={fontFamily}
          fill={fill}
          letterSpacing={letterSpacing}
        >
          {line0}
        </text>
        <text
          x="320" y="90"
          textAnchor="end"
          fontSize="18"
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

  return (
    <svg {...svgProps}>
      <text
        x="200" y="70"
        textAnchor="middle"
        fontSize="48"
        fontFamily={fontFamily}
        fill={fill}
        letterSpacing={letterSpacing}
      >
        {line0}
      </text>
    </svg>
  )
}
