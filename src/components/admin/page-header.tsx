export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6b3f]">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-[#111111] sm:text-[28px]">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#747d78]">{description}</p>
      </div>
      {action}
    </div>
  );
}
