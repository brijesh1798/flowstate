"use client";
import Link from "next/link";
import { BalancesPanel, PoolsSection } from "./onchain";

export default function Home() {
  return (
    <main>
      <section className="hero" id="network">
        <div className="sparkle">
          <span className="layer1"></span>
          <span className="layer2"></span>
        </div>
        <div className="aura"></div>
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
          <Link href="/swap" className="primary">
            Open swap ↗
          </Link>
          <button className="secondary" onClick={() => document.getElementById("pools")?.scrollIntoView({ behavior: "smooth" })}>
            View pools ›
          </button>
        </div>
        <BalancesPanel />
      </section>

      <section className="section" id="pools">
        <div className="sectionHead">
          <div>
            <small>LIQUIDITY MAP</small>
            <h2>Pools</h2>
          </div>
        </div>
        <PoolsSection />
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
          <Link href="/swap" className="primary">
            Launch swap ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
