"use client";
import { LiquidityWidget } from "../onchain";

export default function LiquidityPage() {
  return (
    <main>
      <section className="section" style={{ marginTop: 40 }}>
        <div className="sectionHead">
          <div>
            <small>PROVIDE</small>
            <h2>Liquidity</h2>
          </div>
        </div>
        <LiquidityWidget />
      </section>
    </main>
  );
}
