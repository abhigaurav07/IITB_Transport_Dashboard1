import HeroGraphic from "@/components/vault/HeroGraphic";
import { LinkButton } from "@/components/ui/Button";
import { ChevronRightIcon } from "@/components/icons";

export default function LandingPage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:py-20">
      <div>
        <h1 className="tp-fade max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight text-navy sm:text-5xl">
          Research, data and engineering results.
        </h1>
        <p className="tp-fade mt-5 max-w-md text-base leading-relaxed text-ink-muted" style={{ animationDelay: ".05s" }}>
          A central workspace for transportation projects, technical analyses and supporting records.
        </p>
        <div className="tp-fade mt-8" style={{ animationDelay: ".1s" }}>
          <LinkButton href="/projects" size="lg">
            Explore Projects
            <ChevronRightIcon className="h-4 w-4" />
          </LinkButton>
        </div>
      </div>
      <HeroGraphic className="mx-auto w-full max-w-[560px]" />
    </section>
  );
}
