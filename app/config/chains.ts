import { defineChain } from "viem";

/**
 * Arc Testnet (Circle's USDC-native L1).
 * Chain ID as given in the project spec. Note: some third-party
 * explorers/tools have been seen referencing a different short chain id
 * (5042) elsewhere on the web — if wallet connections ever report a
 * mismatch, double check this value against https://docs.arc.network
 * before shipping.
 */
export const arcTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002),
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});
