import { cn } from "@/lib/utils";
import type { FollowUpStatus } from "@/types";

const labels: Record<FollowUpStatus, string> = {
  overdue: "Atrasado",
  today: "Hoje",
  scheduled: "Agendado",
};

export function StatusBadge({ status }: { status: FollowUpStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
      status === "overdue" && "bg-[#fae9e7] text-[#a43f39]",
      status === "today" && "bg-[#fff1d8] text-[#9a681f]",
      status === "scheduled" && "bg-[#e8f1ec] text-[#376655]",
    )}>
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
