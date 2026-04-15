export function isLightColor(hex: string): boolean {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return false
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928
      ? s / 12.92
      : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const luminance =
    0.2126 * toLinear(r) +
    0.7152 * toLinear(g) +
    0.0722 * toLinear(b)
  return luminance > 0.35
}

export function getContrastColor(bgColor: string): string {
  return isLightColor(bgColor) ? '#1A1A1A' : '#F8F4EF'
}

export function getLuminance(hex: string): number {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928
      ? s / 12.92
      : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) +
    0.7152 * toLinear(g) +
    0.0722 * toLinear(b)
}

export function getSortedColors(colors: string[]): string[] {
  return [...colors].sort((a, b) => getLuminance(a) - getLuminance(b))
}
