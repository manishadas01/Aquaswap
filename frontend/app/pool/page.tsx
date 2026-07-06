import { PageShell } from "@/components/PageShell";
import { PoolsList } from "@/components/pool/PoolsList";

export default function PoolPage() {
  return (
    <PageShell>
      <main className="overflow-x-hidden">
        <section className="mx-auto max-w-3xl px-6 pb-24 pt-40 lg:px-0 lg:pt-56">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-serif text-4xl font-semibold text-white md:text-5xl">Pools</h1>
            <p className="mt-3 text-white/70">
              Provide liquidity to AquaSwap pools and earn 0.3% of every swap, proportional to
              your share of the pool.
            </p>
          </div>

          <PoolsList />
        </section>
      </main>
    </PageShell>
  );
}
