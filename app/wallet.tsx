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
  const detectedNames = unique.map((c) => c.name.toLowerCase());

  const MORE_WALLETS = [
    { name: "MetaMask", url: "https://metamask.io/download/", domain: "metamask.io" },
    { name: "Coinbase Wallet", url: "https://www.coinbase.com/wallet/downloads", domain: "coinbase.com" },
    { name: "Rabby Wallet", url: "https://rabby.io/", domain: "rabby.io" },
    { name: "OKX Wallet", url: "https://www.okx.com/web3", domain: "okx.com" },
    { name: "Bitget Wallet", url: "https://web3.bitget.com/en/wallet-download", domain: "bitget.com" },
    { name: "Trust Wallet", url: "https://trustwallet.com/download", domain: "trustwallet.com" },
  ].filter((w) => !detectedNames.some((d) => d.includes(w.name.toLowerCase().split(" ")[0])));

  return (
    <div className="walletOverlay" onClick={onClose}>
      <div className="walletModal" onClick={(e) => e.stopPropagation()}>
        <div className="walletModalHead">
          <span>Connect a wallet</span>
          <button className="walletClose" onClick={onClose} aria-label="Close">×</button>
        </div>

        {unique.length > 0 && (
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

        {MORE_WALLETS.length > 0 && (
          <div className="walletEmpty">
            {unique.length === 0 && <p>No EVM wallet extension detected in this browser.</p>}
            <p className="small" style={{ fontSize: 11, color: "#7c7f79", margin: unique.length ? "14px 0 8px" : "0 0 8px" }}>
              {unique.length ? "OTHER WALLETS" : "GET A WALLET"}
            </p>
            <div className="walletSuggested">
              {MORE_WALLETS.map((w) => (
                <a key={w.name} href={w.url} target="_blank" rel="noreferrer" className="walletRow">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://www.google.com/s2/favicons?domain=${w.domain}&sz=64`} alt={w.name} className="walletIcon" />
                  <span>{w.name}</span>
                  <span className="walletGo">Install ↗</span>
                </a>
              ))}
            </div>
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
