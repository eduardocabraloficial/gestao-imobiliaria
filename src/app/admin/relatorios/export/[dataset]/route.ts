import { getExportRows } from "@/lib/data/phase6";
import { toCsv } from "@/lib/phase6";

export async function GET(_request: Request, context: { params: Promise<{ dataset: string }> }) {
  const { dataset } = await context.params; const data = await getExportRows(dataset);
  if (!data) return new Response("Não autorizado ou exportação inválida.", { status: 403 });
  return new Response(toCsv(data.headers, data.rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${dataset}.csv"`, "Cache-Control": "no-store" } });
}
