import PhotoSlider from "@/components/landing/PhotoSlider";
import IitbLogo from "@/components/landing/IitbLogo";
import { LinkButton } from "@/components/ui/Button";
import { ChevronRightIcon } from "@/components/icons";

export default function LandingPage() {
  return (
    <section className="bg-gradient-to-b from-navy-50/70 to-white">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
        <div>
          <div className="tp-fade flex items-center gap-3.5">
            <IitbLogo className="h-14 w-auto sm:h-16" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-navy sm:text-base">Indian Institute of Technology Bombay</p>
              <p className="mt-0.5 text-[13px] text-ink-muted sm:text-sm">Department of Civil Engineering</p>
            </div>
          </div>

          <h1 className="tp-fade mt-8 text-5xl font-semibold leading-[1.04] tracking-tight text-navy sm:text-6xl lg:text-[4.5rem]" style={{ animationDelay: ".05s" }}>
            Shaping the Future of Mobility
          </h1>
          <p className="tp-fade mt-6 max-w-lg text-lg leading-relaxed text-ink-muted" style={{ animationDelay: ".1s" }}>
            A central workspace for transportation projects, technical analyses and supporting records.
          </p>
          <div className="tp-fade mt-8" style={{ animationDelay: ".15s" }}>
            <LinkButton href="/projects" size="lg">
              Explore Projects
              <ChevronRightIcon className="h-4 w-4" />
            </LinkButton>
          </div>

          <div className="tp-fade mt-10 flex items-center gap-3 border-t border-line pt-6" style={{ animationDelay: ".2s" }}>
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
              AM
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Professor</p>
              <p className="mt-0.5 text-base font-semibold text-ink">Prof. Avijit Maji</p>
            </div>
          </div>
        </div>

        <PhotoSlider className="aspect-[4/3] w-full" />
      </div>
    </section>
  );
}
