"use client";
import { useState } from "react";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { arcTestnet } from "./config/chains";

export function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  8453: "Base",
  56: "BNB Chain",
  11155111: "Sepolia",
  [arcTestnet.id]: "Arc Testnet",
};

export function chainName(chainId: number | undefined) {
  if (!chainId) return "";
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
}

/**
 * Wraps wagmi + Reown AppKit into the same shape the UI previously got from
 * the hand-rolled EIP-6963 hook, so the rest of the app barely had to change.
 * The actual "pick a wallet" UI (MetaMask, Coinbase Wallet, Rabby, WalletConnect
 * for everything else) is Reown AppKit's own modal — opened via `open()`.
 */
export function useWalletKit() {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, error: switchError, isPending: switching } = useSwitchChain();
  const { open } = useAppKit();

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  return {
    address: address ?? null,
    isConnected,
    chainId,
    isWrongNetwork,
    switching,
    switchError: switchError?.message ?? null,
    switchToArc: () => switchChain({ chainId: arcTestnet.id }),
    disconnect: () => disconnect(),
    openConnectModal: () => open({ view: "Connect" }),
  };
}

/* ---------- Connected account button + dropdown ---------- */
export function WalletButton({
  address,
  chainId,
  chainLabel,
  onDisconnect,
  onSwitchToArc,
}: {
  address: string;
  chainId: number | undefined;
  chainLabel: string;
  onDisconnect: () => void;
  onSwitchToArc: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const onArc = chainId === arcTestnet.id;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="walletAccount">
      <button className="connect connected" onClick={() => setOpen((o) => !o)}>
        <span className="dot" style={!onArc ? { background: "#ffb84d", boxShadow: "0 0 8px #ffb84d" } : undefined} />
        {shortAddr(address)}
        <span>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="walletDropdown">
          {chainLabel && <div className="walletChain">{chainLabel}</div>}
          {!onArc && (
            <button className="walletRow plain warn" onClick={onSwitchToArc}>
              <span>Switch to Arc Testnet</span>
            </button>
          )}
          <button className="walletRow plain" onClick={copy}>
            <span>{copied ? "Copied!" : "Copy address"}</span>
          </button>
          <button
            className="walletRow plain"
            onClick={() => {
              const base = onArc ? "https://testnet.arcscan.app" : "https://etherscan.io";
              window.open(`${base}/address/${address}`, "_blank");
            }}
          >
            <span>View on explorer ↗</span>
          </button>
          <button
            className="walletRow plain danger"
            onClick={() => {
              onDisconnect();
              setOpen(false);
            }}
          >
            <span>Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
}
