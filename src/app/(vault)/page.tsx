import PhotoSlider from "@/components/landing/PhotoSlider";
import IitbLogo from "@/components/landing/IitbLogo";
import { LinkButton } from "@/components/ui/Button";
import { ChevronRightIcon } from "@/components/icons";

export default function LandingPage() {
  return (
    <section className="bg-gradient-to-b from-navy-50/70 to-canvas">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1fr_380px] lg:gap-12 lg:py-16">
        <div>
          <div className="tp-fade flex items-center gap-3.5" style={{ "--d": "0s" } as React.CSSProperties}>
            <IitbLogo className="h-14 w-auto sm:h-16" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink sm:text-base">Indian Institute of Technology Bombay</p>
              <p className="mt-0.5 text-[13px] text-ink-muted sm:text-sm">Department of Civil Engineering</p>
            </div>
          </div>

          <h1 className="tp-fade mt-8 text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[3.75rem]" style={{ "--d": ".08s" } as React.CSSProperties}>
            Shaping the Future<br className="hidden sm:block" /> of Mobility.
          </h1>
          <p className="tp-fade mt-6 max-w-lg text-lg leading-relaxed text-ink-muted" style={{ "--d": ".16s" } as React.CSSProperties}>
            Explore transportation projects, engineering datasets, and analytical insights in one connected workspace.
          </p>
          <div className="tp-fade mt-8" style={{ "--d": ".24s" } as React.CSSProperties}>
            <LinkButton href="/projects" size="lg">
              Explore Projects
              <ChevronRightIcon className="h-4 w-4" />
            </LinkButton>
          </div>

          <div className="tp-fade mt-10 flex items-center gap-3 border-t border-line pt-6" style={{ "--d": ".32s" } as React.CSSProperties}>
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-sm font-semibold text-on-accent">
              AM
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Professor</p>
              <p className="mt-0.5 text-base font-semibold text-ink">Prof. Avijit Maji</p>
            </div>
          </div>
        </div>

        <PhotoSlider className="tp-fade mx-auto aspect-[4/3] w-full max-w-sm [--d:.4s] lg:max-w-none" />
      </div>
    </section>
  );
}
