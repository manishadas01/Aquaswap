'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TokenSelector } from '@/components/swap/TokenSelector';
import { SlippageSettings } from '@/components/swap/SlippageSettings';
import { useWallet } from '@/context/WalletContext';
import { tokenList, contractsDeployed, type TokenInfo } from '@/lib/config';
import { getQuote, type Quote } from '@/lib/quote';
import { parseUnits, formatUnits } from '@/lib/units';
import { swapExactTokensForTokens } from '@/lib/soroban';
import { hasTrustline, establishTrustline } from '@/lib/trustline';
import { getTokenBalance } from '@/lib/balances';

const DEFAULT_SELL = tokenList[0];
const DEFAULT_BUY = tokenList[1] ?? tokenList[0];

export function SwapCard() {
  const { publicKey, isConnected, isConnecting, connect } = useWallet();

  const [sellToken, setSellToken] = useState<TokenInfo>(DEFAULT_SELL);
  const [buyToken, setBuyToken] = useState<TokenInfo>(DEFAULT_BUY);
  const [sellAmount, setSellAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // null = not yet checked, true = needs a trustline before it can receive buyToken
  const [needsTrustline, setNeedsTrustline] = useState<boolean | null>(null);
  const [isEstablishingTrustline, setIsEstablishingTrustline] = useState(false);
  const [sellBalance, setSellBalance] = useState<bigint | null>(null);

  const amountIn = parseUnits(sellAmount, sellToken.decimals);
  const hasAmount = amountIn > 0n;
  const sameToken = sellToken.symbol === buyToken.symbol;
  const insufficientBalance = sellBalance !== null && amountIn > sellBalance;

  useEffect(() => {
    if (!isConnected || !publicKey) {
      setNeedsTrustline(null);
      return;
    }
    let cancelled = false;
    setNeedsTrustline(null);
    hasTrustline(publicKey, buyToken).then((has) => {
      if (!cancelled) setNeedsTrustline(!has);
    });
    return () => {
      cancelled = true;
    };
  }, [isConnected, publicKey, buyToken]);

  useEffect(() => {
    if (!isConnected || !publicKey) {
      setSellBalance(null);
      return;
    }
    let cancelled = false;
    getTokenBalance(publicKey, sellToken).then((bal) => {
      if (!cancelled) setSellBalance(bal);
    });
    return () => {
      cancelled = true;
    };
  }, [isConnected, publicKey, sellToken]);

  useEffect(() => {
    if (!hasAmount || sameToken) {
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);

    const timer = setTimeout(() => {
      getQuote(sellToken.sac, buyToken.sac, amountIn)
        .then((result) => {
          if (cancelled) return;
          setQuote(result);
        })
        .catch((err) => {
          if (cancelled) return;
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : 'Failed to fetch quote');
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amountIn, hasAmount, sameToken, sellToken.sac, buyToken.sac]);

  function handleMaxSell() {
    if (sellBalance === null || sellBalance <= 0n) return;
    setSellAmount(formatUnits(sellBalance, sellToken.decimals));
  }

  function handleFlip() {
    const nextSellAmount = quote ? formatUnits(quote.amountOut, buyToken.decimals) : '';
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount(nextSellAmount);
  }

  function handleSellTokenChange(token: TokenInfo) {
    setSellToken(token);
    if (token.symbol === buyToken.symbol) {
      setBuyToken(sellToken);
    }
  }

  function handleBuyTokenChange(token: TokenInfo) {
    setBuyToken(token);
    if (token.symbol === sellToken.symbol) {
      setSellToken(buyToken);
    }
  }

  async function handleEstablishTrustline() {
    if (!publicKey) return;
    setIsEstablishingTrustline(true);
    try {
      await establishTrustline(publicKey, buyToken);
      toast.success(`Trustline added for ${buyToken.symbol}`);
      setNeedsTrustline(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add trustline');
    } finally {
      setIsEstablishingTrustline(false);
    }
  }

  async function handleSwap() {
    if (!quote || !publicKey) return;
    setIsSwapping(true);
    try {
      const slippageBps = BigInt(Math.round((1 - slippage / 100) * 10_000));
      const amountOutMin = (quote.amountOut * slippageBps) / 10_000n;

      const hash = await swapExactTokensForTokens({
        publicKey,
        amountIn,
        amountOutMin,
        path: [sellToken.sac, buyToken.sac],
        deadline: Math.floor(Date.now() / 1000) + 10 * 60,
      });

      toast.success('Swap submitted', { description: `Tx hash: ${hash.slice(0, 12)}…` });
      setSellAmount('');
      setQuote(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setIsSwapping(false);
    }
  }

  const buyAmountDisplay = quote ? formatUnits(quote.amountOut, buyToken.decimals) : '';
  const rate =
    quote && hasAmount
      ? Number(formatUnits(quote.amountOut, buyToken.decimals, 8)) / Number(sellAmount)
      : null;
  const priceImpactPct = quote ? quote.priceImpact * 100 : null;
  const minReceived = quote
    ? formatUnits(
        (quote.amountOut * BigInt(Math.round((1 - slippage / 100) * 10_000))) / 10_000n,
        buyToken.decimals,
      )
    : null;

  let ctaLabel = 'Swap';
  let ctaDisabled = false;
  let ctaAction: () => void = handleSwap;

  if (!isConnected) {
    ctaLabel = isConnecting ? 'Connecting…' : 'Connect Wallet';
    ctaAction = connect;
    ctaDisabled = isConnecting;
  } else if (!hasAmount) {
    ctaLabel = 'Enter an amount';
    ctaDisabled = true;
  } else if (sameToken) {
    ctaLabel = 'Select different tokens';
    ctaDisabled = true;
  } else if (insufficientBalance) {
    ctaLabel = `Insufficient ${sellToken.symbol} balance`;
    ctaDisabled = true;
  } else if (!contractsDeployed) {
    ctaLabel = 'Pools not deployed yet';
    ctaDisabled = true;
  } else if (isEstablishingTrustline) {
    ctaLabel = 'Adding trustline…';
    ctaDisabled = true;
  } else if (needsTrustline) {
    ctaLabel = `Add trustline for ${buyToken.symbol}`;
    ctaAction = handleEstablishTrustline;
  } else if (isSwapping) {
    ctaLabel = 'Swapping…';
    ctaDisabled = true;
  } else if (quoteLoading) {
    ctaLabel = 'Fetching best price…';
    ctaDisabled = true;
  } else if (!quote) {
    ctaLabel = 'No liquidity for this pair';
    ctaDisabled = true;
  }

  return (
    <div className="w-full max-w-[420px] rounded-3xl border border-white/15 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-2xl sm:p-5">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-white">Swap</h2>
        <SlippageSettings value={slippage} onChange={setSlippage} />
      </div>

      <div className="relative flex flex-col gap-1">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-white/50">
            <span className={insufficientBalance ? 'text-amber-400' : undefined}>You pay</span>
            {isConnected && sellBalance !== null && (
              <button type="button" onClick={handleMaxSell} className="transition hover:text-white">
                Balance: {formatUnits(sellBalance, sellToken.decimals)}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <input
              inputMode="decimal"
              placeholder="0.0"
              value={sellAmount}
              onChange={(e) => {
                const v = e.target.value;
                if (/^\d*\.?\d*$/.test(v)) setSellAmount(v);
              }}
              className="w-full min-w-0 bg-transparent text-3xl font-medium text-white placeholder:text-white/25 focus:outline-none"
            />
            <TokenSelector
              tokens={tokenList}
              value={sellToken}
              onChange={handleSellTokenChange}
              excludeSymbol={buyToken.symbol}
            />
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={handleFlip}
            aria-label="Flip tokens"
            className="flex size-9 items-center justify-center rounded-xl border-4 border-[#150f13] bg-white/15 text-white transition hover:bg-white/25"
          >
            <ArrowDown className="size-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-white/50">
            <span>You receive</span>
            {quoteLoading && <Loader2 className="size-3.5 animate-spin text-white/40" />}
          </div>
          <div className="flex items-center justify-between gap-3">
            <input
              readOnly
              placeholder="0.0"
              value={buyAmountDisplay}
              className="w-full min-w-0 bg-transparent text-3xl font-medium text-white placeholder:text-white/25 focus:outline-none"
            />
            <TokenSelector
              tokens={tokenList}
              value={buyToken}
              onChange={handleBuyTokenChange}
              excludeSymbol={sellToken.symbol}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 min-h-4 px-1 text-xs text-white/50">
        {rate !== null && (
          <p>
            1 {sellToken.symbol} ≈ {rate.toFixed(6)} {buyToken.symbol}
          </p>
        )}
        {quoteError && hasAmount && !sameToken && (
          <p className="text-amber-400/80">{quoteError} — live quotes activate once pools are deployed.</p>
        )}
      </div>

      {quote && (
        <div className="mt-2 space-y-1 rounded-xl border border-white/10 bg-black/10 px-3 py-2.5 text-xs text-white/60">
          <div className="flex justify-between">
            <span>Price impact</span>
            <span className={priceImpactPct !== null && priceImpactPct > 5 ? 'text-amber-400' : 'text-white/80'}>
              {priceImpactPct?.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Minimum received</span>
            <span className="text-white/80">
              {minReceived} {buyToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Liquidity provider fee</span>
            <span className="text-white/80">0.30%</span>
          </div>
        </div>
      )}

      <Button
        onClick={ctaAction}
        disabled={ctaDisabled}
        className="mt-4 h-12 w-full rounded-2xl bg-white text-base font-semibold text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/50"
      >
        {(isSwapping || quoteLoading || isEstablishingTrustline) && (
          <Loader2 className="size-4 animate-spin" />
        )}
        {ctaLabel}
      </Button>

      {!contractsDeployed && (
        <p className="mt-3 px-1 text-center text-[11px] leading-snug text-white/35">
          Contracts are being deployed to Stellar Testnet — swapping unlocks automatically once live.
        </p>
      )}
    </div>
  );
}
