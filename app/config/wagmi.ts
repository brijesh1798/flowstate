import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { injected } from "wagmi/connectors";
import { arcTestnet } from "./chains";

/**
 * WalletConnect/Reown was dropped after a persistent dependency conflict
 * (@reown/appkit-adapter-wagmi expected an incompatible @wagmi/core internal
 * export) kept breaking the production build. This config still covers the
 * main ask — MetaMask, Coinbase Wallet, Rabby and any other browser-extension
 * EVM wallet — via wagmi's built-in EIP-6963 multi-wallet auto-discovery.
 * WalletConnect (for mobile/QR) can be added back later once a compatible
 * version combo is confirmed.
 */
export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  multiInjectedProviderDiscovery: true,
  transports: {
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0]),
  },
});
