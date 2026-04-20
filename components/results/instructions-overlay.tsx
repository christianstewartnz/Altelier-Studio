import { APP_NAME, APP_SUBTITLE } from "@/lib/config";

export function InstructionsOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(61,36,18,0.85)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-ink text-paper grain-texture w-full max-w-md border border-ink-light shadow-2xl">
        {/* Header bar */}
        <div className="border-b border-ink-light px-8 py-5 flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-tight">{APP_NAME}</span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-stone-light font-medium ml-1">
            {APP_SUBTITLE}
          </span>
        </div>

        {/* Body */}
        <div className="px-8 pt-8 pb-6">
          <p className="section-label-accent mb-3">Your concepts are ready</p>
          <h2 className="font-serif text-3xl tracking-tight leading-[1.15] mb-6">
            Three distinct brand<br />directions to explore
          </h2>

          <div className="space-y-4 text-sm text-stone-light leading-relaxed">
            <p>
              Each concept has been developed with a unique name, colour palette, typography, and
              visual identity — tailored specifically for your project.
            </p>
            <p>
              Take your time with each direction. Look for the concept that feels most true to what
              you&apos;re building, then refine individual elements to make it yours.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-ink-light mt-7 mb-5" />

          <p className="text-[11px] tracking-[0.2em] uppercase text-stone-light mb-6">
            3 refinements available per concept
          </p>

          <button
            className="w-full h-12 px-8 text-sm font-medium tracking-[0.1em] uppercase bg-terracotta text-paper hover:bg-terracotta-dark transition-colors duration-200 cursor-pointer"
            onClick={onDismiss}
          >
            View My Concepts
          </button>
        </div>
      </div>
    </div>
  );
}
