/**
 * CIFRA — PDF Representación Impresa de CFDI 4.0
 * ================================================
 * Genera el PDF oficial conforme al Anexo 20 SAT.
 * Uso: renderToBuffer(<CfdiDocument invoice={...} />)
 */

import React from 'react';
import {
  Document, Page, Text, View, StyleSheet,
  Image, Font,
} from '@react-pdf/renderer';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface CfdiItem {
  claveProdServ: string;
  descripcion: string;
  cantidad: number;
  claveUnidad: string;
  unidad?: string | null;
  valorUnitario: number;
  importe: number;
  descuento?: number;
  trasladoTasaOCuota?: number | null;
  trasladoImporte?: number | null;
  retencionImporte?: number | null;
}

export interface CfdiData {
  // Identificadores
  uuid?: string | null;
  serie?: string | null;
  folio: number;
  fechaEmision: Date | string;
  tipoComprobante: string;
  formaPago: string;
  metodoPago: string;
  moneda: string;
  lugarExpedicion: string;
  condicionesDePago?: string | null;

  // Emisor
  emisorRfc: string;
  emisorNombre: string;
  emisorRegimenFiscal: string;

  // Receptor
  receptorRfc: string;
  receptorNombre: string;
  receptorDomicilioFiscal: string;
  receptorRegimenFiscal: string;
  receptorUsoCfdi: string;

  // Conceptos
  items: CfdiItem[];

  // Totales
  subtotal: number;
  descuento?: number;
  totalImpuestosTrasladados?: number;
  totalImpuestosRetenidos?: number;
  total: number;

  // Sellos (post-timbrado)
  noCertificadoSat?: string | null;
  selloSat?: string | null;
  selloCfd?: string | null;
  cadenaOriginal?: string | null;
  qrUrl?: string | null;   // URL para el QR de verificación SAT
  qrDataUrl?: string | null; // base64 del QR ya generado

  // Branding del tenant
  tenantLogoUrl?: string | null;
}

// ─── Colores y estilos ───────────────────────────────────────────────────────

const C = {
  emerald: '#10b981',
  dark: '#111827',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  border: '#e5e7eb',
  white: '#ffffff',
  red: '#ef4444',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: C.dark,
    backgroundColor: C.white,
    paddingHorizontal: 32,
    paddingVertical: 28,
  },
  // ── Header ────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.emerald,
  },
  logo: { width: 90, height: 30, objectFit: 'contain' },
  headerRight: { alignItems: 'flex-end' },
  cfdiTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.emerald, marginBottom: 3 },
  cfdiSubtitle: { fontSize: 9, color: C.gray, marginBottom: 2 },
  folioText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.dark },

  // ── Sección dos columnas ──────────────────
  row2: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  col: { flex: 1 },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    backgroundColor: C.emerald,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: { fontSize: 7, color: C.gray, marginBottom: 1 },
  value: { fontSize: 8, color: C.dark, marginBottom: 4 },
  valueBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 4 },

  // ── Tabla conceptos ───────────────────────
  table: { marginTop: 12, marginBottom: 12 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.dark,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRowAlt: { backgroundColor: C.lightGray },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white },
  tdText: { fontSize: 7.5, color: C.dark },
  tdTextRight: { fontSize: 7.5, color: C.dark, textAlign: 'right' },
  // Column widths
  colClave:    { width: '10%' },
  colDesc:     { width: '38%' },
  colCantidad: { width: '8%', textAlign: 'right' },
  colUnidad:   { width: '8%' },
  colPrecio:   { width: '12%', textAlign: 'right' },
  colImporte:  { width: '12%', textAlign: 'right' },
  colIva:      { width: '12%', textAlign: 'right' },

  // ── Totales ───────────────────────────────
  totalesRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
  totalesLabel: { width: 110, fontSize: 8, color: C.gray, textAlign: 'right', paddingRight: 8 },
  totalesValue: { width: 80, fontSize: 8, color: C.dark, textAlign: 'right' },
  totalesLabelBold: { width: 110, fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'right', paddingRight: 8 },
  totalesValueBold: {
    width: 80, fontSize: 9, fontFamily: 'Helvetica-Bold',
    color: C.emerald, textAlign: 'right',
  },
  totalBox: {
    flexDirection: 'row', justifyContent: 'flex-end',
    marginTop: 6, paddingTop: 6, borderTopWidth: 1.5, borderTopColor: C.emerald,
  },

  // ── Sello / QR ────────────────────────────
  selloSection: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    flexDirection: 'row',
    gap: 12,
  },
  qrImage: { width: 64, height: 64 },
  selloText: { fontSize: 5.5, color: C.gray, flex: 1, lineHeight: 1.4 },
  selloLabel: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 2 },

  // ── Footer ────────────────────────────────
  footer: {
    marginTop: 10, paddingTop: 8,
    borderTopWidth: 0.5, borderTopColor: C.border,
    alignItems: 'center',
  },
  footerText: { fontSize: 6, color: C.gray, textAlign: 'center', lineHeight: 1.5 },
  badge: {
    backgroundColor: C.emerald,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 3, marginBottom: 4,
  },
  badgeText: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.white },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: '2-digit', timeZone: 'America/Mexico_City',
  });

