"use client";
import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { arcTestnet } from "./config/chains";
import { wagmiAdapter, wagmiConfig, projectId, networks } from "./config/wagmi";

const queryClient = new QueryClient();

if (typeof window !== "undefined" && projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks: [arcTestnet, ...networks.filter((n) => n.id !== arcTestnet.id)] as [typeof arcTestnet, ...typeof networks],
    defaultNetwork: arcTestnet,
    projectId,
    metadata: {
      name: "Flowstate",
      description: "Arc Testnet liquidity intelligence",
      url: typeof window !== "undefined" ? window.location.origin : "https://flowstate-final.vercel.app",
      icons: ["https://flowstate-final.vercel.app/icon.png"],
    },
    features: { analytics: false, email: false, socials: [] },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
