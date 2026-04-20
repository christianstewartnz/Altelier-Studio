export function InstructionsOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(61,36,18,0.85)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-ink text-paper grain-texture w-full max-w-md border border-ink-light shadow-2xl flex flex-col">
        {/* Top label */}
        <div className="px-8 pt-6 pb-0">
          <p className="section-label-accent">Your concepts are ready</p>
        </div>

        {/* Body */}
        <div className="px-8 pt-4 pb-6 flex flex-col flex-1 justify-between gap-4">
          <h2 className="font-serif text-2xl tracking-tight leading-[1.15]">
            Three distinct brand<br />directions to explore
          </h2>

          <div className="space-y-3 text-sm text-stone-light leading-relaxed">
            <p>
              Each concept has been developed with a unique name, colour palette, typography, and
              visual identity — tailored specifically for your project.
            </p>
            <p>
              Take your time with each direction. Look for the concept that feels most true to what
              you&apos;re building, then refine individual elements to make it yours.
            </p>
            <p>
              One refinement option worth knowing about is <span className="text-paper">Add Location</span> — this lets you explore combining your brand name with the suburb or city. For example, a brand named Quatre could become Quatre Queenstown or Quatre — Queenstown. This is a common technique in property branding when the address itself is a selling point.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-ink-light" />

          <p className="text-[11px] tracking-[0.2em] uppercase text-stone-light">
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
