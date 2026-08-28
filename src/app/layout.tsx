import type { Metadata } from "next";
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
