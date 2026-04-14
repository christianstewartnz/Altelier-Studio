import type { LogoComposition } from "./results-overview"

type WordmarkSVGProps = {
  composition: LogoComposition
  headingFont: string
  color: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const SIZE_CONFIG = {
  sm: { viewBox: "0 0 200 60", baseFontSize: 14, smallFontSize: 10 },
  md: { viewBox: "0 0 280 80", baseFontSize: 20, smallFontSize: 13 },
  lg: { viewBox: "0 0 360 100", baseFontSize: 28, smallFontSize: 18 },
} as const

const RULE_STROKE = 1

function parseViewBox(viewBox: string): { vbW: number; vbH: number } {
  const parts = viewBox.trim().split(/\s+/)
  const vbW = Number(parts[2])
  const vbH = Number(parts[3])
  return { vbW, vbH }
}

function layoutFromViewBox(vbW: number, vbH: number) {
  const cx = vbW / 2
  const ySingle = 0.55 * vbH
  const yFirst = 0.35 * vbH
  const ySecond = 0.7 * vbH
  const yRuleStacked = (yFirst + ySecond) / 2
  const yRuleInline = (ySingle + ySecond) / 2
  const xInset = vbW * 0.1
  const xRuleEnd = vbW * 0.9
  return { cx, ySingle, yFirst, ySecond, yRuleStacked, yRuleInline, xInset, xRuleEnd }
}

function applyCase(text: string, c: LogoComposition["case"]): string {
  if (c === "upper") return text.toUpperCase()
  if (c === "lower") return text.toLowerCase()
  return text.replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function trackingToEm(t: LogoComposition["tracking"]): string {
  if (t === "tight") return "-0.03em"
  if (t === "wide") return "0.15em"
  return "0"
}

function weightToNum(w: LogoComposition["weight"]): number {
  if (w === "light") return 300
  if (w === "bold") return 700
  return 400
}

export function WordmarkSVG({
  composition,
  headingFont,
  color,
  className,
  size = "md",
}: WordmarkSVGProps) {
  const { style, lines, punctuation, weight, tracking, case: textCase } = composition

  const fillColor = color?.trim() ? color : "#171717"

  const cfg = SIZE_CONFIG[size]
  const { viewBox, baseFontSize, smallFontSize } = cfg
  const { vbW, vbH } = parseViewBox(viewBox)
  const { cx, ySingle, yFirst, ySecond, yRuleStacked, yRuleInline, xInset, xRuleEnd } =
    layoutFromViewBox(vbW, vbH)

  const fontFamily = `'${headingFont}', serif`
  const fontWeight = weightToNum(weight)
  const letterSpacing = trackingToEm(tracking)

  // For size="sm": always use 14px and compress long text via textLength
  const lockedFontSize = size === "sm" ? 14 : baseFontSize
  const lockedSmallFontSize = size === "sm" ? 14 : smallFontSize
  const smTextLengthProps =
    size === "sm"
      ? ({ textLength: vbW - 40, lengthAdjust: "spacingAndGlyphs" as const })
      : {}

  const line0 = lines[0] ? applyCase(lines[0], textCase) : ""
  const line1 = lines[1] ? applyCase(lines[1], textCase) : ""

  const svgProps = {
    viewBox,
    width: "100%" as const,
    height: "100%" as const,
    preserveAspectRatio: "xMidYMid meet" as const,
    xmlns: "http://www.w3.org/2000/svg" as const,
    className,
    role: "img" as const,
    "aria-hidden": true as const,
  }

  const sharedMiddle = {
    fontFamily,
    fill: fillColor,
    letterSpacing,
    fontWeight,
    textAnchor: "middle" as const,
    x: cx,
  }

  if (style === "inline-clean") {
    return (
      <svg {...svgProps}>
        <text {...sharedMiddle} y={ySingle} fontSize={lockedFontSize} {...smTextLengthProps}>
          {line0}
        </text>
      </svg>
    )
  }

  if (style === "inline-ruled") {
    return (
      <svg {...svgProps}>
        <text {...sharedMiddle} y={ySingle} fontSize={lockedFontSize} {...smTextLengthProps}>
          {line0}
        </text>
        <line
          x1={xInset}
          x2={xRuleEnd}
          y1={yRuleInline}
          y2={yRuleInline}
          stroke={fillColor}
          strokeWidth={RULE_STROKE}
          opacity={0.6}
        />
      </svg>
    )
  }

  if (style === "stacked-ruled") {
    return (
      <svg {...svgProps}>
        <text {...sharedMiddle} y={yFirst} fontSize={lockedFontSize} {...smTextLengthProps}>
          {line0}
        </text>
        <line
          x1={xInset}
          x2={xRuleEnd}
          y1={yRuleStacked}
          y2={yRuleStacked}
          stroke={fillColor}
          strokeWidth={RULE_STROKE}
          opacity={0.5}
        />
        <text {...sharedMiddle} y={ySecond} fontSize={lockedFontSize} {...smTextLengthProps}>
          {line1}
        </text>
      </svg>
    )
  }

  if (style === "stacked-punctuation") {
    const punct = punctuation && punctuation !== "none" ? punctuation : "—"
    const punctX = cx + vbW * 0.12
    return (
      <svg {...svgProps}>
        <text {...sharedMiddle} y={yFirst} fontSize={lockedFontSize} {...smTextLengthProps}>
          {line0}
        </text>
        <text {...sharedMiddle} y={ySecond} fontSize={lockedFontSize} {...smTextLengthProps}>
          {line1}
        </text>
        <text
          fontFamily={fontFamily}
          fill={fillColor}
          fontWeight={fontWeight}
          fontSize={lockedSmallFontSize}
          x={punctX}
          y={ySecond}
          textAnchor="start"
          letterSpacing={letterSpacing}
        >
          {punct}
        </text>
      </svg>
    )
  }

  if (style === "stacked-weighted") {
    return (
      <svg {...svgProps}>
        <text {...sharedMiddle} y={yFirst} fontSize={lockedFontSize} fontWeight={700} {...smTextLengthProps}>
          {line0}
        </text>
        <text
          {...sharedMiddle}
          y={ySecond}
          fontSize={lockedSmallFontSize}
          fontWeight={300}
          opacity={0.85}
          {...smTextLengthProps}
        >
          {line1}
        </text>
      </svg>
    )
  }

  if (style === "offset-subtitle") {
    const subtitleX = vbW * 0.56
    return (
      <svg {...svgProps}>
        <text {...sharedMiddle} y={yFirst} fontSize={lockedFontSize} {...smTextLengthProps}>
          {line0}
        </text>
        <text
          fontFamily={fontFamily}
          fill={fillColor}
          fontWeight={300}
          fontSize={lockedSmallFontSize}
          x={subtitleX}
          y={ySecond}
          textAnchor="start"
          letterSpacing={letterSpacing}
          opacity={0.8}
          {...smTextLengthProps}
        >
          {line1}
        </text>
      </svg>
    )
  }

  return (
    <svg {...svgProps}>
      <text {...sharedMiddle} y={ySingle} fontSize={lockedFontSize} {...smTextLengthProps}>
        {line0}
      </text>
    </svg>
  )
}
