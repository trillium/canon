"use client";

import { WebhookAdapter } from "feedtack";
import { FeedtackProvider as FeedtackReactProvider } from "feedtack/react";
import type { ReactNode } from "react";

interface FeedtackProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

const adapter = new WebhookAdapter({
  submitUrl: "/api/feedtack",
  loadFeedback: async (filter) => {
    const res = await fetch(`/api/feedtack?pathname=${encodeURIComponent(filter?.pathname ?? "")}`);
    return res.ok ? res.json() : [];
  },
});

const anonymousUser = { id: "anonymous", name: "Anonymous", role: "stakeholder" };

export function FeedtackProvider({ children, enabled = false }: FeedtackProviderProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <FeedtackReactProvider adapter={adapter} currentUser={anonymousUser}>
      {children}
    </FeedtackReactProvider>
  );
}
