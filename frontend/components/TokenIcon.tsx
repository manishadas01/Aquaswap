import { cn } from '@/lib/utils';

const TOKEN_STYLES: Record<string, string> = {
  XLM: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
  USDC: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white',
  EURC: 'bg-gradient-to-br from-indigo-400 to-violet-600 text-white',
};

export function TokenIcon({ symbol, className }: { symbol: string; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
        TOKEN_STYLES[symbol] ?? 'bg-white/20 text-white',
        className,
      )}
    >
      {symbol.slice(0, 1)}
    </span>
  );
}
