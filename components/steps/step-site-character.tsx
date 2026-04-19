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
    <div className="animate-fade-up">
      {/* Hero Section — with grain texture */}
      <section className="bg-ink text-paper py-16 md:py-24 grain-texture">
        <div className="mx-auto max-w-3xl px-6 relative z-10">
          <div className="max-w-xl">
            <p className="step-label text-stone-light mb-6">Step 02</p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6 text-balance leading-[1.1]">
              What defines the place?
            </h1>
            <p className="text-lg text-stone-light leading-relaxed max-w-md">
              The qualities that make this site unique will shape the brand identity.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section — warm off-white background */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-16">
            {/* Site Qualities */}
            <div className="space-y-6">
              <Label className="field-label">
                Site Qualities
                <span className="text-stone-light font-normal ml-2 text-[11px] normal-case tracking-normal">(Select all that apply)</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {siteQualities.map((quality) => {
                  const isSelected = data.qualities.includes(quality.id)
                  return (
                    <button
                      key={quality.id}
                      type="button"
                      onClick={() => toggleQuality(quality.id)}
                      className={`
                        relative px-5 py-4 text-sm text-left transition-all duration-200 border flex items-center justify-between
                        ${isSelected
                          ? "bg-ink text-paper border-ink"
                          : "bg-paper border-border text-foreground hover:border-terracotta"
                        }
                      `}
                    >
                      {quality.label}
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Site Context */}
            <div className="space-y-4">
              <Label htmlFor="siteContext" className="field-label">
                What makes this specific site or address unique?
              </Label>
              <Textarea
                id="siteContext"
                placeholder={`e.g. Corner site elevated above street level
with views to the harbour. Former orchard land.
Adjacent to a popular cycling trail.`}
                value={data.siteContext}
                onChange={(e) => onChange({ ...data, siteContext: e.target.value })}
                rows={4}
                className="px-0 py-4 bg-transparent border-0 border-b-2 border-border rounded-none text-lg placeholder:text-stone-light focus:ring-0 focus:border-terracotta transition-colors resize-none"
              />
            </div>

            {/* Desired Tone */}
            <div className="space-y-6">
              <Label className="field-label">
                Desired Tone / Feeling
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {tones.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => onChange({ ...data, desiredTone: tone })}
                    className={`
                      px-5 py-4 text-sm text-left transition-all duration-200 border
                      ${data.desiredTone === tone
                        ? "bg-ink text-paper border-ink"
                        : "bg-paper border-border text-foreground hover:border-terracotta"
                      }
                    `}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Visuals & Documents */}
            <div className="space-y-6">
              <div>
                <Label className="field-label">
                  Project Visuals & Documents
                  <span className="text-stone-light font-normal ml-2 text-[11px] normal-case tracking-normal">(Optional)</span>
                </Label>
                <p className="text-sm text-stone mt-2">
                  Renders, site photos, architectural references or resource consent documents.
                </p>
              </div>

              {/* Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border bg-paper p-10 text-center cursor-pointer hover:border-terracotta transition-all duration-200"
              >
                <Upload className="w-8 h-8 mx-auto mb-4 text-stone" />
                <p className="text-sm text-foreground font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-stone">
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
                <div className="space-y-4">
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
                              className="w-20 h-20 object-cover border border-border"
                            />
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-ink text-paper flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
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
                            className="flex items-center gap-2 px-4 py-2 bg-cream border border-border text-sm"
                          >
                            <FileText className="w-4 h-4 text-stone" />
                            <span className="text-foreground truncate max-w-[200px]">{file.name}</span>
                            <span className="text-stone">{formatFileSize(file.size)}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="ml-1 text-stone hover:text-foreground transition-colors"
                            >
                              <X className="w-4 h-4" />
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
            <div className="pt-8 flex justify-between border-t border-border">
              <Button
                variant="ghost"
                onClick={onPrevious}
                className="h-14 px-6 text-base font-medium text-stone hover:text-foreground hover:bg-cream transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>
              <Button
                onClick={onNext}
                disabled={!isValid}
                className="h-14 px-10 text-base font-medium bg-ink text-paper hover:bg-ink-light disabled:opacity-40 transition-all duration-200 group"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
