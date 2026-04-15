import { APP_NAME, APP_SUBTITLE } from "@/lib/config";

export function InstructionsOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-card rounded-3xl p-10 max-w-lg mx-6 shadow-2xl border border-border">
        <div className="flex flex-col items-center">
          <span className="font-serif text-2xl md:text-3xl tracking-tight text-[#1C1C1C]">
            {APP_NAME}
          </span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#6B6B6B] ml-6 -mt-0.5">
            {APP_SUBTITLE}
          </span>
        </div>

        <h2 className="font-serif text-3xl text-foreground tracking-tight mt-6 mb-4 text-center">
          Your Brand Concepts Are Ready
        </h2>

        <div className="text-muted-foreground text-center leading-relaxed space-y-4">
          <p>
            You&apos;re about to see three distinct brand directions created specifically for your
            project. Each concept has been developed with a unique name, colour palette, typography,
            and visual identity.
          </p>
          <p>
            Take your time exploring each one. Think of them as creative directions rather than
            finished designs — you&apos;re looking for the concept that feels most true to your
            project.
          </p>
          <p>
            Once you&apos;ve found a direction you love, you can refine individual elements.
            Don&apos;t like the name? We can generate alternatives. Want a different colour palette?
            We can explore other options. The concept is the foundation — refinement is how we make
            it yours.
          </p>
        </div>

        <hr className="mt-6 mb-6 border-border" />

        <p className="text-sm text-muted-foreground text-center">
          You have 3 refinements available per concept.
        </p>

        <button
          className="w-full h-14 px-8 rounded-2xl text-base font-medium bg-foreground text-background hover:bg-foreground/80 transition-all duration-200 cursor-pointer"
          onClick={onDismiss}
        >
          View My Concepts
        </button>
      </div>
    </div>
  );
}
