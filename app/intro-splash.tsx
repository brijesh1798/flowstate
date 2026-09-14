"use client";
import { useEffect, useState } from "react";

export function IntroSplash() {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("flowstate-intro-seen")) return;
    setShow(true);
    const t1 = setTimeout(() => setFading(true), 1700);
    const t2 = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("flowstate-intro-seen", "1");
    }, 2150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("flowstate-intro-seen", "1");
    }, 400);
  };

  if (!show) return null;

  return (
    <div className={`introSplash${fading ? " introFading" : ""}`} onClick={dismiss}>
      <svg viewBox="0 0 400 180" className="introDragon" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 130 Q90 30 190 95 T390 50" fill="none" stroke="#b8ff6a" strokeWidth="3" strokeLinecap="round" className="introPath" />
        <circle cx="390" cy="50" r="5" fill="#b8ff6a" className="introSpark" />
      </svg>
      <div className="introWord">ARC</div>
      <div className="introSub">FLOWSTATE · TESTNET</div>
    </div>
  );
}
