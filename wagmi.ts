import { cookieStorage, createStorage, http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { arcTestnet } from "./chains";

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

if (!projectId && typeof window !== "undefined") {
  // Non-fatal: injected wallets (MetaMask/Coinbase/Rabby) still work without this.
  // WalletConnect-based mobile wallets need a real project id from https://cloud.reown.com
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set — WalletConnect will be unavailable.");
}

export const networks = [arcTestnet];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0]),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
