import Link from "next/link";
import Image from "next/image";

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="focus-ring flex min-w-0 items-center gap-3 rounded-lg" aria-label="Cabral House Negócios Imobiliários — início">
      <span className={`relative block size-11 shrink-0 overflow-hidden rounded-[8px] ${light ? "ring-1 ring-white/15" : "ring-1 ring-black/5"}`}>
        <Image src="/brand/cabral-house-logo.svg" alt="" fill priority sizes="44px" className="object-cover" />
      </span>
      {!compact && (
        <span className={`min-w-0 ${light ? "text-white" : "text-[#111111]"}`}>
          <span className="block truncate text-[14px] font-extrabold leading-tight tracking-[0.08em]">CABRAL HOUSE</span>
          <span className={`block truncate text-[8px] font-semibold uppercase tracking-[0.2em] ${light ? "text-white/55" : "text-[#795a25]"}`}>Negócios Imobiliários</span>
        </span>
      )}
    </Link>
  );
}
