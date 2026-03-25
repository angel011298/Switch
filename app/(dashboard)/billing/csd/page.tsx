'use client';

/**
 * Switch OS — Configuración del CSD (Certificado de Sello Digital)
 * =================================================================
 * FASE 13: Upload de .cer + .key + contraseña para habilitar timbrado.
 * Muestra el CSD activo si ya existe.
 */

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, ShieldX, Upload, ArrowLeft,
  Loader2, AlertCircle, CheckCircle2, FileText, Key,
} from 'lucide-react';
import { uploadCsdAction, getCsdStatus, type CsdStatusInfo } from '../actions';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    timeZone: 'America/Mexico_City',
  });
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function CsdPage() {
  const router = useRouter();
  const [csd, setCsd] = useState<CsdStatusInfo | null>(null);
  const [loadingCsd, setLoadingCsd] = useState(true);

  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getCsdStatus()
      .then(setCsd)
      .finally(() => setLoadingCsd(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!cerFile) { setError('Selecciona el archivo .cer'); return; }
    if (!keyFile) { setError('Selecciona el archivo .key'); return; }
    if (!password.trim()) { setError('Ingresa la contraseña del CSD'); return; }

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('cer', cerFile);
        fd.append('key', keyFile);
        fd.append('password', password);

        const result = await uploadCsdAction(fd);
        setSuccess(`CSD cargado correctamente. Certificado N.° ${result.noCertificado} · Vigente hasta ${formatDate(result.validTo)}`);
        setCerFile(null);
        setKeyFile(null);
        setPassword('');
        // Refrescar estado del CSD
        const updated = await getCsdStatus();
        setCsd(updated);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el CSD');
      }
    });
  }

  const csdOk = csd?.exists && !csd.isExpired;
  const days = csd?.validTo ? daysUntil(csd.validTo) : null;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-neutral-950 dark:text-white">
            Certificado de Sello Digital
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
            Configura tu CSD para emitir facturas CFDI 4.0
          </p>
        </div>
      </div>

      {/* ── Estado CSD actual ── */}
      {loadingCsd ? (
        <div className="flex items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Cargando estado del certificado...
        </div>
      ) : csd?.exists ? (
        <div className={`p-5 rounded-2xl border ${
          csdOk
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
        }`}>
          <div className="flex items-start gap-3">
            {csdOk
              ? <ShieldCheck className="text-emerald-600 flex-shrink-0 mt-0.5" size={22} />
              : <ShieldX className="text-red-500 flex-shrink-0 mt-0.5" size={22} />
            }
            <div className="flex-1 min-w-0">
              <p className={`font-black text-sm ${csdOk ? 'text-emerald-900 dark:text-emerald-300' : 'text-red-900 dark:text-red-300'}`}>
                {csdOk ? 'CSD Activo' : 'CSD Vencido'}
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex gap-2">
                  <span className="text-neutral-500 w-28 flex-shrink-0">N.° Certificado</span>
                  <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                    {csd.noCertificado}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-neutral-500 w-28 flex-shrink-0">Vigente desde</span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {csd.validFrom ? formatDate(csd.validFrom) : '—'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-neutral-500 w-28 flex-shrink-0">Vigente hasta</span>
                  <span className={`font-semibold ${
                    days !== null && days <= 30
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {csd.validTo ? formatDate(csd.validTo) : '—'}
                    {days !== null && days > 0 && (
                      <span className="ml-1 font-normal text-neutral-500">({days} días)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-2xl">
          <AlertCircle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-orange-900 dark:text-orange-300 text-sm">Sin CSD configurado</p>
            <p className="text-orange-800 dark:text-orange-400 text-xs mt-1">
              Para emitir facturas necesitas cargar tu Certificado de Sello Digital emitido por el SAT.
            </p>
          </div>
        </div>
      )}

      {/* ── Formulario de carga ── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-black text-neutral-900 dark:text-white text-sm">
            {csd?.exists ? 'Reemplazar CSD' : 'Cargar CSD'}
          </h2>
          <p className="text-neutral-500 text-xs mt-1">
            Sube los archivos .cer y .key que descargaste del portal del SAT.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* .cer */}
          <div>
            <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 mb-2 uppercase tracking-wide">
              Archivo .cer (Certificado)
            </label>
            <FileDropZone
              accept=".cer"
              icon={<FileText size={20} className="text-neutral-400" />}
              file={cerFile}
              onChange={setCerFile}
              placeholder="Arrastra el .cer aquí o haz clic"
            />
          </div>

          {/* .key */}
          <div>
            <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 mb-2 uppercase tracking-wide">
              Archivo .key (Llave privada)
            </label>
            <FileDropZone
              accept=".key"
              icon={<Key size={20} className="text-neutral-400" />}
              file={keyFile}
              onChange={setKeyFile}
              placeholder="Arrastra el .key aquí o haz clic"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 mb-2 uppercase tracking-wide">
              Contraseña del CSD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña que usaste en el SAT"
                className="w-full px-4 py-3 pr-20 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-semibold px-2 py-1 rounded transition-colors"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {/* Alertas */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-700 dark:text-red-400">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !cerFile || !keyFile || !password.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white font-black rounded-xl text-sm transition-colors shadow-sm shadow-emerald-500/20 disabled:shadow-none"
          >
            {isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Validando CSD...</>
            ) : (
              <><Upload size={16} /> {csd?.exists ? 'Reemplazar CSD' : 'Cargar CSD'}</>
            )}
          </button>
        </form>
      </div>

      {/* ── Info adicional ── */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs text-neutral-500 space-y-1.5">
        <p className="font-bold text-neutral-700 dark:text-neutral-300">¿Dónde obtengo mi CSD?</p>
        <p>1. Ingresa al portal del SAT: <span className="font-mono">sat.gob.mx</span></p>
        <p>2. Ve a <strong>CertiSAT Web</strong> → Trámites → Solicitud de Certificado de Sello Digital.</p>
        <p>3. Descarga los archivos <span className="font-mono">.cer</span> y <span className="font-mono">.key</span> junto con la contraseña que asignaste.</p>
        <p className="text-neutral-400 pt-1">Tu llave privada se cifra con AES-256 antes de guardarse. Nunca la transmitimos en texto plano.</p>
      </div>
    </div>
  );
}

// ─── Sub-componente: FileDropZone ─────────────────────────────────────────────

interface FileDropZoneProps {
  accept: string;
  icon: React.ReactNode;
  file: File | null;
  onChange: (f: File | null) => void;
  placeholder: string;
}

function FileDropZone({ accept, icon, file, onChange, placeholder }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
        dragging
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
          : file
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
          : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50'
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
      ) : (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <div className="min-w-0 flex-1">
        {file ? (
          <>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 truncate">{file.name}</p>
            <p className="text-xs text-neutral-400">{(file.size / 1024).toFixed(1)} KB · Haz clic para cambiar</p>
          </>
        ) : (
          <p className="text-sm text-neutral-500">{placeholder}</p>
        )}
      </div>
    </label>
  );
}
