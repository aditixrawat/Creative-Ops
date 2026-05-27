"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime:    5 * 60_000,
        retry: (failureCount, error: unknown) => {
          // Don't retry on auth errors
          const status = (error as { status?: number })?.status;
          if (status === 401 || status === 403) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Singleton on server, fresh on client
let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Sonner toaster — styled to match design system */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background:   "var(--bg-layer-2, #222625)",
            border:       "1px solid rgba(173,252,249,0.12)",
            borderRadius: "12px",
            color:        "var(--text-primary, #f0faf9)",
            fontFamily:   "'Space Grotesk', sans-serif",
            fontSize:     "13px",
            boxShadow:    "0 8px 32px rgba(0,0,0,0.5)",
          },
          classNames: {
            success: "!border-[rgba(75,100,74,0.4)]",
            error:   "!border-[rgba(52,28,28,0.8)]",
            warning: "!border-[rgba(73,57,59,0.6)]",
          },
        }}
        icons={{
          success: "✓",
          error:   "✕",
          warning: "⚠",
          info:    "ℹ",
        }}
      />

      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
