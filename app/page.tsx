"use client";
import { useState } from "react";
import { useWallet, WalletModal, WalletButton, chainName } from "./wallet";
import { BalancesPanel, PoolsSection, SwapWidget, ActivitySection } from "./onchain";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const { providers, provider, address, chainId, connecting, error, connect, disconnect, switchToArc } = useWallet();

  return (
    <main>
      <header>
        <div className="brand">
          <div className="mark">F</div>
          <span>FLOWSTATE</span>
        </div>
        <nav>
          <a href="#network">Network</a>
          <a href="#pools">Pools</a>
          <a href="#swap">Swap</a>
          <a href="#activity">Activity</a>
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
      <WalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        providers={providers}
        connecting={connecting}
        error={error}
        onConnect={(d) => {
          connect(d);
          setWalletOpen(false);
        }}
      />
      {open && (
        <div className="mobileNav">
          <a href="#network">Network</a>
          <a href="#pools">Pools</a>
          <a href="#swap">Swap</a>
          <a href="#activity">Activity</a>
        </div>
      )}

      <section className="hero" id="network">
        <div className="eyebrow">
          <span className="live"></span> ARC TESTNET · LIVE NETWORK
        </div>
        <h1>
          Follow the
          <br />
          <em>flow of capital.</em>
        </h1>
        <p>Flowstate turns Arc's USDC activity into a clear, real-time view of swaps, pools and liquidity.</p>
        <div className="actions">
          <button className="primary" onClick={() => document.getElementById("swap")?.scrollIntoView({ behavior: "smooth" })}>
            Open swap ↗
          </button>
          <button className="secondary" onClick={() => document.getElementById("pools")?.scrollIntoView({ behavior: "smooth" })}>
            View pools ›
          </button>
        </div>
        <BalancesPanel provider={provider} address={address} chainId={chainId} />
      </section>

      <section className="section" id="pools">
        <div className="sectionHead">
          <div>
            <small>LIQUIDITY MAP</small>
            <h2>Pools</h2>
          </div>
        </div>
        <PoolsSection provider={provider} />
      </section>

      <section className="section" id="swap">
        <div className="sectionHead">
          <div>
            <small>TRADE</small>
            <h2>Swap</h2>
          </div>
        </div>
        <SwapWidget provider={provider} address={address} chainId={chainId} />
      </section>

      <section className="section activity" id="activity">
        <div className="sectionHead">
          <div>
            <small>NETWORK ACTIVITY</small>
            <h2>Recent swaps</h2>
          </div>
          <span className="liveText">
            <span className="live"></span> on-chain
          </span>
        </div>
        <ActivitySection provider={provider} />
      </section>

      <section className="cta">
        <div>
          <small>BUILT FOR ARC</small>
          <h2>
            One network.
            <br />
            One clear view.
          </h2>
        </div>
        <div className="ctaRight">
          <p>Track USDC liquidity, understand DEX activity and turn raw on-chain events into decisions.</p>
          <button className="primary" onClick={() => document.getElementById("swap")?.scrollIntoView({ behavior: "smooth" })}>
            Launch swap ↗
          </button>
        </div>
      </section>
      <footer>
        <div className="brand">
          <div className="mark">F</div>
          <span>FLOWSTATE</span>
        </div>
        <span>ARC TESTNET · USDC INTELLIGENCE</span>
        <span>5042002</span>
      </footer>
    </main>
  );
}
