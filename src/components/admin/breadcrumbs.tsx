import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-[11px] font-semibold text-[#6f7974]">{items.map((item, index) => <span key={`${item.label}-${index}`} className="flex items-center gap-1">{index > 0 && <ChevronRight size={12} aria-hidden />}{item.href ? <Link href={item.href} className="focus-ring rounded hover:text-[#315d50]">{item.label}</Link> : <span aria-current="page" className="text-[#263a32]">{item.label}</span>}</span>)}</nav>;
}
