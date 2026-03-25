'use client';

import { useState, useRef, useTransition } from 'react';
import {
  CreditCard, Upload, CheckCircle2, Clock, XCircle,
  Copy, AlertTriangle, Banknote, FileText, Calendar,
} from 'lucide-react';
import { submitPaymentProof, type SubmitPaymentProofInput } from './actions';
import { SWITCH_BANK_ACCOUNTS, SWITCH_PLANS } from '@/lib/billing/constants';

interface Props {
  subStatus: string | null;
  validUntil: Date | null;
  pendingProof: {
    id: string;
    status: string;
    createdAt: Date;
    amount: number | string;
    rejectionNote?: string | null;
  } | null;
  tenantName: string;
  tenantRfc: string | null;
}

export default function SubscriptionClient({
  subStatus,
  validUntil,
  pendingProof,
  tenantName,
  tenantRfc,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copiedClabe, setCopiedClabe] = useState(false);

  // Form state
  const [amount, setAmount] = useState('499');
  const [transferRef, setTransferRef] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const plan = SWITCH_PLANS.standard;
  const bank = SWITCH_BANK_ACCOUNTS[0];
  const isExpired = validUntil && new Date(validUntil) < new Date();
  const isActive = subStatus === 'ACTIVE' && !isExpired;

  function copyClabe() {
    navigator.clipboard.writeText(bank.clabe);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_500_000) {
      setError('El archivo no debe exceder 2.5 MB');
      return;
    }
    setError('');
    setFile(f);
  }

  async function readFileAsBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Selecciona tu comprobante de pago'); return; }
    if (!amount || Number(amount) <= 0) { setError('Ingresa el monto transferido'); return; }

    startTransition(async () => {
      try {
        const fileBase64 = await readFileAsBase64(file);
        const input: SubmitPaymentProofInput = {
          amount: Number(amount),
          transferRef: transferRef || undefined,
          concept: `Switch OS - ${tenantName}`,
          paidAt,
          fileName: file.name,
          fileType: file.type,
          fileBase64,
        };
        const result = await submitPaymentProof(input);
        if (result.ok) {
          setSuccess(true);
          setError('');
        } else {
          setError(result.error ?? 'Error desconocido');
        }
      } catch {
        setError('Error al procesar el archivo. Intenta de nuevo.');
      }
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <header className="flex items-center gap-4 bg-neutral-950 text-white p-6 rounded-2xl">
        <div className="bg-emerald-500 p-3 rounded-xl">
          <CreditCard className="h-8 w-8 text-neutral-950" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Suscripción</h1>
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mt-1">
            Switch OS — {tenantName}
          </p>
        </div>
      </header>

      {/* Estado actual */}
      <div className={`rounded-2xl border-2 p-6 ${
        isActive
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
          : isExpired || subStatus === 'SUSPENDED'
          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
          : 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          {isActive ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          )}
          <span className="font-bold text-lg">
            {isActive
              ? '✅ Suscripción activa'
              : subStatus === 'SUSPENDED'
              ? '🚫 Cuenta suspendida'
              : subStatus === 'TRIAL'
              ? '🎁 Periodo de prueba'
              : '⚠️ Suscripción vencida'}
          </span>
        </div>
        {validUntil && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isExpired || subStatus === 'SUSPENDED'
              ? `Venció el ${new Date(validUntil).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`
              : `Vigente hasta el ${new Date(validUntil).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`
            }
          </p>
        )}
        {subStatus === 'TRIAL' && !validUntil && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Estás en periodo de prueba. Realiza tu primer pago para activar tu cuenta.
          </p>
        )}
      </div>

      {/* Comprobante ya enviado */}
      {pendingProof && !success && (
        <div className={`rounded-2xl p-6 border-2 ${
          pendingProof.status === 'PENDING'
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
            : pendingProof.status === 'REJECTED'
            ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
            : 'border-emerald-400 bg-emerald-50'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {pendingProof.status === 'PENDING' && <Clock className="h-5 w-5 text-blue-600" />}
            {pendingProof.status === 'REJECTED' && <XCircle className="h-5 w-5 text-red-600" />}
            <span className="font-bold">
              {pendingProof.status === 'PENDING' && '🕐 Comprobante en revisión'}
              {pendingProof.status === 'REJECTED' && '❌ Comprobante rechazado'}
            </span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {pendingProof.status === 'PENDING' &&
              `Enviado el ${new Date(pendingProof.createdAt).toLocaleDateString('es-MX')}. El equipo de Switch lo revisará en menos de 24 horas.`}
            {pendingProof.status === 'REJECTED' &&
              `Motivo: ${pendingProof.rejectionNote ?? 'Ver correo de notificación'}`}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">

        {/* Datos bancarios */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h2 className="font-black text-lg flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-500" />
            Datos para Transferencia SPEI
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Banco</p>
              <p className="font-bold">{bank.bank}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Beneficiario</p>
              <p className="font-bold">{bank.accountHolder}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">CLABE Interbancaria</p>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-base bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-lg flex-1">
                  {bank.clabe}
                </code>
                <button
                  onClick={copyClabe}
                  className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Copiar CLABE"
                >
                  {copiedClabe
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <Copy className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Concepto</p>
              <p className="font-mono font-semibold text-sm">
                SWITCH-{tenantRfc ?? tenantName.toUpperCase().replace(/\s+/g, '-').substring(0, 12)}
              </p>
            </div>
          </div>

          {/* Plan */}
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <p className="font-bold text-neutral-700 dark:text-neutral-300 mb-2">{plan.name}</p>
            <p className="text-2xl font-black text-emerald-600">
              ${plan.monthlyPrice.toLocaleString('es-MX')} MXN
              <span className="text-sm text-neutral-500 font-normal"> / mes</span>
            </p>
            <ul className="mt-3 space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Formulario de comprobante */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="font-black text-lg flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-emerald-500" />
            Subir Comprobante de Pago
          </h2>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <p className="font-bold text-lg">¡Comprobante enviado!</p>
              <p className="text-sm text-neutral-500 mt-2">
                El equipo de Switch revisará tu pago en menos de 24 horas.
                Recibirás un correo de confirmación cuando se apruebe.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Monto */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Monto transferido (MXN) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="499.00"
                  required
                />
              </div>

              {/* Clave de rastreo */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Clave de rastreo SPEI (opcional)
                </label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej. 2024012500001234"
                />
              </div>

              {/* Fecha de pago */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Fecha del pago *
                </label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Archivo */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Comprobante PDF / JPG / PNG * (máx. 2.5 MB)
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                      <p className="text-sm text-neutral-500">
                        Haz clic para seleccionar tu comprobante
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">PDF, JPG o PNG</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending || !!pendingProof}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Enviar comprobante
                  </>
                )}
              </button>
              {pendingProof?.status === 'PENDING' && (
                <p className="text-xs text-center text-neutral-500">
                  Ya tienes un comprobante en revisión. No puedes enviar otro hasta que sea procesado.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
