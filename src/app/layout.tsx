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
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: {
    default: "Transport Projects",
    template: "%s | Transport Projects",
  },
  description: "A vault for project records, data and results.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Sets data-theme before first paint so the wrong theme never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
