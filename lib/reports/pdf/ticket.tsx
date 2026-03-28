/**
 * CIFRA — Ticket POS PDF
 * =======================
 * FASE 29: Representación impresa de una venta en el POS.
 * Usa @react-pdf/renderer (ya instalado en el proyecto).
 */

import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    width: 226, // 80mm thermal paper ≈ 226pt
  },
  center: { textAlign: 'center' },
  bold: { fontFamily: 'Helvetica-Bold' },
  logo: { width: 60, height: 60, objectFit: 'contain', alignSelf: 'center', marginBottom: 6 },

  header: { marginBottom: 10, alignItems: 'center' },
  companyName: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  rfc: { fontSize: 8, color: '#555555', textAlign: 'center', marginTop: 2 },
  address: { fontSize: 7, color: '#777777', textAlign: 'center', marginTop: 2 },

  divider: { borderBottomWidth: 0.5, borderBottomColor: '#CCCCCC', marginVertical: 6 },
  dashedDivider: { borderBottomWidth: 0.5, borderBottomColor: '#CCCCCC', borderBottomStyle: 'dashed', marginVertical: 6 },

  ticketInfo: { marginBottom: 8 },
  ticketCode: { fontSize: 16, fontFamily: 'Helvetica-Bold', textAlign: 'center', letterSpacing: 2, marginBottom: 2 },
  ticketDate: { fontSize: 7, color: '#555555', textAlign: 'center' },

  itemRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  itemName: { fontSize: 8, flex: 1 },
  itemQty: { fontSize: 8, width: 30, textAlign: 'right' },
  itemPrice: { fontSize: 8, width: 45, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  itemDetail: { fontSize: 7, color: '#777777', flex: 1, marginTop: 1 },

  totalsSection: { marginTop: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { fontSize: 8, color: '#555555' },
  totalValue: { fontSize: 8 },
  grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },

  paymentSection: { marginTop: 8 },
  paymentLabel: { fontSize: 8, color: '#555555' },
  paymentValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },

  footer: { marginTop: 12, alignItems: 'center' },
  footerText: { fontSize: 7, color: '#888888', textAlign: 'center', marginTop: 2 },
  thankYou: { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4 },
});

const PAY_METHOD: Record<string, string> = {
  '01': 'Efectivo',
  '03': 'Transferencia',
  '04': 'Tarjeta crédito/débito',
  '28': 'Tarjeta débito',
  '29': 'Tarjeta crédito',
  '99': 'Por definir',
};

export interface TicketItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface TicketData {
  ticketCode: string;
  date: Date | string;
  items: TicketItem[];
  subtotal: number;
  totalTax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  changeDue: number;
  tenantName: string;
  tenantRfc?: string | null;
  tenantAddress?: string | null;
  logoUrl?: string | null;
}

export function TicketDocument({ data }: { data: TicketData }) {
  const dateObj = typeof data.date === 'string' ? new Date(data.date) : data.date;
  const dateStr = dateObj.toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Document title={`Ticket ${data.ticketCode}`} author="CIFRA ERP">
      <Page size={{ width: 226, height: 'auto' as any }} style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          {data.logoUrl && (
            <Image src={data.logoUrl} style={styles.logo} />
          )}
          <Text style={styles.companyName}>{data.tenantName}</Text>
          {data.tenantRfc && <Text style={styles.rfc}>RFC: {data.tenantRfc}</Text>}
          {data.tenantAddress && <Text style={styles.address}>{data.tenantAddress}</Text>}
        </View>

        <View style={styles.divider} />

        {/* ── TICKET INFO ── */}
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketCode}>{data.ticketCode}</Text>
          <Text style={styles.ticketDate}>{dateStr}</Text>
        </View>

        <View style={styles.dashedDivider} />

        {/* ── ITEMS ── */}
        <View>
          {data.items.map((item, i) => (
            <View key={i} style={{ marginBottom: 5 }}>
              <View style={styles.itemRow}>
                <Text style={[styles.itemName, styles.bold]}>{item.productName}</Text>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemPrice}>${item.total.toFixed(2)}</Text>
              </View>
              <Text style={styles.itemDetail}>
                ${item.unitPrice.toFixed(2)} c/u + IVA {(item.taxRate * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.dashedDivider} />

        {/* ── TOTALES ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${data.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA</Text>
            <Text style={styles.totalValue}>${data.totalTax.toFixed(2)}</Text>
          </View>
          {data.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Descuento</Text>
              <Text style={[styles.totalValue, { color: '#16a34a' }]}>-${data.discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>${data.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── PAGO ── */}
        <View style={styles.paymentSection}>
          <View style={styles.totalRow}>
            <Text style={styles.paymentLabel}>Forma de pago</Text>
            <Text style={styles.paymentValue}>{PAY_METHOD[data.paymentMethod] ?? data.paymentMethod}</Text>
          </View>
          {data.paymentMethod === '01' && data.amountPaid > 0 && (
            <>
              <View style={styles.changeRow}>
                <Text style={styles.paymentLabel}>Recibido</Text>
                <Text style={styles.paymentValue}>${data.amountPaid.toFixed(2)}</Text>
              </View>
              <View style={styles.changeRow}>
                <Text style={styles.paymentLabel}>Cambio</Text>
                <Text style={styles.paymentValue}>${data.changeDue.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <Text style={styles.thankYou}>¡Gracias por su compra!</Text>
          <Text style={styles.footerText}>Este ticket no es un comprobante fiscal.</Text>
          <Text style={styles.footerText}>Solicite su factura electrónica CFDI.</Text>
          <Text style={[styles.footerText, { marginTop: 4 }]}>cifra-mx.vercel.app</Text>
        </View>

      </Page>
    </Document>
  );
}