const tipoLabel: Record<string, string> = {
  I: 'Comprobante de Ingreso', E: 'Comprobante de Egreso',
  T: 'Traslado', P: 'Recibo de Pago', N: 'Nómina',
};

const metodoPagoLabel: Record<string, string> = {
  PUE: 'PUE — Pago en una sola exhibición',
  PPD: 'PPD — Pago en parcialidades o diferido',
};

// ─── Componente ──────────────────────────────────────────────────────────────

export function CfdiDocument({ invoice: inv }: { invoice: CfdiData }) {
  const folio = `${inv.serie ?? 'A'}${inv.folio}`;
  const isStamped = !!inv.uuid;

  return (
    <Document
      title={`CFDI ${folio} — ${inv.receptorNombre}`}
      author="CIFRA"
      creator="CIFRA ERP"
    >
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ───────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            {inv.tenantLogoUrl ? (
              <Image src={inv.tenantLogoUrl} style={styles.logo} />
            ) : (
              <Image
                src="https://cifra-mx.vercel.app/logo-dark.png"
                style={styles.logo}
              />
            )}
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 4 }}>
              {inv.emisorNombre}
            </Text>
            <Text style={{ fontSize: 7, color: C.gray }}>RFC: {inv.emisorRfc}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.cfdiTitle}>CFDI 4.0</Text>
            <Text style={styles.cfdiSubtitle}>{tipoLabel[inv.tipoComprobante] ?? inv.tipoComprobante}</Text>
            <Text style={styles.folioText}>Folio: {folio}</Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 3 }}>{fmtDate(inv.fechaEmision)}</Text>
            {!isStamped && (
              <View style={{ backgroundColor: C.red, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, borderRadius: 3 }}>
                <Text style={{ fontSize: 7, color: C.white, fontFamily: 'Helvetica-Bold' }}>BORRADOR — SIN TIMBRAR</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── EMISOR / RECEPTOR ────────────────────────────────── */}
        <View style={styles.row2}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Emisor</Text>
            <Text style={styles.label}>Nombre / Razón social</Text>
            <Text style={styles.valueBold}>{inv.emisorNombre}</Text>
            <Text style={styles.label}>RFC</Text>
            <Text style={styles.value}>{inv.emisorRfc}</Text>
            <Text style={styles.label}>Régimen fiscal</Text>
            <Text style={styles.value}>{inv.emisorRegimenFiscal}</Text>
            <Text style={styles.label}>Lugar de expedición</Text>
            <Text style={styles.value}>C.P. {inv.lugarExpedicion}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Receptor</Text>
            <Text style={styles.label}>Nombre / Razón social</Text>
            <Text style={styles.valueBold}>{inv.receptorNombre}</Text>
            <Text style={styles.label}>RFC</Text>
            <Text style={styles.value}>{inv.receptorRfc}</Text>
            <Text style={styles.label}>Régimen fiscal</Text>
            <Text style={styles.value}>{inv.receptorRegimenFiscal}</Text>
            <Text style={styles.label}>Domicilio fiscal</Text>
            <Text style={styles.value}>C.P. {inv.receptorDomicilioFiscal}</Text>
            <Text style={styles.label}>Uso del CFDI</Text>
            <Text style={styles.value}>{inv.receptorUsoCfdi}</Text>
          </View>
        </View>

        {/* ── INFO DEL COMPROBANTE ─────────────────────────────── */}
        <View style={[styles.row2, { backgroundColor: C.lightGray, padding: 8, borderRadius: 4 }]}>
          {[
            ['Forma de pago', inv.formaPago],
            ['Método de pago', metodoPagoLabel[inv.metodoPago] ?? inv.metodoPago],
            ['Moneda', inv.moneda],
            ...(inv.condicionesDePago ? [['Condiciones', inv.condicionesDePago]] : []),
          ].map(([label, value]) => (
            <View key={label} style={{ flex: 1 }}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.valueBold}>{value}</Text>
            </View>
          ))}
        </View>

        {/* ── TABLA DE CONCEPTOS ───────────────────────────────── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colClave]}>Clave SAT</Text>
            <Text style={[styles.thText, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.thText, styles.colCantidad, { textAlign: 'right' }]}>Cant.</Text>
            <Text style={[styles.thText, styles.colUnidad]}>Unidad</Text>
            <Text style={[styles.thText, styles.colPrecio, { textAlign: 'right' }]}>P. Unit.</Text>
            <Text style={[styles.thText, styles.colImporte, { textAlign: 'right' }]}>Importe</Text>
            <Text style={[styles.thText, styles.colIva, { textAlign: 'right' }]}>IVA</Text>
          </View>

          {inv.items.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tdText, styles.colClave]}>{item.claveProdServ}</Text>
              <Text style={[styles.tdText, styles.colDesc]}>{item.descripcion}</Text>
              <Text style={[styles.tdTextRight, styles.colCantidad]}>
                {Number(item.cantidad).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.tdText, styles.colUnidad]}>{item.unidad ?? item.claveUnidad}</Text>
              <Text style={[styles.tdTextRight, styles.colPrecio]}>${fmt(Number(item.valorUnitario))}</Text>
              <Text style={[styles.tdTextRight, styles.colImporte]}>${fmt(Number(item.importe))}</Text>
              <Text style={[styles.tdTextRight, styles.colIva]}>
                {item.trasladoImporte != null
                  ? `$${fmt(Number(item.trasladoImporte))}`
                  : '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* ── TOTALES ──────────────────────────────────────────── */}
        <View>
          <View style={styles.totalesRow}>
            <Text style={styles.totalesLabel}>Subtotal</Text>
            <Text style={styles.totalesValue}>${fmt(inv.subtotal)}</Text>
          </View>
          {(inv.descuento ?? 0) > 0 && (
            <View style={styles.totalesRow}>
              <Text style={styles.totalesLabel}>Descuento</Text>
              <Text style={styles.totalesValue}>-${fmt(inv.descuento!)}</Text>
            </View>
          )}
          {(inv.totalImpuestosTrasladados ?? 0) > 0 && (
            <View style={styles.totalesRow}>
              <Text style={styles.totalesLabel}>IVA trasladado</Text>
              <Text style={styles.totalesValue}>${fmt(inv.totalImpuestosTrasladados!)}</Text>
            </View>
          )}
          {(inv.totalImpuestosRetenidos ?? 0) > 0 && (
            <View style={styles.totalesRow}>
              <Text style={styles.totalesLabel}>Impuestos retenidos</Text>
              <Text style={styles.totalesValue}>-${fmt(inv.totalImpuestosRetenidos!)}</Text>
            </View>
          )}
          <View style={styles.totalBox}>
            <Text style={styles.totalesLabelBold}>TOTAL</Text>
            <Text style={styles.totalesValueBold}>${fmt(inv.total)} {inv.moneda}</Text>
          </View>
        </View>

        {/* ── SELLO / QR ───────────────────────────────────────── */}
        {isStamped && (
          <View style={styles.selloSection}>
            {inv.qrDataUrl && (
              <Image src={inv.qrDataUrl} style={styles.qrImage} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.selloLabel}>Folio fiscal (UUID)</Text>
              <Text style={styles.selloText}>{inv.uuid}</Text>
              {inv.noCertificadoSat && (
                <>
                  <Text style={[styles.selloLabel, { marginTop: 4 }]}>No. certificado SAT</Text>
                  <Text style={styles.selloText}>{inv.noCertificadoSat}</Text>
                </>
              )}
              {inv.selloSat && (
                <>
                  <Text style={[styles.selloLabel, { marginTop: 4 }]}>Sello SAT</Text>
                  <Text style={styles.selloText}>{inv.selloSat?.slice(0, 120)}...</Text>
                </>
              )}
              {inv.cadenaOriginal && (
                <>
                  <Text style={[styles.selloLabel, { marginTop: 4 }]}>Cadena original del complemento de certificación</Text>
                  <Text style={styles.selloText}>{inv.cadenaOriginal?.slice(0, 120)}...</Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Generado por CIFRA ERP · cifra-mx.vercel.app</Text>
          </View>
          <Text style={styles.footerText}>
            Este documento es una representación impresa de un Comprobante Fiscal Digital por Internet (CFDI).{'\n'}
            Versión 4.0 conforme al Anexo 20 del SAT. Verifique la autenticidad en: verificacfdi.facturaelectronica.sat.gob.mx
          </Text>
        </View>

      </Page>
    </Document>
  );
}
