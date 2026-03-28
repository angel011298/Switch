'use client';

/**
 * CIFRA — Auto-Factura Pública
 * ==================================
 * Vista pública donde el cliente final ingresa su código de ticket
 * y sus datos fiscales para generar su CFDI automáticamente.
 *
 * URL: /factura-tu-ticket/[tenant_id]
 *
 * NO requiere autenticación — es una página pública.
 * El tenant_id identifica al negocio que emitió el ticket.
 */

import { useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import { lookupTicket, generateSelfInvoice } from './actions';

export default function SelfInvoicePage() {
  const params = useParams();
  const tenantId = params.tenant_id as string;

  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<'ticket' | 'fiscal' | 'done'>('ticket');

  // Step 1: Buscar ticket
  const [ticketCode, setTicketCode] = useState('');
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<any>(null);

  // Step 2: Datos fiscales
  const [rfc, setRfc] = useState('');
  const [nombre, setNombre] = useState('');
  const [cp, setCp] = useState('');
  const [regimenFiscal, setRegimenFiscal] = useState('');
  const [usoCfdi, setUsoCfdi] = useState('G03');
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Step 3: Resultado
  const [invoiceResult, setInvoiceResult] = useState<any>(null);

  function handleLookup() {
    if (!ticketCode.trim()) return;
    setTicketError(null);

    startTransition(async () => {
      const result = await lookupTicket(tenantId, ticketCode.trim().toUpperCase());
      if (result.success) {
        setTicketData(result.order);
        setStep('fiscal');
      } else {
        setTicketError(result.error ?? 'Ticket no encontrado');
      }
    });
  }

  function handleGenerateInvoice() {
    if (!rfc || !nombre || !cp || !regimenFiscal) return;
    setInvoiceError(null);

    startTransition(async () => {
      const result = await generateSelfInvoice({
        tenantId,
        ticketCode: ticketData.ticketCode,
        orderId: ticketData.id,
        rfc: rfc.toUpperCase(),
        nombre,
        domicilioFiscal: cp,
        regimenFiscal,
        usoCfdi,
      });

      if (result.success) {
        setInvoiceResult(result);
        setStep('done');
      } else {
        setInvoiceError(result.error ?? 'Error al generar factura');
      }
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Factura tu Ticket</h1>
          <p className="text-zinc-400 text-sm mt-1">Genera tu factura electronica CFDI 4.0</p>
        </div>

        {/* Step 1: Código de ticket */}
        {step === 'ticket' && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Codigo del Ticket
              </label>
              <input
                type="text"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                placeholder="SW-XXXXXX"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center text-xl font-mono tracking-widest placeholder:text-zinc-600 focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase"
                maxLength={9}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
              <p className="text-xs text-zinc-500 mt-2 text-center">
                Ingresa el codigo impreso en tu ticket de compra
              </p>
            </div>

            {ticketError && (
              <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
                {ticketError}
              </div>
            )}

            <button
              onClick={handleLookup}
              disabled={isPending || !ticketCode.trim()}
              className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-colors"
            >
              {isPending ? 'Buscando...' : 'Buscar Ticket'}
            </button>
          </div>
        )}

        {/* Step 2: Datos fiscales */}
        {step === 'fiscal' && ticketData && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            {/* Resumen del ticket */}
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center border border-zinc-700/50">
              <p className="text-xs text-zinc-500">Ticket</p>
              <p className="text-white font-mono text-lg">{ticketData.ticketCode}</p>
              <p className="text-pink-400 font-bold text-xl mt-1">${Number(ticketData.total).toFixed(2)}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {new Date(ticketData.closedAt).toLocaleString('es-MX')}
              </p>
            </div>

            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Datos Fiscales del Receptor
            </h3>

            <div className="space-y-3">
              <input
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                placeholder="RFC (ej. XAXX010101000)"
                maxLength={13}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 uppercase"
              />
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre o Razon Social"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  placeholder="C.P. (5 digitos)"
                  maxLength={5}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500"
                />
                <input
                  value={regimenFiscal}
                  onChange={(e) => setRegimenFiscal(e.target.value)}
                  placeholder="Regimen (ej. 601)"
                  maxLength={3}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <select
                value={usoCfdi}
                onChange={(e) => setUsoCfdi(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500"
              >
                <option value="G01">G01 - Adquisicion de mercancias</option>
                <option value="G03">G03 - Gastos en general</option>
                <option value="S01">S01 - Sin efectos fiscales</option>
              </select>
            </div>

            {invoiceError && (
              <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {invoiceError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('ticket')}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
              >
                Atras
              </button>
              <button
                onClick={handleGenerateInvoice}
                disabled={isPending || !rfc || !nombre || !cp || !regimenFiscal}
                className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-colors"
              >
                {isPending ? 'Generando CFDI...' : 'Generar Factura'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Factura generada */}
        {step === 'done' && invoiceResult && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Factura Generada</h2>
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
              <p className="text-xs text-zinc-500">UUID</p>
              <p className="text-pink-400 font-mono text-sm break-all">{invoiceResult.uuid ?? 'Pendiente'}</p>
              <p className="text-xs text-zinc-500 mt-2">Folio</p>
              <p className="text-white font-mono">{invoiceResult.serie ?? 'POS'}-{invoiceResult.folio}</p>
            </div>
            <p className="text-zinc-400 text-sm">
              Tu factura CFDI 4.0 ha sido generada exitosamente.
            </p>
            <button
              onClick={() => { setStep('ticket'); setTicketCode(''); setTicketData(null); setInvoiceResult(null); setRfc(''); setNombre(''); setCp(''); setRegimenFiscal(''); }}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              Facturar Otro Ticket
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          Powered by CIFRA — Facturacion CFDI 4.0
        </p>
      </div>
    </div>
  );
}
