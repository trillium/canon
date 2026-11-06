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
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <PostHogProvider>
            <FeedtackProvider>
              <div className="flex flex-1 flex-col">
                <div className="flex flex-1 flex-col">{children}</div>
              </div>
            </FeedtackProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
