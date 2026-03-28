/**
 * CIFRA — PDF Recibo de Nómina
 * =============================
 * Recibo individual por empleado con percepciones, deducciones y neto a pagar.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface NominaData {
  // Empresa (tenant)
  tenantNombre: string;
  tenantRfc: string;
  tenantLogoUrl?: string | null;

  // Periodo
  periodLabel: string;   // Ej: "Quincena 1 — Marzo 2026"
  startDate: Date | string;
  endDate: Date | string;
  fechaPago?: Date | string | null;

  // Empleado
  empleadoNombre: string;
  empleadoRfc?: string | null;
  empleadoCurp: string;
  puesto: string;
  departamento?: string | null;
  imssNumber?: string | null;
  bankAccount?: string | null;
  salaryType: string;   // MENSUAL | QUINCENAL

  // Percepciones
  sueldoBruto: number;
  otrasPercepciones?: { concepto: string; importe: number }[];

  // Deducciones
  isr: number;
  imss: number;
  absenceDeduct?: number;
  otrasDeduciones?: { concepto: string; importe: number }[];

  // Totales
  totalPercepciones: number;
  totalDeducciones: number;
  neto: number;
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const C = {
  emerald: '#10b981', dark: '#111827', gray: '#6b7280',
  lightGray: '#f9fafb', border: '#e5e7eb', white: '#ffffff',
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
  headerRight: { alignItems: 'flex-end' },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.dark },
  subtitle: { fontSize: 8, color: C.gray, marginTop: 2 },

  sectionTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white,
    backgroundColor: C.emerald, paddingHorizontal: 6, paddingVertical: 3,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  label: { fontSize: 7, color: C.gray, marginBottom: 1 },
  value: { fontSize: 8, color: C.dark, marginBottom: 4 },
  valueBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 4 },

  // Empleado info
  empleadoBox: {
    backgroundColor: C.lightGray, padding: 10, borderRadius: 4,
    marginBottom: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 0,
  },
  empleadoCol: { width: '33%', paddingRight: 8 },

  // Tabla percepciones / deducciones
  tablaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderBottomWidth: 0.5, borderBottomColor: C.border,
    paddingVertical: 4,
  },
  tablaRowAlt: { backgroundColor: C.lightGray },
  tablaConcepto: { fontSize: 8, color: C.dark, flex: 1 },
  tablaImporte: { fontSize: 8, color: C.dark, textAlign: 'right', width: 80 },

  // Totales
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  totalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark, width: 130, textAlign: 'right', paddingRight: 8 },
  totalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.emerald, width: 90, textAlign: 'right' },

  // Neto grande
  netoBox: {
    marginTop: 16, padding: 14, borderRadius: 8,
    backgroundColor: C.dark, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  netoLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.emerald },
  netoValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.white },

  // Firma
  firmaBox: {
    marginTop: 20, flexDirection: 'row', justifyContent: 'space-around',
  },
  firmaLinea: {
    width: 160, borderTopWidth: 1, borderTopColor: C.dark,
    paddingTop: 4, alignItems: 'center',
  },
  firmaLabel: { fontSize: 7, color: C.gray },

  footer: {
    marginTop: 14, paddingTop: 8,
    borderTopWidth: 0.5, borderTopColor: C.border,
    alignItems: 'center',
  },
  footerText: { fontSize: 6, color: C.gray, textAlign: 'center' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

// ─── Componente ──────────────────────────────────────────────────────────────

export function NominaDocument({ data }: { data: NominaData }) {
  const percepciones: { concepto: string; importe: number }[] = [
    { concepto: `Sueldo ${data.salaryType.toLowerCase()}`, importe: data.sueldoBruto },
    ...(data.otrasPercepciones ?? []),
  ];

  const deducciones: { concepto: string; importe: number }[] = [
    { concepto: 'ISR', importe: data.isr },
    { concepto: 'Cuota obrera IMSS', importe: data.imss },
    ...(data.absenceDeduct && data.absenceDeduct > 0
      ? [{ concepto: 'Deducción por faltas', importe: data.absenceDeduct }]
      : []),
    ...(data.otrasDeduciones ?? []),
  ];

  return (
    <Document title={`Recibo de Nómina — ${data.empleadoNombre}`} author="CIFRA" creator="CIFRA ERP">
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
          <View style={styles.headerRight}>
            <Text style={styles.title}>Recibo de Nómina</Text>
            <Text style={styles.subtitle}>{data.periodLabel}</Text>
            <Text style={[styles.subtitle, { marginTop: 2 }]}>
              {fmtDate(data.startDate)} — {fmtDate(data.endDate)}
            </Text>
            {data.fechaPago && (
              <Text style={[styles.subtitle, { color: C.emerald, marginTop: 2 }]}>
                Fecha de pago: {fmtDate(data.fechaPago)}
              </Text>
            )}
          </View>
        </View>

        {/* DATOS DEL EMPLEADO */}
        <Text style={styles.sectionTitle}>Datos del Empleado</Text>
        <View style={styles.empleadoBox}>
          <View style={styles.empleadoCol}>
            <Text style={styles.label}>Nombre completo</Text>
            <Text style={styles.valueBold}>{data.empleadoNombre}</Text>
            <Text style={styles.label}>Puesto</Text>
            <Text style={styles.value}>{data.puesto}</Text>
          </View>
          <View style={styles.empleadoCol}>
            <Text style={styles.label}>CURP</Text>
            <Text style={styles.value}>{data.empleadoCurp}</Text>
            <Text style={styles.label}>RFC</Text>
            <Text style={styles.value}>{data.empleadoRfc ?? '—'}</Text>
          </View>
          <View style={styles.empleadoCol}>
            <Text style={styles.label}>Departamento</Text>
            <Text style={styles.value}>{data.departamento ?? '—'}</Text>
            <Text style={styles.label}>No. IMSS</Text>
            <Text style={styles.value}>{data.imssNumber ?? '—'}</Text>
            {data.bankAccount && (
              <>
                <Text style={styles.label}>CLABE / Cuenta</Text>
                <Text style={styles.value}>
                  {'*'.repeat(Math.max(0, data.bankAccount.length - 4)) + data.bankAccount.slice(-4)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* PERCEPCIONES Y DEDUCCIONES */}
        <View style={{ flexDirection: 'row', gap: 14 }}>

          {/* Percepciones */}
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Percepciones</Text>
            {percepciones.map((p, idx) => (
              <View key={idx} style={[styles.tablaRow, idx % 2 === 1 ? styles.tablaRowAlt : {}]}>
                <Text style={styles.tablaConcepto}>{p.concepto}</Text>
                <Text style={styles.tablaImporte}>{fmt(p.importe)}</Text>
              </View>
            ))}
            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={styles.totalLabel}>Total percepciones</Text>
              <Text style={styles.totalValue}>{fmt(data.totalPercepciones)}</Text>
            </View>
          </View>

          {/* Deducciones */}
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Deducciones</Text>
            {deducciones.map((d, idx) => (
              <View key={idx} style={[styles.tablaRow, idx % 2 === 1 ? styles.tablaRowAlt : {}]}>
                <Text style={styles.tablaConcepto}>{d.concepto}</Text>
                <Text style={[styles.tablaImporte, { color: '#dc2626' }]}>-{fmt(d.importe)}</Text>
              </View>
            ))}
            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={styles.totalLabel}>Total deducciones</Text>
              <Text style={[styles.totalValue, { color: '#dc2626' }]}>-{fmt(data.totalDeducciones)}</Text>
            </View>
          </View>
        </View>

        {/* NETO A PAGAR */}
        <View style={styles.netoBox}>
          <View>
            <Text style={styles.netoLabel}>NETO A PAGAR</Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>{data.periodLabel}</Text>
          </View>
          <Text style={styles.netoValue}>{fmt(data.neto)}</Text>
        </View>

        {/* FIRMAS */}
        <View style={styles.firmaBox}>
          <View style={styles.firmaLinea}>
            <Text style={styles.firmaLabel}>Firma del empleado</Text>
            <Text style={[styles.firmaLabel, { marginTop: 2 }]}>{data.empleadoNombre}</Text>
          </View>
          <View style={styles.firmaLinea}>
            <Text style={styles.firmaLabel}>Autorizado por</Text>
            <Text style={[styles.firmaLabel, { marginTop: 2 }]}>{data.tenantNombre}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generado por CIFRA ERP · cifra-mx.vercel.app{'\n'}
            Este recibo de nómina es un comprobante de pago conforme a la Ley Federal del Trabajo.
          </Text>
        </View>

      </Page>
    </Document>
  );
}
