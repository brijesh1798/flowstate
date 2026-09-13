"use client";
import { createContext, useContext, useState, ReactNode } from "react";

const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useWalletModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWalletModal must be used within WalletModalProvider");
  return ctx;
}
