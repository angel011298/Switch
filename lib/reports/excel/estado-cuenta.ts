/**
 * CIFRA — Excel Estado de Cuenta
 * ================================
 * Genera un .xlsx con el estado de cuenta de un cliente.
 * Uso: const buffer = await generateEstadoCuentaExcel(data)
 */

import ExcelJS from 'exceljs';
import type { EstadoCuentaData } from '../pdf/estado-cuenta';

// ─── Colores CIFRA ────────────────────────────────────────────────────────────

const EMERALD  = '10b981';
const DARK     = '111827';
const LIGHT_BG = 'f9fafb';
const RED      = 'dc2626';
const YELLOW   = 'd97706';
const GREEN    = '059669';

const STATUS_COLORS: Record<string, string> = {
  PAGADA:    GREEN,
  PENDIENTE: YELLOW,
  VENCIDA:   RED,
  CANCELADA: '6b7280',
};

// ─── Helper: celda con formato moneda ────────────────────────────────────────

function money(ws: ExcelJS.Worksheet, row: number, col: number, value: number) {
  const cell = ws.getCell(row, col);
  cell.value = value;
  cell.numFmt = '"$"#,##0.00';
  cell.alignment = { horizontal: 'right' };
}

// ─── Generador principal ─────────────────────────────────────────────────────

