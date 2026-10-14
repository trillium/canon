import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/content";
import { FeedtackProvider } from "@/providers/FeedtackProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
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
