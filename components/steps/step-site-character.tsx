"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Check, Upload, X, FileText } from "lucide-react"
import type { SiteCharacterData } from "@/app/page"

type StepSiteCharacterProps = {
  data: SiteCharacterData
  onChange: (data: SiteCharacterData) => void
  onNext: () => void
  onPrevious: () => void
}

const siteQualities = [
  { id: "views", label: "Views" },
  { id: "sun-light", label: "Sun / Light" },
  { id: "elevation", label: "Elevation" },
  { id: "coastal", label: "Coastal" },
  { id: "urban", label: "Urban" },
  { id: "heritage", label: "Heritage" },
  { id: "landscape", label: "Landscape Connection" },
  { id: "architectural", label: "Architectural" },
  { id: "community", label: "Community-Oriented" },
  { id: "private", label: "Private / Secluded" },
  { id: "sustainable", label: "Sustainable" },
  { id: "resort", label: "Resort-Style" },
  { id: "parkside", label: "Parkside" },
  { id: "bushland", label: "Bushland" }
]

const tones = [
  "Refined elegance",
  "Warm and inviting",
  "Bold and contemporary",
  "Calm and serene",
  "Sophisticated luxury",
  "Natural and grounded",
  "Urban chic",
  "Timeless classic"
]

export function StepSiteCharacter({ data, onChange, onNext, onPrevious }: StepSiteCharacterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleQuality = (qualityId: string) => {
    const qualities = data.qualities.includes(qualityId)
      ? data.qualities.filter((q) => q !== qualityId)
      : [...data.qualities, qualityId]
    onChange({ ...data, qualities })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onChange({ ...data, attachments: [...data.attachments, ...files] })
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (index: number) => {
    const newAttachments = data.attachments.filter((_, i) => i !== index)
    onChange({ ...data, attachments: newAttachments })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isPDF = (file: File) => file.type === "application/pdf"

  const isValid = data.qualities.length > 0 && data.desiredTone && data.siteContext

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-20">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-5 text-balance">
            What defines the place?
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            Help us understand the qualities that make this site unique.
          </p>
        </div>

        <div className="space-y-12">
          {/* Site Qualities */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">
              Site Qualities
              <span className="text-muted-foreground font-normal ml-2">(Select all that apply)</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {siteQualities.map((quality) => {
                const isSelected = data.qualities.includes(quality.id)
                return (
                  <button
                    key={quality.id}
                    type="button"
                    onClick={() => toggleQuality(quality.id)}
                    className={`relative px-5 py-4 rounded-2xl text-sm text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card border border-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      {quality.label}
                      {isSelected && <Check className="size-4 ml-2" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="siteContext" className="text-sm font-medium text-foreground">
              What makes this specific site or address unique?
            </Label>
            <Textarea
              id="siteContext"
              placeholder={`e.g. Corner site elevated above street level 
with views to the harbour. Former orchard land. 
Adjacent to a popular cycling trail.`}
              value={data.siteContext}
              onChange={(e) => onChange({ ...data, siteContext: e.target.value })}
              rows={3}
              className="px-5 py-4 bg-card border-border rounded-2xl text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Desired Tone */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">
              Desired Tone / Feeling
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {tones.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => onChange({ ...data, desiredTone: tone })}
                  className={`px-5 py-4 rounded-2xl text-sm text-left transition-all duration-200 ${
                    data.desiredTone === tone
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Project Visuals & Documents */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">
              Project Visuals & Documents
              <span className="text-muted-foreground font-normal ml-2">(Optional)</span>
            </Label>
            <p className="text-sm text-muted-foreground -mt-2">
              Renders, site photos, architectural references or resource consent documents. PDFs and images accepted.
            </p>
            
            {/* Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-secondary/30 transition-all duration-200"
            >
              <Upload className="size-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Images and PDFs up to 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Uploaded Files */}
            {data.attachments.length > 0 && (
              <div className="space-y-3">
                {/* Image Thumbnails */}
                {data.attachments.filter(f => !isPDF(f)).length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {data.attachments.map((file, index) => {
                      if (isPDF(file)) return null
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="size-20 object-cover rounded-xl border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="absolute -top-2 -right-2 size-6 bg-foreground text-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* PDF Pills */}
                {data.attachments.filter(f => isPDF(f)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.attachments.map((file, index) => {
                      if (!isPDF(file)) return null
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm"
                        >
                          <FileText className="size-4 text-muted-foreground" />
                          <span className="text-foreground truncate max-w-[200px]">{file.name}</span>
                          <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="pt-8 flex justify-between">
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="h-14 px-6 rounded-2xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <ArrowLeft className="size-5 mr-2" />
              Previous
            </Button>
            <Button
              onClick={onNext}
              disabled={!isValid}
              className="h-14 px-8 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-all duration-200"
            >
              Continue
              <ArrowRight className="size-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
