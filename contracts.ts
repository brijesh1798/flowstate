/**
 * Contract addresses for Arc Testnet.
 *
 * Tokens: copied from Circle's official docs
 * (https://docs.arc.network/arc/references/contract-addresses).
 *
 * DEX (factory/router/pair): these are NOT an official Circle deployment —
 * there isn't one yet. They come from a third-party community submission
 * ("Arc Swap") posted publicly on Circle's arc-node GitHub issue tracker
 * (circlefin/arc-node#160), whose author explicitly invited other
 * developers to reuse the Router/Factory. They are unaudited and not
 * controlled by you or Anthropic — fine for a testnet demo, but know that
 * before treating this as "your" liquidity. Re-verify these on
 * https://testnet.arcscan.app before relying on them for anything real.
 */
export const TOKENS = {
  USDC: { address: "0x3600000000000000000000000000000000000000" as const, symbol: "USDC", decimals: 6 },
  EURC: { address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as const, symbol: "EURC", decimals: 6 },
  USYC: { address: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C" as const, symbol: "USYC", decimals: 6 },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

export const DEX = {
  factory: "0x7483847d46db2920dd64efa676cf72dcf765814f" as const,
  router: "0xe27d5d256b370604f1ff060fb489c6a8e3f8a6d9" as const,
  pairs: {
    "USDC/EURC": "0xb3685D16AAa06361ED28377b1319136650Fa9A13" as const,
    // USDC/USYC pair address was not provided/verified — leave empty until confirmed on-chain
    // (factory.getPair(USDC, USYC) will tell you if/when one exists).
    "USDC/USYC": "" as string,
  },
};

export function pairKeyFor(a: TokenSymbol, b: TokenSymbol): { key: string; flipped: boolean } | null {
  const k1 = `${a}/${b}`;
  const k2 = `${b}/${a}`;
  if (DEX.pairs[k1 as keyof typeof DEX.pairs]) return { key: k1, flipped: false };
  if (DEX.pairs[k2 as keyof typeof DEX.pairs]) return { key: k2, flipped: true };
  return null;
}
