"use client";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, formatUnits, parseAbiItem } from "viem";
import { arcTestnet } from "./config/chains";
import { TOKENS, DEX, pairKeyFor, TokenSymbol } from "./config/contracts";
import { ERC20_ABI, UNISWAP_V2_PAIR_ABI, UNISWAP_V2_ROUTER_ABI } from "./config/abis";

const TOKEN_SYMBOLS = Object.keys(TOKENS) as TokenSymbol[];
const ZERO = "0x0000000000000000000000000000000000000000" as const;

function errMsg(err: unknown, fallback: string) {
  const e = err as { shortMessage?: string; message?: string };
  return e?.shortMessage || e?.message || fallback;
}

/* ---------- Balances panel ---------- */
export function BalancesPanel() {
  const { address, isConnected, chainId } = useAccount();
  const onArc = chainId === arcTestnet.id;

  const balanceContracts: readonly unknown[] = TOKEN_SYMBOLS.flatMap((sym) => [
    { address: TOKENS[sym].address, abi: ERC20_ABI, functionName: "balanceOf", args: [address ?? ZERO], chainId: arcTestnet.id },
    { address: TOKENS[sym].address, abi: ERC20_ABI, functionName: "decimals", chainId: arcTestnet.id },
  ]);
  const { data, isLoading } = useReadContracts({
    contracts: balanceContracts as never,
    query: { enabled: !!address && onArc },
  });

  if (!isConnected || !address) return null;
  if (!onArc) {
    return <div className="onchainNotice">Switch your wallet to Arc Testnet (use the network menu in your wallet button above) to see live balances.</div>;
  }

  return (
    <div className="balancesRow">
      {TOKEN_SYMBOLS.map((sym, i) => {
        const bal = data?.[i * 2]?.result as bigint | undefined;
        const dec = (data?.[i * 2 + 1]?.result as number | undefined) ?? TOKENS[sym].decimals;
        return (
          <div className="balanceCard" key={sym}>
            <span className="label">{sym}</span>
            <b>{bal !== undefined ? formatUnits(bal, dec) : isLoading ? "…" : "—"}</b>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Pools section: real reserves + your LP share ---------- */
export function PoolsSection() {
  const { address } = useAccount();
  const pairAddress = DEX.pairs["USDC/EURC"];
  const enabled = !!pairAddress;

  const poolContracts: readonly unknown[] = enabled
    ? [
        { address: pairAddress as `0x${string}`, abi: UNISWAP_V2_PAIR_ABI, functionName: "getReserves", chainId: arcTestnet.id },
        { address: pairAddress as `0x${string}`, abi: UNISWAP_V2_PAIR_ABI, functionName: "token0", chainId: arcTestnet.id },
        { address: pairAddress as `0x${string}`, abi: UNISWAP_V2_PAIR_ABI, functionName: "totalSupply", chainId: arcTestnet.id },
        { address: pairAddress as `0x${string}`, abi: UNISWAP_V2_PAIR_ABI, functionName: "balanceOf", args: [address ?? ZERO], chainId: arcTestnet.id },
      ]
    : [];
  const { data } = useReadContracts({
    contracts: poolContracts as never,
    query: { enabled },
  });

  if (!enabled) {
    return (
      <div className="onchainEmpty">
        <p>Only one pool is verified right now.</p>
        <p className="small">
          USDC/EURC has a confirmed on-chain pair. USDC/USYC does not yet — see <code>WEB3_SETUP.md</code> for how to check
          for one before adding it here.
        </p>
      </div>
    );
  }

  const reserves = data?.[0]?.result as readonly [bigint, bigint, number] | undefined;
  const token0 = data?.[1]?.result as string | undefined;
  const totalSupply = data?.[2]?.result as bigint | undefined;
  const lpBalance = data?.[3]?.result as bigint | undefined;
  const usdcIsToken0 = token0?.toLowerCase() === TOKENS.USDC.address.toLowerCase();
  const reserveUSDC = reserves ? (usdcIsToken0 ? reserves[0] : reserves[1]) : undefined;
  const reserveEURC = reserves ? (usdcIsToken0 ? reserves[1] : reserves[0]) : undefined;
  const share = totalSupply && lpBalance && totalSupply > 0n ? (Number(lpBalance) / Number(totalSupply)) * 100 : 0;

  return (
    <div className="table">
      <div className="row">
        <div className="pair">
          <div className="coin">$</div>
          <strong>USDC / EURC</strong>
        </div>
        <div>
          <span className="label">RESERVE (USDC)</span>
          <b>{reserveUSDC !== undefined ? formatUnits(reserveUSDC, 6) : "…"}</b>
        </div>
        <div>
          <span className="label">RESERVE (EURC)</span>
          <b>{reserveEURC !== undefined ? formatUnits(reserveEURC, 6) : "…"}</b>
        </div>
        <div>
          <span className="label">YOUR SHARE</span>
          <b>{lpBalance !== undefined && lpBalance > 0n ? `${share.toFixed(4)}%` : "—"}</b>
        </div>
        <a href={`https://testnet.arcscan.app/address/${pairAddress}`} target="_blank" rel="noreferrer">
          ↗
        </a>
      </div>
    </div>
  );
}

/* ---------- Swap widget ---------- */
export function SwapWidget({ onConnectClick }: { onConnectClick?: () => void }) {
  const { address, chainId } = useAccount();
  const onArc = chainId === arcTestnet.id;
  const [tokenIn, setTokenIn] = useState<TokenSymbol>("USDC");
  const [tokenOut, setTokenOut] = useState<TokenSymbol>("EURC");
  const [amountIn, setAmountIn] = useState("");
  const [slippagePct] = useState(0.5);
  const [phase, setPhase] = useState<"idle" | "approving" | "swapping">("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const found = pairKeyFor(tokenIn, tokenOut);
  const path = found ? [TOKENS[tokenIn].address, TOKENS[tokenOut].address] : undefined;
  const amountInRaw = amountIn && Number(amountIn) > 0 ? parseUnits(amountIn, TOKENS[tokenIn].decimals) : 0n;

  const { data: amountsOut } = useReadContract({
    address: DEX.router,
    abi: UNISWAP_V2_ROUTER_ABI,
    functionName: "getAmountsOut",
    args: path ? [amountInRaw, path] : undefined,
    chainId: arcTestnet.id,
    query: { enabled: !!found && amountInRaw > 0n },
  });
  const quoteOut = amountsOut ? (amountsOut as readonly bigint[])[1] : undefined;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKENS[tokenIn].address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, DEX.router] : undefined,
    chainId: arcTestnet.id,
    query: { enabled: !!address },
  });

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });

  const needsApproval = allowance !== undefined && amountInRaw > 0n && (allowance as bigint) < amountInRaw;

  const swap = async () => {
    setErrorMsg(null);
    setTxHash(null);
    if (!address) return setErrorMsg("Connect your wallet first.");
    if (!onArc) return setErrorMsg("Switch to Arc Testnet first.");
    if (!found || !path) return setErrorMsg("This pair isn't available yet.");
    if (amountInRaw <= 0n) return setErrorMsg("Enter an amount.");
    try {
      if (needsApproval) {
        setPhase("approving");
        const approveHash = await writeContractAsync({
          address: TOKENS[tokenIn].address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [DEX.router, amountInRaw],
          chainId: arcTestnet.id,
        });
        await publicClient?.waitForTransactionReceipt({ hash: approveHash });
        await refetchAllowance();
      }
      setPhase("swapping");
      const minOut = quoteOut ? (quoteOut * BigInt(Math.round((100 - slippagePct) * 100))) / 10000n : 0n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const hash = await writeContractAsync({
        address: DEX.router,
        abi: UNISWAP_V2_ROUTER_ABI,
        functionName: "swapExactTokensForTokens",
        args: [amountInRaw, minOut, path, address, deadline],
        chainId: arcTestnet.id,
      });
      setTxHash(hash);
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      if (receipt?.status === "reverted") setErrorMsg("Transaction reverted on-chain.");
    } catch (err) {
      setErrorMsg(errMsg(err, "Transaction failed."));
    } finally {
      setPhase("idle");
    }
  };

  return (
    <div className="swapWidget">
      <div className="swapRow">
        <select value={tokenIn} onChange={(e) => setTokenIn(e.target.value as TokenSymbol)}>
          {TOKEN_SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" />
      </div>
      <button
        className="swapFlip"
        onClick={() => {
          setTokenIn(tokenOut);
          setTokenOut(tokenIn);
        }}
        aria-label="Flip"
      >
        ⇅
      </button>
      <div className="swapRow">
        <select value={tokenOut} onChange={(e) => setTokenOut(e.target.value as TokenSymbol)}>
          {TOKEN_SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input placeholder="0.0" value={quoteOut !== undefined ? formatUnits(quoteOut, TOKENS[tokenOut].decimals) : ""} readOnly />
      </div>

      {!found && tokenIn !== tokenOut && (
        <p className="onchainNotice small">This pair has no verified on-chain pool yet — only USDC/EURC is confirmed.</p>
      )}

      <button
        className="primary swapButton"
        disabled={phase !== "idle" || (!!address && (!found || tokenIn === tokenOut))}
        onClick={!address ? onConnectClick : swap}
      >
        {phase === "approving" ? "Approving…" : phase === "swapping" ? "Confirm in wallet…" : !address ? "Connect wallet to swap" : "Swap"}
      </button>
      {errorMsg && <p className="swapStatus" style={{ color: "#ff9a8a" }}>{errorMsg}</p>}
      {txHash && (
        <a className="swapStatus" href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noreferrer">
          View transaction on Arcscan ↗
        </a>
      )}
    </div>
  );
}

/* ---------- Liquidity widget: add / remove / LP position ---------- */
export function LiquidityWidget() {
  const { address, chainId } = useAccount();
  const onArc = chainId === arcTestnet.id;
  const pairAddress = DEX.pairs["USDC/EURC"];
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { data: lpBalance, refetch: refetchLp } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: UNISWAP_V2_PAIR_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: { enabled: !!address && !!pairAddress },
  });

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });

  if (!pairAddress) return null;

  const addLiquidity = async () => {
    if (!address) return;
    setBusy(true);
    setStatus(null);
    setTxHash(null);
    try {
      const amountARaw = parseUnits(amountA || "0", TOKENS.USDC.decimals);
      const amountBRaw = parseUnits(amountB || "0", TOKENS.EURC.decimals);
      setStatus("Approving USDC…");
      const a1 = await writeContractAsync({ address: TOKENS.USDC.address, abi: ERC20_ABI, functionName: "approve", args: [DEX.router, amountARaw], chainId: arcTestnet.id });
      await publicClient?.waitForTransactionReceipt({ hash: a1 });
      setStatus("Approving EURC…");
      const a2 = await writeContractAsync({ address: TOKENS.EURC.address, abi: ERC20_ABI, functionName: "approve", args: [DEX.router, amountBRaw], chainId: arcTestnet.id });
      await publicClient?.waitForTransactionReceipt({ hash: a2 });
      setStatus("Adding liquidity…");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const hash = await writeContractAsync({
        address: DEX.router,
        abi: UNISWAP_V2_ROUTER_ABI,
        functionName: "addLiquidity",
        args: [TOKENS.USDC.address, TOKENS.EURC.address, amountARaw, amountBRaw, 0n, 0n, address, deadline],
        chainId: arcTestnet.id,
      });
      setTxHash(hash);
      await publicClient?.waitForTransactionReceipt({ hash });
      setStatus("Liquidity added.");
      refetchLp();
    } catch (err) {
      setStatus(errMsg(err, "Add liquidity failed."));
    } finally {
      setBusy(false);
    }
  };

  const removeLiquidity = async () => {
    if (!address || !lpBalance) return;
    setBusy(true);
    setStatus(null);
    setTxHash(null);
    try {
      setStatus("Approving LP tokens…");
      const a1 = await writeContractAsync({
        address: pairAddress as `0x${string}`,
        abi: UNISWAP_V2_PAIR_ABI,
        functionName: "approve",
        args: [DEX.router, lpBalance as bigint],
        chainId: arcTestnet.id,
      });
      await publicClient?.waitForTransactionReceipt({ hash: a1 });
      setStatus("Removing liquidity…");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const hash = await writeContractAsync({
        address: DEX.router,
        abi: UNISWAP_V2_ROUTER_ABI,
        functionName: "removeLiquidity",
        args: [TOKENS.USDC.address, TOKENS.EURC.address, lpBalance as bigint, 0n, 0n, address, deadline],
        chainId: arcTestnet.id,
      });
      setTxHash(hash);
      await publicClient?.waitForTransactionReceipt({ hash });
      setStatus("Liquidity removed.");
      refetchLp();
    } catch (err) {
      setStatus(errMsg(err, "Remove liquidity failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="swapWidget">
      <div className="swapRow">
        <span style={{ fontSize: 12, color: "#8f928c", width: 70 }}>USDC</span>
        <input value={amountA} onChange={(e) => setAmountA(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.0" inputMode="decimal" />
      </div>
      <div className="swapRow">
        <span style={{ fontSize: 12, color: "#8f928c", width: 70 }}>EURC</span>
        <input value={amountB} onChange={(e) => setAmountB(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.0" inputMode="decimal" />
      </div>
      <button className="primary swapButton" disabled={busy || !onArc || !address} onClick={addLiquidity}>
        {busy ? "Confirm in wallet…" : "Add liquidity"}
      </button>
      <button className="secondary swapButton" disabled={busy || !onArc || !lpBalance || (lpBalance as bigint) === 0n} onClick={removeLiquidity}>
        Remove all my liquidity
      </button>
      <p className="swapStatus">LP balance: {lpBalance !== undefined ? formatUnits(lpBalance as bigint, 18) : "…"}</p>
      {status && <p className="swapStatus">{status}</p>}
      {txHash && (
        <a className="swapStatus" href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noreferrer">
          View transaction on Arcscan ↗
        </a>
      )}
    </div>
  );
}

/* ---------- Activity section: real Swap events from the pair ---------- */
export function ActivitySection() {
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const pairAddress = DEX.pairs["USDC/EURC"];
  const { data: token0 } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: UNISWAP_V2_PAIR_ABI,
    functionName: "token0",
    chainId: arcTestnet.id,
    query: { enabled: !!pairAddress },
  });
  const [logs, setLogs] = useState<{ hash: string; amount0In: bigint }[]>([]);

  useEffect(() => {
    if (!publicClient || !pairAddress) return;
    let cancelled = false;
    (async () => {
      try {
        const latest = await publicClient.getBlockNumber();
        const fromBlock = latest > 5000n ? latest - 5000n : 0n;
        const swapEvent = parseAbiItem(
          "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)"
        );
        const result = await publicClient.getLogs({ address: pairAddress as `0x${string}`, event: swapEvent, fromBlock, toBlock: "latest" });
        if (!cancelled) {
          setLogs(
            result
              .slice(-10)
              .reverse()
              .map((l) => ({ hash: l.transactionHash, amount0In: (l.args as { amount0In: bigint }).amount0In }))
          );
        }
      } catch {
        if (!cancelled) setLogs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicClient, pairAddress]);

  if (!pairAddress) {
    return (
      <div className="onchainEmpty">
        <p>No swaps yet.</p>
        <p className="small">Activity will stream in here once a verified pair exists for that combination.</p>
      </div>
    );
  }
  if (logs.length === 0) {
    return <div className="onchainEmpty small">No swaps in the last ~5,000 blocks.</div>;
  }

  const usdcIsToken0 = (token0 as string | undefined)?.toLowerCase() === TOKENS.USDC.address.toLowerCase();

  return (
    <div className="table">
      {logs.map((log, i) => {
        const usdcIn = usdcIsToken0 ? log.amount0In > 0n : log.amount0In === 0n;
        return (
          <div className="row" key={log.hash + i}>
            <div className="wallet">
              <span>◌</span>
              <strong>
                {log.hash.slice(0, 6)}…{log.hash.slice(-4)}
              </strong>
            </div>
            <div>
              <span className="label">ROUTE</span>
              <b>{usdcIn ? "USDC → EURC" : "EURC → USDC"}</b>
            </div>
            <a href={`https://testnet.arcscan.app/tx/${log.hash}`} target="_blank" rel="noreferrer">
              View ↗
            </a>
          </div>
        );
      })}
    </div>
  );
}
