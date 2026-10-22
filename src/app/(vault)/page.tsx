import Link from "next/link";
import HeroGraphic from "@/components/vault/HeroGraphic";
import VaultStats from "@/components/vault/VaultStats";
import { ChevronRightIcon } from "@/components/icons";

const POINTS = [
  { n: "01", t: "Record", d: "Keep every project's details, files and links in one place." },
  { n: "02", t: "Visualise", d: "Open a project to see its maps, charts and results." },
  { n: "03", t: "Revisit", d: "Find any project again by search, status or tag." },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="tp-fade text-xs font-semibold uppercase tracking-[0.16em] text-primary">IIT Bombay</p>
            <h1 className="tp-fade mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl" style={{ animationDelay: ".08s" }}>
              Every project,
              <br />
              kept in one place.
            </h1>
            <p className="tp-fade mt-5 max-w-md text-base leading-relaxed text-ink-muted" style={{ animationDelay: ".16s" }}>
              A vault for project records, data and results.
            </p>
            <div className="tp-fade mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: ".24s" }}>
              <Link
                href="/projects"
                className="group inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Existing projects
                <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/projects/new"
                className="inline-flex h-11 items-center rounded-lg border border-line bg-white px-5 text-sm font-medium text-ink transition hover:border-primary/40 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Create new project
              </Link>
            </div>
            <div className="tp-fade mt-12" style={{ animationDelay: ".32s" }}>
              <VaultStats />
            </div>
          </div>
          <HeroGraphic className="mx-auto w-full max-w-[560px]" />
        </div>
      </section>

      <section className="border-t border-line bg-canvas/60">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-14 sm:grid-cols-3">
          {POINTS.map((p) => (
            <div key={p.n} className="rounded-xl border border-line bg-white p-5">
              <span className="text-xs font-semibold tabular-nums text-primary">{p.n}</span>
              <h2 className="mt-3 text-base font-semibold text-ink">{p.t}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{p.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
