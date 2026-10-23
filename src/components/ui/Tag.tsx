export default function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md border border-line-soft bg-canvas px-2 py-0.5 text-xs text-ink-muted">{children}</span>;
}
