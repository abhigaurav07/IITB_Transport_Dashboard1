import type { Metadata } from "next";
// Inter is self-hosted from @fontsource rather than fetched from Google
// Fonts at build time: it ships the actual woff2 files, so the build
// never depends on reaching fonts.googleapis.com and the page never waits
// on a third-party font request at runtime either. Only the weights the
// dashboard actually uses (regular, medium, semibold) are loaded.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { PROJECT } from "@/data/project";

export const metadata: Metadata = {
  title: {
    default: `${PROJECT.shortName} | Project Dashboard`,
    template: `%s | ${PROJECT.shortName}`,
  },
  description: `${PROJECT.fullName}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
