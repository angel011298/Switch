'use client';

import { useState, useTransition } from 'react';
import QRCode from 'qrcode';
import { Shield, ShieldCheck, ShieldOff, Smartphone, CheckCircle2, AlertTriangle } from 'lucide-react';
import { initiate2FASetup, confirm2FASetup, disable2FA } from './actions';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  initialEnabled: boolean;
  email: string;
}

type Step = 'idle' | 'setup-qr' | 'setup-verify' | 'disable-verify' | 'success';

export default function SecurityClient({ initialEnabled, email }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<Step>('idle');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  async function handleStartSetup() {
    setError('');
    startTransition(async () => {
      const result = await initiate2FASetup();
      setSecret(result.secret);
      // Generar QR en el cliente
      const dataUrl = await QRCode.toDataURL(result.otpAuthUrl, { width: 200, margin: 2 });
      setQrDataUrl(dataUrl);
      setStep('setup-qr');
    });
  }

  function handleConfirmQR() {
    setStep('setup-verify');
    setCode('');
    setError('');
  }

  async function handleVerifySetup() {
    setError('');
    startTransition(async () => {
      const result = await confirm2FASetup(code);
      if (result.success) {
        setEnabled(true);
        setStep('success');
      } else {
        setError(result.error ?? 'Código incorrecto');
      }
    });
  }

  async function handleDisable() {
    setError('');
    startTransition(async () => {
      const result = await disable2FA(code);
      if (result.success) {
        setEnabled(false);
        setStep('idle');
        setCode('');
      } else {
        setError(result.error ?? 'Código incorrecto');
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-500" />
          Seguridad
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Configura la autenticación de dos factores para proteger tu cuenta.</p>
      </div>

      {/* 2FA Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${enabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              {enabled
                ? <ShieldCheck className="h-5 w-5 text-emerald-600" />
                : <ShieldOff className="h-5 w-5 text-zinc-400" />
              }
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Autenticación de dos factores (2FA)</p>
              <p className="text-sm text-zinc-500">
                {enabled
                  ? 'Activo — tu cuenta está protegida con TOTP'
                  : 'Inactivo — recomendamos activar 2FA'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
            {enabled ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Steps */}
        {step === 'idle' && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {!enabled ? (
              <button
                onClick={handleStartSetup}
                disabled={isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
              >
                {isPending ? 'Preparando...' : t.configuracion.enable2fa}
              </button>
            ) : (
              <button
                onClick={() => { setStep('disable-verify'); setCode(''); setError(''); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
              >
                {t.configuracion.disable2fa}
              </button>
            )}
          </div>
        )}

        {/* QR Code step */}
        {step === 'setup-qr' && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              1. Abre <strong>Google Authenticator</strong>, <strong>Authy</strong> o cualquier app TOTP
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              2. Escanea este código QR con tu app:
            </p>
            <div className="flex justify-center">
              {qrDataUrl && <img src={qrDataUrl} alt="QR 2FA" className="rounded-lg border border-zinc-200 dark:border-zinc-700" />}
            </div>
            <p className="text-xs text-zinc-500 text-center">
              ¿No puedes escanear? Ingresa manualmente: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded font-mono text-xs break-all">{secret}</code>
            </p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep('idle')} className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                Cancelar
              </button>
              <button onClick={handleConfirmQR} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition">
                Ya lo escaneé →
              </button>
            </div>
          </div>
        )}

        {/* Verify setup step */}
        {step === 'setup-verify' && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              3. Ingresa el código de 6 dígitos que muestra tu app para confirmar:
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-40 text-center text-2xl font-mono tracking-widest px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {error && <p className="text-sm text-red-500 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep('setup-qr')} className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                ← Volver
              </button>
              <button
                onClick={handleVerifySetup}
                disabled={code.length !== 6 || isPending}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isPending ? 'Verificando...' : 'Confirmar y activar'}
              </button>
            </div>
          </div>
        )}

        {/* Disable step */}
        {step === 'disable-verify' && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Para desactivar 2FA, ingresa el código actual de tu app autenticadora:
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-40 text-center text-2xl font-mono tracking-widest px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {error && <p className="text-sm text-red-500 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep('idle')} className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                Cancelar
              </button>
              <button
                onClick={handleDisable}
                disabled={code.length !== 6 || isPending}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isPending ? 'Desactivando...' : 'Desactivar 2FA'}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">¡2FA activado exitosamente!</p>
            </div>
            <p className="text-sm text-zinc-500 mt-1">A partir de ahora se te pedirá el código cada vez que inicies sesión.</p>
            <button onClick={() => setStep('idle')} className="mt-3 px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
              Listo
            </button>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex gap-3">
        <Smartphone className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Apps compatibles con CIFRA 2FA</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Google Authenticator, Authy, Microsoft Authenticator, 1Password, Bitwarden, y cualquier app TOTP estándar (RFC 6238).</p>
        </div>
      </div>
    </div>
  );
}
