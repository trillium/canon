"use client";

import { FeedtackOverlay } from "feedtack";
import type { ReactNode } from "react";

interface FeedtackProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function FeedtackProvider({ children, enabled = false }: FeedtackProviderProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <FeedtackOverlay
      adapter={{
        type: "webhook",
        url: "/api/feedtack",
      }}
    >
      {children}
    </FeedtackOverlay>
  );
}
