export default function AdminLoading() {
  return <div role="status" aria-label="Carregando conteúdo" className="animate-pulse"><div className="h-3 w-24 rounded bg-[#e4e8e4]" /><div className="mt-3 h-8 w-64 rounded bg-[#e1e6e2]" /><div className="mt-2 h-4 w-96 max-w-full rounded bg-[#e8ebe8]" /><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 rounded-2xl bg-white shadow-sm" />)}</div><div className="mt-6 h-72 rounded-2xl bg-white shadow-sm" /><span className="sr-only">Carregando...</span></div>;
}
