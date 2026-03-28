import { NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';

// GET /api/bi/export-excel?months=6
// Generates a simple CSV/Excel compatible export of BI data
export async function GET(req: Request) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const url = new URL(req.url);
  const months = parseInt(url.searchParams.get('months') ?? '6');
  const baseUrl = url.origin;

  // Fetch all data in parallel
  const headers = { Cookie: req.headers.get('cookie') ?? '' };
  const [kpisRes, ioRes, prodRes, agingRes] = await Promise.all([
    fetch(`${baseUrl}/api/bi/kpis`, { headers }).then(r => r.json()),
    fetch(`${baseUrl}/api/bi/ingresos-egresos?months=${months}`, { headers }).then(r => r.json()),
    fetch(`${baseUrl}/api/bi/top-productos?months=${months}&limit=20`, { headers }).then(r => r.json()),
    fetch(`${baseUrl}/api/bi/cobranza-aging`, { headers }).then(r => r.json()),
  ]);

  // Build CSV with multiple sections
  const lines: string[] = [];
  const sep = ',';

  lines.push('CIFRA ERP — Reporte BI');
  lines.push(`Generado: ${new Date().toLocaleString('es-MX')}`);
  lines.push(`Período analizado: ${months} meses`);
  lines.push('');

  lines.push('=== KPIs PRINCIPALES ===');
  lines.push('Métrica,Valor');
  lines.push(`Facturado este mes,${kpisRes.facturadoMes}`);
  lines.push(`Facturado mes anterior,${kpisRes.facturadoMesAnterior}`);
  lines.push(`Variación MoM (%),${kpisRes.momPct}`);
  lines.push(`Ventas POS este mes,${kpisRes.posVentasMes}`);
  lines.push(`Empleados activos,${kpisRes.empleadosActivos}`);
  lines.push(`Deals abiertos,${kpisRes.dealsAbiertos}`);
  lines.push(`Deals ganados,${kpisRes.dealsGanados}`);
  lines.push('');

  lines.push('=== INGRESOS VS EGRESOS ===');
  lines.push('Mes,Ingresos,Egresos');
  for (const row of ioRes) {
    lines.push(`${row.mes}${sep}${row.ingresos}${sep}${row.egresos}`);
  }
  lines.push('');

  lines.push('=== TOP PRODUCTOS ===');
  lines.push('Producto,SKU,Unidades Vendidas,Ingresos');
  for (const p of prodRes) {
    lines.push(`"${p.name}"${sep}${p.sku ?? ''}${sep}${p.unitsSold}${sep}${p.revenue}`);
  }
  lines.push('');

  lines.push('=== AGING DE COBRANZA ===');
  lines.push('Bucket,Facturas,Monto');
  for (const a of agingRes) {
    lines.push(`${a.bucket}${sep}${a.count}${sep}${a.monto}`);
  }

  const csv = lines.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bi-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
