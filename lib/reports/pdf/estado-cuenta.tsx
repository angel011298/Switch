/**
 * CIFRA — PDF Estado de Cuenta / Cobranza
 * =========================================
 * Muestra facturas emitidas a un cliente: pagadas, pendientes y vencidas.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type EstadoCuentaRow = {
  folio: string;
  fecha: Date | string;
  concepto: string;
  importe: number;
  status: 'PAGADA' | 'PENDIENTE' | 'VENCIDA' | 'CANCELADA';
  vencimiento?: Date | string | null;
};

export interface EstadoCuentaData {
  // Emisor (tenant)
  tenantNombre: string;
  tenantRfc: string;
  tenantLogoUrl?: string | null;

  // Cliente
  clienteNombre: string;
  clienteRfc: string;
  clienteEmail?: string | null;

  // Periodo del reporte
  fechaDesde: Date | string;
  fechaHasta: Date | string;
  generadoEn: Date | string;

  // Facturas
  filas: EstadoCuentaRow[];

  // Totales
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  moneda?: string;
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const C = {
  emerald: '#10b981', dark: '#111827', gray: '#6b7280',
  lightGray: '#f9fafb', border: '#e5e7eb', white: '#ffffff',
  red: '#ef4444', yellow: '#f59e0b', green: '#10b981',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 8, color: C.dark,
    backgroundColor: C.white, paddingHorizontal: 32, paddingVertical: 28,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16, paddingBottom: 12,
    borderBottomWidth: 2, borderBottomColor: C.emerald,
  },
  logo: { width: 80, height: 26, objectFit: 'contain' },
  titleBox: { alignItems: 'flex-end' },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.dark },
  subtitle: { fontSize: 8, color: C.gray, marginTop: 2 },

  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  infoCol: { flex: 1, backgroundColor: C.lightGray, padding: 8, borderRadius: 4 },
  infoTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white,
    backgroundColor: C.emerald, paddingHorizontal: 6, paddingVertical: 2,
    marginBottom: 6, textTransform: 'uppercase',
  },
  label: { fontSize: 7, color: C.gray, marginBottom: 1 },
  value: { fontSize: 8, color: C.dark, marginBottom: 4 },
  valueBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 4 },

  tableHeader: {
    flexDirection: 'row', backgroundColor: C.dark,
    paddingVertical: 5, paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border,
    paddingVertical: 5, paddingHorizontal: 4,
  },
  tableRowAlt: { backgroundColor: C.lightGray },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white },
  tdText: { fontSize: 7.5, color: C.dark },
  tdRight: { fontSize: 7.5, color: C.dark, textAlign: 'right' },

  colFolio: { width: '12%' },
  colFecha: { width: '13%' },
  colConcepto: { width: '35%' },
  colImporte: { width: '14%', textAlign: 'right' },
  colVence: { width: '13%' },
  colStatus: { width: '13%', textAlign: 'center' },

  statusBadge: {
    paddingHorizontal: 4, paddingVertical: 1.5,
    borderRadius: 3, alignSelf: 'center',
  },
  statusText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.white },

  summaryBox: {
    flexDirection: 'row', marginTop: 16, gap: 8,
  },
  summaryCard: {
    flex: 1, padding: 10, borderRadius: 6,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  summaryLabel: { fontSize: 7, color: C.gray, marginBottom: 3 },
  summaryValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },

  footer: {
    marginTop: 16, paddingTop: 8,
    borderTopWidth: 0.5, borderTopColor: C.border,
    alignItems: 'center',
  },
  footerText: { fontSize: 6, color: C.gray, textAlign: 'center' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

const statusConfig = {
  PAGADA:    { bg: '#059669', label: 'Pagada' },
  PENDIENTE: { bg: '#d97706', label: 'Pendiente' },
  VENCIDA:   { bg: '#dc2626', label: 'Vencida' },
  CANCELADA: { bg: '#6b7280', label: 'Cancelada' },
};

// ─── Componente ──────────────────────────────────────────────────────────────

export function EstadoCuentaDocument({ data }: { data: EstadoCuentaData }) {
  const moneda = data.moneda ?? 'MXN';

  return (
    <Document title={`Estado de Cuenta — ${data.clienteNombre}`} author="CIFRA" creator="CIFRA ERP">
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            {data.tenantLogoUrl ? (
              <Image src={data.tenantLogoUrl} style={styles.logo} />
            ) : (
              <Image src="https://cifra-mx.vercel.app/logo-dark.png" style={styles.logo} />
            )}
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 4 }}>{data.tenantNombre}</Text>
            <Text style={{ fontSize: 7, color: C.gray }}>RFC: {data.tenantRfc}</Text>
          </View>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Estado de Cuenta</Text>
            <Text style={styles.subtitle}>
              Periodo: {fmtDate(data.fechaDesde)} — {fmtDate(data.fechaHasta)}
            </Text>
            <Text style={[styles.subtitle, { marginTop: 2 }]}>
              Generado: {fmtDate(data.generadoEn)}
            </Text>
          </View>
        </View>

        {/* CLIENTE INFO */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoTitle}>Cliente</Text>
            <Text style={styles.label}>Nombre / Razón social</Text>
            <Text style={styles.valueBold}>{data.clienteNombre}</Text>
            <Text style={styles.label}>RFC</Text>
            <Text style={styles.value}>{data.clienteRfc}</Text>
            {data.clienteEmail && (
              <>
                <Text style={styles.label}>Correo electrónico</Text>
                <Text style={styles.value}>{data.clienteEmail}</Text>
              </>
            )}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoTitle}>Resumen</Text>
            <Text style={styles.label}>Total facturado</Text>
            <Text style={styles.valueBold}>{fmt(data.totalFacturado)} {moneda}</Text>
            <Text style={styles.label}>Total cobrado</Text>
            <Text style={[styles.valueBold, { color: C.emerald }]}>{fmt(data.totalCobrado)} {moneda}</Text>
            <Text style={styles.label}>Saldo pendiente</Text>
            <Text style={[styles.valueBold, { color: data.totalPendiente > 0 ? C.red : C.dark }]}>
              {fmt(data.totalPendiente)} {moneda}
            </Text>
          </View>
        </View>

        {/* TABLA */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colFolio]}>Folio</Text>
          <Text style={[styles.thText, styles.colFecha]}>Fecha</Text>
          <Text style={[styles.thText, styles.colConcepto]}>Concepto</Text>
          <Text style={[styles.thText, styles.colImporte, { textAlign: 'right' }]}>Importe</Text>
          <Text style={[styles.thText, styles.colVence]}>Vencimiento</Text>
          <Text style={[styles.thText, styles.colStatus, { textAlign: 'center' }]}>Estatus</Text>
        </View>

        {data.filas.map((row, idx) => {
          const sc = statusConfig[row.status] ?? { bg: C.gray, label: row.status };
          return (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tdText, styles.colFolio]}>{row.folio}</Text>
              <Text style={[styles.tdText, styles.colFecha]}>{fmtDate(row.fecha)}</Text>
              <Text style={[styles.tdText, styles.colConcepto]}>{row.concepto}</Text>
              <Text style={[styles.tdRight, styles.colImporte]}>{fmt(row.importe)}</Text>
              <Text style={[styles.tdText, styles.colVence]}>
                {row.vencimiento ? fmtDate(row.vencimiento) : '—'}
              </Text>
              <View style={[styles.colStatus, { alignItems: 'center' }]}>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={styles.statusText}>{sc.label}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* SUMMARY CARDS */}
        <View style={styles.summaryBox}>
          <View style={[styles.summaryCard, { borderColor: C.emerald }]}>
            <Text style={styles.summaryLabel}>Total Facturado</Text>
            <Text style={[styles.summaryValue, { color: C.dark }]}>{fmt(data.totalFacturado)}</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: '#059669' }]}>
            <Text style={styles.summaryLabel}>Total Cobrado</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>{fmt(data.totalCobrado)}</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: data.totalPendiente > 0 ? C.red : C.emerald }]}>
            <Text style={styles.summaryLabel}>Saldo Pendiente</Text>
            <Text style={[styles.summaryValue, { color: data.totalPendiente > 0 ? C.red : C.dark }]}>
              {fmt(data.totalPendiente)}
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generado por CIFRA ERP · cifra-mx.vercel.app · {fmtDate(data.generadoEn)}{'\n'}
            Este documento es informativo. Los importes están expresados en {moneda}.
          </Text>
        </View>

      </Page>
    </Document>
  );
}
