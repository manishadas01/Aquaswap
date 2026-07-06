import React from "react";
import { ShieldCheck, Zap, GitFork } from "lucide-react";
import { SwapCard } from "@/components/swap/SwapCard";

const highlights = [
  { icon: Zap, label: "0.3% swaps, instant settlement" },
  { icon: ShieldCheck, label: "Non-custodial, Freighter-signed" },
  { icon: GitFork, label: "Permissionless pools, x*y=k" },
];

export default function HeroSection() {
  return (
    <main className="overflow-x-hidden">
      <section>
        <div className="py-24 md:pb-32 lg:pb-24 lg:pt-56">
          <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-xl lg:text-left">
              <h1 className="font-serif mt-8 max-w-2xl text-balance text-5xl text-white md:text-6xl lg:mt-0 xl:text-7xl font-semibold">
                Swap, powered by Stellar.
              </h1>
              <p className="mt-8 max-w-2xl text-balance text-lg text-white/90">
                AquaSwap is a Uniswap V2-style automated market maker built on Soroban.
                Permissionless pools, LP fee accrual, and multi-hop routing — settled on
                Stellar in seconds.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
                {highlights.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md"
                  >
                    <Icon className="size-4 text-white/60" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-[420px] justify-center lg:mx-0 lg:justify-end">
              <SwapCard />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
