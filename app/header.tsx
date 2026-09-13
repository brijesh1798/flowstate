"use client";
import { useState } from "react";
import Link from "next/link";
import { useWalletKit, WalletModal, WalletButton, chainName } from "./wallet";
import { useWalletModal } from "./wallet-modal-context";

export function Header() {
  const [open, setOpen] = useState(false);
  const { open: walletOpen, setOpen: setWalletOpen } = useWalletModal();
  const { address, chainId, disconnect, switchToArc } = useWalletKit();

  return (
    <>
      <header>
        <Link href="/" className="brand">
          <div className="mark">F</div>
          <span>FLOWSTATE</span>
        </Link>
        <nav>
          <Link href="/">Network</Link>
          <Link href="/#pools">Pools</Link>
          <Link href="/swap">Swap</Link>
          <Link href="/liquidity">Liquidity</Link>
          <Link href="/activity">Activity</Link>
        </nav>
        {address ? (
          <WalletButton address={address} chainId={chainId} chainLabel={chainName(chainId)} onDisconnect={disconnect} onSwitchToArc={switchToArc} />
        ) : (
          <button className="connect" onClick={() => setWalletOpen(true)}>
            Connect wallet<span>↗</span>
          </button>
        )}
        <button className="mobile" onClick={() => setOpen(!open)}>
          {open ? "×" : "☰"}
        </button>
      </header>
      <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
      {open && (
        <div className="mobileNav">
          <Link href="/" onClick={() => setOpen(false)}>
            Network
          </Link>
          <Link href="/#pools" onClick={() => setOpen(false)}>
            Pools
          </Link>
          <Link href="/swap" onClick={() => setOpen(false)}>
            Swap
          </Link>
          <Link href="/liquidity" onClick={() => setOpen(false)}>
            Liquidity
          </Link>
          <Link href="/activity" onClick={() => setOpen(false)}>
            Activity
          </Link>
        </div>
      )}
    </>
  );
}
