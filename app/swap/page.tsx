"use client";
import { SwapWidget } from "../onchain";
import { useWalletModal } from "../wallet-modal-context";

export default function SwapPage() {
  const { setOpen } = useWalletModal();
  return (
    <main>
      <section className="section" style={{ marginTop: 40 }}>
        <div className="sectionHead">
          <div>
            <small>TRADE</small>
            <h2>Swap</h2>
          </div>
        </div>
        <SwapWidget onConnectClick={() => setOpen(true)} />
      </section>
    </main>
  );
}
