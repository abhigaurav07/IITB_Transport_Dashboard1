import VaultHeader from "@/components/vault/VaultHeader";

export default function VaultLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <VaultHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-ink-muted">
          <span>Transport Projects &middot; IIT Bombay</span>
          <span>A record of projects, data and results.</span>
        </div>
      </footer>
    </div>
  );
}
