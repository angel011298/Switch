/**
 * CIFRA — PDF Reporte Ejecutivo Mensual
 * =======================================
 * Genera un reporte ejecutivo con KPIs, ingresos/egresos,
 * ISR/IVA fiscal y top productos del mes.
 *
 * FASE 50: Reportes Avanzados
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface EjecutivoKpis {
  facturadoMes: number;
  facturadoMesAnterior: number;
  momPct: number;
  posVentasMes: number;
  empleadosActivos: number;
  dealsGanados: number;
}

export interface EjecutivoFiscal {
  isr: number;
  imss: number;
  ivaTrasl: number;
  ivaAcred: number;
  ivaNeto: number;
}

export interface EjecutivoIngreso {
  mes: string;
  ingresos: number;
  egresos: number;
}

export interface EjecutivoProducto {
  name: string;
  sku: string | null;
  unitsSold: number;
  revenue: number;
}

export interface EjecutivoData {
  tenantNombre: string;
  tenantRfc: string;
  tenantLogoUrl?: string | null;
  mes: string;                          // e.g. "Marzo 2026"
  generadoEn: Date | string;
  kpis: EjecutivoKpis;
  fiscal: EjecutivoFiscal;
  ingresosMeses: EjecutivoIngreso[];    // últimos 6 meses
  topProductos: EjecutivoProducto[];    // top 5
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

function fmtDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Paleta ──────────────────────────────────────────────────────────────────

const C = {
  primary:   '#3b82f6',
  dark:      '#111827',
  gray:      '#6b7280',
  lightGray: '#f9fafb',
  border:    '#e5e7eb',
  white:     '#ffffff',
  emerald:   '#10b981',
  amber:     '#f59e0b',
  red:       '#ef4444',
  purple:    '#8b5cf6',
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 8, color: C.dark,
    backgroundColor: C.white, paddingHorizontal: 32, paddingVertical: 28,
  },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerLeft: { flexDirection: 'column', gap: 2 },
  tenantName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.dark },
  tenantRfc:  { fontSize: 8, color: C.gray },
  reportTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.primary, marginTop: 4 },
  reportMes:   { fontSize: 10, color: C.gray, marginTop: 2 },
  logoBox: { alignItems: 'flex-end' },
  logo:    { width: 60, height: 30, objectFit: 'contain' },

  // Divider
  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },

  // Sección
  sectionTitle: {
    fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.primary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
  },

  // KPI cards en grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  kpiCard: {
    flex: 1, minWidth: '30%', backgroundColor: C.lightGray,
    borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: C.primary,
  },
  kpiLabel: { fontSize: 7, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  kpiValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.dark },
  kpiSub:   { fontSize: 7, color: C.gray, marginTop: 2 },
  kpiPos:   { color: C.emerald },
  kpiNeg:   { color: C.red },

  // Tabla
  table:     { width: '100%', marginBottom: 14 },
  tableHead: {
    flexDirection: 'row', backgroundColor: C.dark, borderRadius: 4,
    paddingVertical: 5, paddingHorizontal: 6, marginBottom: 2,
  },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tableRowAlt: { backgroundColor: C.lightGray },
  tdText:  { fontSize: 8, color: C.dark },
  tdMono:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark },
  tdGray:  { fontSize: 8, color: C.gray },

  // Fiscal grid
  fiscalGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  fiscalCard: {
    flex: 1, backgroundColor: C.lightGray, borderRadius: 6, padding: 10,
  },
  fiscalLabel: { fontSize: 7, color: C.gray, textTransform: 'uppercase', marginBottom: 2 },
  fiscalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.dark },

  // Barra de progreso para top productos
  barBg: { backgroundColor: C.border, borderRadius: 2, height: 5, marginTop: 3 },
  barFill: { backgroundColor: C.primary, borderRadius: 2, height: 5 },

  // Footer
  footer: {
    position: 'absolute', bottom: 18, left: 32, right: 32,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerText: { fontSize: 7, color: C.gray },
});

// ─── Componente ──────────────────────────────────────────────────────────────

export function EjecutivoDocument({ data }: { data: EjecutivoData }) {
  const { kpis, fiscal, ingresosMeses, topProductos } = data;
  const momSign = kpis.momPct >= 0 ? '+' : '';

  return (
    <Document title={`Reporte Ejecutivo ${data.mes}`} author="CIFRA ERP">
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.tenantLogoUrl && (
              <View style={styles.logoBox}>
                <Image src={data.tenantLogoUrl} style={styles.logo} />
              </View>
            )}
            <Text style={styles.tenantName}>{data.tenantNombre}</Text>
            <Text style={styles.tenantRfc}>RFC: {data.tenantRfc}</Text>
            <Text style={styles.reportTitle}>Reporte Ejecutivo</Text>
            <Text style={styles.reportMes}>{data.mes}</Text>
          </View>
          <View>
            <Text style={styles.tdGray}>Generado el</Text>
            <Text style={[styles.tdText, { fontFamily: 'Helvetica-Bold' }]}>
              {fmtDate(data.generadoEn)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── KPIs ── */}
        <Text style={styles.sectionTitle}>Indicadores Clave del Mes</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: C.primary }]}>
            <Text style={styles.kpiLabel}>Facturación Mes</Text>
            <Text style={styles.kpiValue}>{fmt(kpis.facturadoMes)}</Text>
            <Text style={[styles.kpiSub, kpis.momPct >= 0 ? styles.kpiPos : styles.kpiNeg]}>
              {momSign}{Math.abs(kpis.momPct).toFixed(1)}% vs mes anterior
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: C.emerald }]}>
            <Text style={styles.kpiLabel}>Ventas POS Mes</Text>
            <Text style={styles.kpiValue}>{fmt(kpis.posVentasMes)}</Text>
            <Text style={styles.kpiSub}>
              Total: {fmt(kpis.facturadoMes + kpis.posVentasMes)}
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: C.purple }]}>
            <Text style={styles.kpiLabel}>Empleados Activos</Text>
            <Text style={styles.kpiValue}>{kpis.empleadosActivos}</Text>
            <Text style={styles.kpiSub}>{kpis.dealsGanados} deals ganados</Text>
          </View>
        </View>

        {/* ── INGRESOS VS EGRESOS (tabla) ── */}
        <Text style={styles.sectionTitle}>Ingresos vs Egresos — Últimos {ingresosMeses.length} Meses</Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.thText, { flex: 1.5 }]}>Mes</Text>
            <Text style={[styles.thText, { flex: 2, textAlign: 'right' }]}>Ingresos</Text>
            <Text style={[styles.thText, { flex: 2, textAlign: 'right' }]}>Egresos</Text>
            <Text style={[styles.thText, { flex: 2, textAlign: 'right' }]}>Flujo Neto</Text>
          </View>
          {ingresosMeses.map((row, i) => {
            const neto = row.ingresos - row.egresos;
            return (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tdText, { flex: 1.5 }]}>{row.mes}</Text>
                <Text style={[styles.tdMono, { flex: 2, textAlign: 'right', color: C.primary }]}>
                  {fmt(row.ingresos)}
                </Text>
                <Text style={[styles.tdMono, { flex: 2, textAlign: 'right', color: C.red }]}>
                  {fmt(row.egresos)}
                </Text>
                <Text style={[styles.tdMono, { flex: 2, textAlign: 'right', color: neto >= 0 ? C.emerald : C.red }]}>
                  {fmt(neto)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── FISCAL ── */}
        <Text style={styles.sectionTitle}>Obligaciones Fiscales del Mes</Text>
        <View style={styles.fiscalGrid}>
          <View style={[styles.fiscalCard, { borderLeftWidth: 3, borderLeftColor: C.amber }]}>
            <Text style={styles.fiscalLabel}>ISR Nómina</Text>
            <Text style={styles.fiscalValue}>{fmt(fiscal.isr)}</Text>
          </View>
          <View style={[styles.fiscalCard, { borderLeftWidth: 3, borderLeftColor: C.purple }]}>
            <Text style={styles.fiscalLabel}>IMSS (cuota obrera)</Text>
            <Text style={styles.fiscalValue}>{fmt(fiscal.imss)}</Text>
          </View>
          <View style={[styles.fiscalCard, { borderLeftWidth: 3, borderLeftColor: C.primary }]}>
            <Text style={styles.fiscalLabel}>IVA Trasladado</Text>
            <Text style={styles.fiscalValue}>{fmt(fiscal.ivaTrasl)}</Text>
          </View>
          <View style={[styles.fiscalCard, { borderLeftWidth: 3, borderLeftColor: C.emerald }]}>
            <Text style={styles.fiscalLabel}>IVA a Pagar (neto)</Text>
            <Text style={styles.fiscalValue}>{fmt(fiscal.ivaNeto)}</Text>
          </View>
        </View>

        {/* ── TOP PRODUCTOS ── */}
        {topProductos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Productos por Ventas</Text>
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={[styles.thText, { flex: 0.3 }]}>#</Text>
                <Text style={[styles.thText, { flex: 3 }]}>Producto</Text>
                <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>Unidades</Text>
                <Text style={[styles.thText, { flex: 2, textAlign: 'right' }]}>Ingresos</Text>
              </View>
              {topProductos.map((p, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tdGray, { flex: 0.3 }]}>{i + 1}</Text>
                  <View style={{ flex: 3 }}>
                    <Text style={styles.tdText}>{p.name}</Text>
                    {p.sku && <Text style={styles.tdGray}>{p.sku}</Text>}
                  </View>
                  <Text style={[styles.tdMono, { flex: 1.5, textAlign: 'right' }]}>
                    {p.unitsSold.toLocaleString('es-MX')}
                  </Text>
                  <Text style={[styles.tdMono, { flex: 2, textAlign: 'right', color: C.emerald }]}>
                    {fmt(p.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── FOOTER ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>CIFRA ERP — Reporte Ejecutivo {data.mes}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  );
}
