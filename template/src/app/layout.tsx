import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FeedtackProvider } from "@/providers/FeedtackProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Canon Template",
  description: "A canon-conformant Next.js application",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <PostHogProvider>
            <FeedtackProvider>{children}</FeedtackProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
