type LogoProps = {
  reversed?: boolean
  height?: number
  className?: string
}

export function Logo({ reversed = false, height = 48, className = "" }: LogoProps) {
  return (
    <img
      src={reversed ? "/logo-reversed.svg" : "/logo.svg"}
      alt="Lot One"
      style={{ height: `${height}px`, width: "auto", display: "block" }}
      className={className}
    />
  )
}
