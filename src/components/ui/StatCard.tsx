type Tone = "default" | "primary" | "success" | "warning";

const TONE_TEXT: Record<Tone, string> = {
  default: "text-ink",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
};

export default function StatCard({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 lg:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums leading-none lg:text-3xl ${TONE_TEXT[tone]}`}>
        {value}
      </p>
      {sublabel ? <p className="mt-2 text-xs text-ink-muted">{sublabel}</p> : null}
    </div>
  );
}
