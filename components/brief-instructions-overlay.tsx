"use client"

type BriefInstructionsOverlayProps = {
  onDismiss: () => void
}

const points = [
  {
    number: "01",
    heading: "BE SPECIFIC ABOUT THE SITE",
    body: "The physical reality of the site is your most powerful creative asset. Orientation, views, boundaries, surroundings — the more specific, the more ownable your brand."
  },
  {
    number: "02",
    heading: "DESCRIBE THE EMOTION, NOT THE PRODUCT",
    body: "The buyer feeling field is the most important in the brief. Don't say 'good value' — say what you want buyers to feel the moment they first hear the name."
  },
  {
    number: "03",
    heading: "TELL US WHAT MAKES IT DIFFERENT",
    body: "Generic briefs produce generic brands. What would make someone choose this development over the one on the next street? Be honest and specific."
  },
  {
    number: "04",
    heading: "ADD WORDS TO AVOID",
    body: "This is one of the most powerful fields. Words to avoid push the AI toward unexpected, ownable naming territory. Think about what feels overused in your market."
  },
  {
    number: "05",
    heading: "UPLOAD VISUALS IF YOU HAVE THEM",
    body: "Architectural renders or mood boards give the AI visual context that text alone can't provide. Developments with visuals produce noticeably better brand concepts."
  }
]

export function BriefInstructionsOverlay({ onDismiss }: BriefInstructionsOverlayProps) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-ink grain-texture">
      <div className="min-h-full flex items-center justify-center px-6 py-16 pt-32 md:pt-36">
        <div className="w-full max-w-xl text-paper">
          {/* Header */}
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4 leading-[1.1]">
            How to brief Atelier Studio
          </h1>
          <p className="field-label text-stone-light mb-12">
            A better brief produces a better brand
          </p>

          {/* Instruction points */}
          <div className="space-y-8 mb-12">
            {points.map((point) => (
              <div key={point.number} className="flex gap-6">
                <span className="font-serif text-2xl text-terracotta flex-shrink-0 leading-tight">
                  {point.number}
                </span>
                <div>
                  <p className="text-[11px] tracking-[0.2em] uppercase font-medium text-paper mb-1.5">
                    {point.heading}
                  </p>
                  <p className="text-sm text-stone-light leading-relaxed">
                    {point.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Brief score explanation */}
          <div className="border-t border-ink-light pt-10 mb-10">
            <p className="field-label text-stone-light mb-4">ABOUT YOUR BRIEF SCORE</p>
            <p className="text-sm text-stone-light leading-relaxed">
              When you reach the review step you will see a brief quality score. This score measures
              how much useful information your brief contains — the higher the score, the more specific
              and considered your brand concepts will be. A score above 70% consistently produces strong,
              distinctive results. The score is based on the depth of your site context, buyer feeling,
              and point of difference — the three fields that matter most to the AI.
            </p>
          </div>

          {/* Footer note */}
          <p className="text-[11px] tracking-[0.15em] uppercase text-stone mb-6">
            You can always revisit these tips by clicking the help icon during your brief.
          </p>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="w-full h-14 px-8 text-sm font-medium tracking-[0.1em] uppercase bg-paper text-ink hover:bg-cream transition-colors duration-200"
          >
            Start My Brief →
          </button>
        </div>
      </div>
    </div>
  )
}