export async function generateEstadoCuentaExcel(data: EstadoCuentaData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CIFRA ERP';
  wb.created = new Date();

  const ws = wb.addWorksheet('Estado de Cuenta', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
  });

  // ── Anchos de columna ────────────────────────────────────────────────────
  ws.columns = [
    { key: 'folio',       width: 14 },
    { key: 'fecha',       width: 14 },
    { key: 'concepto',    width: 42 },
    { key: 'importe',     width: 16 },
    { key: 'vencimiento', width: 16 },
    { key: 'status',      width: 14 },
  ];

  let r = 1; // row cursor

  // ── Fila 1: Título ────────────────────────────────────────────────────────
  ws.mergeCells(r, 1, r, 6);
  const titleCell = ws.getCell(r, 1);
  titleCell.value = `Estado de Cuenta — ${data.clienteNombre}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF' + DARK } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EMERALD } };
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(r).height = 30;
  r++;

  // ── Fila 2: Subtítulo ─────────────────────────────────────────────────────
  ws.mergeCells(r, 1, r, 6);
  const sub = ws.getCell(r, 1);
  const fmtD = (d: Date | string) =>
    new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  sub.value = `Periodo: ${fmtD(data.fechaDesde)} — ${fmtD(data.fechaHasta)}  |  RFC: ${data.clienteRfc}  |  Generado: ${fmtD(data.generadoEn)}`;
  sub.font = { name: 'Calibri', size: 9, color: { argb: 'FF' + '6b7280' } };
  sub.alignment = { horizontal: 'center' };
  ws.getRow(r).height = 18;
  r++;

  r++; // espacio

  // ── Resumen ───────────────────────────────────────────────────────────────
  const summaryHeaders = ['Total Facturado', 'Total Cobrado', 'Saldo Pendiente'];
  const summaryValues  = [data.totalFacturado, data.totalCobrado, data.totalPendiente];
  const summaryCols    = [[1, 2], [3, 4], [5, 6]];

  summaryCols.forEach(([c1, c2], idx) => {
    ws.mergeCells(r, c1, r, c2);
    const hCell = ws.getCell(r, c1);
    hCell.value = summaryHeaders[idx];
    hCell.font = { bold: true, size: 9, color: { argb: 'FF6b7280' } };
    hCell.alignment = { horizontal: 'center' };
  });
  ws.getRow(r).height = 16;
  r++;

  summaryCols.forEach(([c1, c2], idx) => {
    ws.mergeCells(r, c1, r, c2);
    const vCell = ws.getCell(r, c1);
    vCell.value = summaryValues[idx];
    vCell.numFmt = '"$"#,##0.00';
    const color = idx === 0 ? DARK : idx === 1 ? GREEN : (data.totalPendiente > 0 ? RED : DARK);
    vCell.font = { bold: true, size: 13, color: { argb: 'FF' + color } };
    vCell.alignment = { horizontal: 'center', vertical: 'middle' };
    vCell.border = {
      bottom: { style: 'medium', color: { argb: 'FF' + EMERALD } },
    };
  });
  ws.getRow(r).height = 26;
  r++;

  r++; // espacio

  // ── Cabecera de tabla ────────────────────────────────────────────────────
  const headers = ['Folio', 'Fecha Emisión', 'Concepto', 'Importe', 'Vencimiento', 'Estatus'];
  headers.forEach((h, idx) => {
    const cell = ws.getCell(r, idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
    cell.alignment = { horizontal: idx >= 3 ? 'right' : 'left', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF' + EMERALD } } };
  });
  ws.getRow(r).height = 20;
  r++;

  // ── Filas de datos ────────────────────────────────────────────────────────
  data.filas.forEach((row, idx) => {
    const isAlt = idx % 2 === 1;
    const bg = isAlt ? { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF' + LIGHT_BG } } : undefined;

    const cells = [
      { v: row.folio,                  align: 'left'  as const },
      { v: new Date(row.fecha),        align: 'left'  as const, numFmt: 'dd/mm/yyyy' },
      { v: row.concepto,               align: 'left'  as const },
      { v: row.importe,                align: 'right' as const, numFmt: '"$"#,##0.00' },
      { v: row.vencimiento ? new Date(row.vencimiento) : '', align: 'left' as const, numFmt: row.vencimiento ? 'dd/mm/yyyy' : undefined },
      { v: row.status,                 align: 'center' as const },
    ];

    cells.forEach((c, cidx) => {
      const cell = ws.getCell(r, cidx + 1);
      cell.value = c.v as ExcelJS.CellValue;
      if (c.numFmt) cell.numFmt = c.numFmt;
      cell.alignment = { horizontal: c.align, vertical: 'middle' };
      cell.font = { name: 'Calibri', size: 9 };
      if (bg) cell.fill = bg;
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFe5e7eb' } } };

      // Color del estatus
      if (cidx === 5) {
        const sc = STATUS_COLORS[row.status] ?? '6b7280';
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF' + sc } };
      }
    });

    ws.getRow(r).height = 16;
    r++;
  });

  r++; // espacio

  // ── Fila de totales ───────────────────────────────────────────────────────
  ws.mergeCells(r, 1, r, 3);
  ws.getCell(r, 1).value = 'TOTAL';
  ws.getCell(r, 1).font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  ws.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
  ws.getCell(r, 1).alignment = { horizontal: 'right' };
  money(ws, r, 4, data.totalFacturado);
  ws.getCell(r, 4).font = { bold: true, size: 10 };
  ws.getCell(r, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
  ws.getCell(r, 4).font = { bold: true, color: { argb: 'FF' + EMERALD } };
  ws.getRow(r).height = 20;

  // ── Hoja de metadatos ─────────────────────────────────────────────────────
  const meta = wb.addWorksheet('Info');
  meta.getCell('A1').value = 'Reporte';
  meta.getCell('B1').value = 'Estado de Cuenta';
  meta.getCell('A2').value = 'Cliente';
  meta.getCell('B2').value = data.clienteNombre;
  meta.getCell('A3').value = 'RFC';
  meta.getCell('B3').value = data.clienteRfc;
  meta.getCell('A4').value = 'Empresa';
  meta.getCell('B4').value = data.tenantNombre;
  meta.getCell('A5').value = 'Generado';
  meta.getCell('B5').value = new Date(data.generadoEn);
  meta.getCell('B5').numFmt = 'dd/mm/yyyy hh:mm';
  meta.getCell('A6').value = 'Generado por';
  meta.getCell('B6').value = 'CIFRA ERP — cifra-mx.vercel.app';

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
