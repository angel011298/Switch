'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertTriangle } from 'lucide-react';
import { verify2FALogin } from '@/app/(dashboard)/configuracion/seguridad/actions';
import { useI18n } from '@/lib/i18n/context';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = useI18n();

  function handleVerify() {
    setError('');
    startTransition(async () => {
      const result = await verify2FALogin(code);
      if (result.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.error ?? 'Código incorrecto');
        setCode('');
      }
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Shield className="h-7 w-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t.auth.twoFactor}</h1>
          <p className="text-zinc-400 text-sm mt-2">{t.auth.enterCode}</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleVerify()}
              placeholder="000000"
              className="w-48 text-center text-3xl font-mono tracking-[0.4em] px-4 py-4 border border-zinc-700 rounded-xl bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={code.length !== 6 || isPending}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold rounded-xl transition text-sm"
          >
            {isPending ? t.auth.verifying : `${t.auth.verify} →`}
          </button>

          <p className="text-xs text-zinc-500 text-center">
            {t.auth.codeChanges}
          </p>
        </div>
      </div>
    </div>
  );
}
