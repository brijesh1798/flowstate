"use client";
import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, type State } from "wagmi";
import { wagmiConfig } from "./config/wagmi";

const queryClient = new QueryClient();

export function Providers({ children, initialState }: { children: ReactNode; initialState?: State }) {
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
