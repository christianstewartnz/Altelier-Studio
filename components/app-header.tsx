import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Logo } from "@/components/logo"

type Breadcrumb = {
  label: string
  href?: string
}

type AppHeaderProps = {
  breadcrumbs?: Breadcrumb[]
  actions?: ReactNode
  center?: ReactNode
  children?: ReactNode
  logoHref?: string
  className?: string
  /** Default sticky (dashboard); use fixed for overlays / scroll-fading headers */
  position?: "sticky" | "fixed"
  style?: CSSProperties
}

export function AppHeader({
  breadcrumbs = [],
  actions,
  center,
  children,
  logoHref = "/dashboard",
  className = "",
  position = "sticky",
  style,
}: AppHeaderProps) {
  const positionClasses =
    position === "fixed"
      ? "fixed top-0 left-0 right-0 z-[70]"
      : "sticky top-0 z-[70]"

  return (
    <header
      className={`${positionClasses} border-t-2 border-t-[#B5281C] border-b border-[#E6DED6] bg-[#FAF9F7]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FAF9F7]/90 ${className}`}
      style={style}
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid min-h-[74px] grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link href={logoHref} className="shrink-0">
              <Logo height={42} />
            </Link>

            {breadcrumbs.length > 0 && (
              <>
                <div className="hidden h-8 w-px bg-[#E6DED6] sm:block" />
                <nav className="hidden min-w-0 items-center gap-2 overflow-hidden text-[11px] uppercase tracking-[0.22em] text-[#7A7268] sm:flex">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <div key={`${breadcrumb.label}-${index}`} className="flex min-w-0 items-center gap-2">
                      {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-[#B7ADA2]" />}
                      {breadcrumb.href ? (
                        <Link
                          href={breadcrumb.href}
                          className="truncate transition-colors hover:text-[#14110F]"
                        >
                          {breadcrumb.label}
                        </Link>
                      ) : (
                        <span className="truncate text-[#A39588]">{breadcrumb.label}</span>
                      )}
                    </div>
                  ))}
                </nav>
              </>
            )}
          </div>

          <div className="hidden min-w-0 items-center justify-center md:flex">
            {center}
          </div>

          <div className="flex items-center justify-end gap-3 sm:gap-4">
            {actions}
          </div>
        </div>

        {children}
      </div>
    </header>
  )
}
