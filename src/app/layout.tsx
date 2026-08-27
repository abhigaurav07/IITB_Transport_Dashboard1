import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: {
    default: "Mumbai–Pune Expressway | Project Dashboard",
    template: "%s · Mumbai–Pune Expressway",
  },
  description:
    "Traffic and transportation data collection, analysis and reporting dashboard for the Mumbai–Pune Expressway study.",
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
