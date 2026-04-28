"use client"

import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"

type WorkflowHeaderProps = {
  projectName?: string
  onStartOver: () => void
  onLogout?: () => void
  onOpenInstructions?: () => void
}

export function WorkflowHeader({
  projectName,
  onStartOver,
  onOpenInstructions,
}: WorkflowHeaderProps) {
  return (
    <AppHeader
      breadcrumbs={[
        { label: "Projects", href: "/dashboard" },
        { label: projectName || "Project Brief" },
      ]}
      actions={(
        <div className="flex items-center gap-3">
          {onOpenInstructions && (
            <button
              type="button"
              onClick={onOpenInstructions}
              title="Brief instructions"
              className="flex h-7 w-7 items-center justify-center border border-[#7A7268] text-xs font-medium text-[#7A7268] transition-colors hover:border-[#14110F] hover:text-[#14110F]"
            >
              ?
            </button>
          )}
          <button
            type="button"
            onClick={onStartOver}
            className="flex items-center gap-2 text-sm text-[#7A7268] transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      )}
    />
  )
}
