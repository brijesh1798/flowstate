"use client";
import { ActivitySection } from "../onchain";

export default function ActivityPage() {
  return (
    <main>
      <section className="section activity" style={{ marginTop: 40 }}>
        <div className="sectionHead">
          <div>
            <small>NETWORK ACTIVITY</small>
            <h2>Recent swaps</h2>
          </div>
          <span className="liveText">
            <span className="live"></span> on-chain
          </span>
        </div>
        <ActivitySection />
      </section>
    </main>
  );
}
