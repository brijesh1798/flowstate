"use client";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
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

export function useWalletKit() {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, error: switchError } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  return {
    address: address ?? null,
    isConnected,
    chainId,
    isWrongNetwork,
    switchError: switchError?.message ?? null,
    switchToArc: () => switchChain({ chainId: arcTestnet.id }),
    disconnect: () => disconnect(),
  };
}

export function WalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connectors, connect, isPending, error } = useConnect();
  if (!open) return null;

  const unique = connectors.filter((c, i) => connectors.findIndex((c2) => c2.id === c.id) === i);

  return (
    <div className="walletOverlay" onClick={onClose}>
      <div className="walletModal" onClick={(e) => e.stopPropagation()}>
        <div className="walletModalHead">
          <span>Connect a wallet</span>
          <button className="walletClose" onClick={onClose} aria-label="Close">×</button>
        </div>
        {unique.length === 0 ? (
          <div className="walletEmpty">
            <p>No EVM wallet extension detected in this browser.</p>
            <div className="walletSuggested">
              <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="walletRow">
                <span className="walletIconFallback">M</span>
                <span>MetaMask</span>
                <span className="walletGo">Install ↗</span>
              </a>
              <a href="https://www.coinbase.com/wallet/downloads" target="_blank" rel="noreferrer" className="walletRow">
                <span className="walletIconFallback">C</span>
                <span>Coinbase Wallet</span>
                <span className="walletGo">Install ↗</span>
              </a>
              <a href="https://rabby.io/" target="_blank" rel="noreferrer" className="walletRow">
                <span className="walletIconFallback">R</span>
                <span>Rabby Wallet</span>
                <span className="walletGo">Install ↗</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="walletList">
            {unique.map((c) => (
              <button
                key={c.id}
                className="walletRow"
                disabled={isPending}
                onClick={() => {
                  connect({ connector: c, chainId: arcTestnet.id });
                  onClose();
                }}
              >
                {c.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.icon} alt={c.name} className="walletIcon" />
                ) : (
                  <span className="walletIconFallback">{c.name[0]}</span>
                )}
                <span>{c.name}</span>
                <span className="walletGo">Connect</span>
              </button>
            ))}
          </div>
        )}
        {error && <div className="walletError">{error.message}</div>}
        <p className="walletFoot">By connecting, you agree to Flowstate's terms and acknowledge the risks of interacting with a testnet dApp.</p>
      </div>
    </div>
  );
}

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
