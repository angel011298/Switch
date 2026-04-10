'use client';

/**
 * CIFRA — Wizard de Firma de Contrato
 * =====================================
 * Flujo multi-paso para recopilar datos legales y firma digital.
 *
 * Paso 1: Tipo de persona (FISICA / MORAL)
 * Paso 2: Datos legales (condicionales según tipo)
 * Paso 3: Firma digital (trazo en canvas o e.firma SAT)
 * Paso 4: Resumen y confirmación
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { PersonType } from '@prisma/client';
import {
  User, Building2, PenLine, ShieldCheck, CheckCircle2,
  AlertCircle, ChevronRight, ChevronLeft, Loader2,
  Upload, X, Trash2, FileCheck,
} from 'lucide-react';
import { saveContractData, submitSignature } from './actions';

type ContratoStep = 1 | 2 | 3 | 4;

interface ContratoClientProps {
  initialPersonType: PersonType | null;
  tenantEmail: string;
}

const inputCls = `w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 transition-shadow`;

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pt-2 border-t border-slate-100 dark:border-neutral-800 mt-2">
      {children}
    </p>
  );
}

// ─── Canvas Signature ─────────────────────────────────────────────────────────

function SignatureCanvas({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsEmpty(false);
  }

  function endDraw() {
    drawing.current = false;
    if (!isEmpty && canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onSave('');
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-slate-300 dark:border-neutral-600 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full touch-none cursor-crosshair"
          style={{ display: 'block' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Dibuja tu firma aquí
            </p>
          </div>
        )}
      </div>
      {!isEmpty && (
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Borrar y volver a firmar
        </button>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ContratoClient({ initialPersonType, tenantEmail }: ContratoClientProps) {
  const [step, setStep]       = useState<ContratoStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  // Paso 1
  const [personType, setPersonType] = useState<PersonType>(initialPersonType ?? 'FISICA');

  // Paso 2 — Persona Física
  const [fullName,        setFullName]        = useState('');
  const [curp,            setCurp]            = useState('');
  const [domicilioFiscal, setDomicilioFiscal] = useState('');
  const [rfcFisica,       setRfcFisica]       = useState('');
  const [emailFisica,     setEmailFisica]     = useState(tenantEmail);
  const [phoneFisica,     setPhoneFisica]     = useState('');

  // Paso 2 — Persona Moral — Empresa
  const [razonSocial,    setRazonSocial]    = useState('');
  const [rfcEmpresa,     setRfcEmpresa]     = useState('');
  const [domicilioLegal, setDomicilioLegal] = useState('');

  // Paso 2 — Persona Moral — Representante Legal
  const [nombreRepresentante,  setNombreRepresentante]  = useState('');
  const [rfcRepresentante,     setRfcRepresentante]     = useState('');
  const [emailRepresentante,   setEmailRepresentante]   = useState(tenantEmail);
  const [celularRepresentante, setCelularRepresentante] = useState('');

  // Paso 2 — Acreditación
  const [numEscritura,        setNumEscritura]        = useState('');
  const [fechaEscritura,      setFechaEscritura]      = useState('');
  const [nombreNotario,       setNombreNotario]       = useState('');
  const [numNotaria,          setNumNotaria]          = useState('');
  const [ciudadNotaria,       setCiudadNotaria]       = useState('');
  const [folioMercantil,      setFolioMercantil]      = useState('');
  const [fechaInscripcionRPC, setFechaInscripcionRPC] = useState('');

  // Paso 3 — Firma
  const [signatureType, setSignatureType] = useState<'DRAW' | 'EFIRMA'>('DRAW');
  const [signatureData, setSignatureData] = useState('');
  const [efirmaFile,    setEfirmaFile]    = useState<File | null>(null);
  const efirmaRef = useRef<HTMLInputElement>(null);

  async function handleSaveData() {
    setError('');
    setLoading(true);
    try {
      await saveContractData({
        personType,
        fullName,
        curp,
        domicilioFiscal,
        rfcFisica,
        emailFisica,
        phoneFisica,
        razonSocial,
        rfcEmpresa,
        domicilioLegal,
        nombreRepresentante,
        rfcRepresentante,
        emailRepresentante,
        celularRepresentante,
        numEscritura,
        fechaEscritura,
        nombreNotario,
        numNotaria,
        ciudadNotaria,
        folioMercantil,
        fechaInscripcionRPC,
      });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los datos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    setError('');
    if (signatureType === 'DRAW' && !signatureData) {
      return setError('Dibuja tu firma en el canvas para continuar.');
    }
    if (signatureType === 'EFIRMA' && !efirmaFile) {
      return setError('Selecciona tu archivo de e.firma (.cer) para continuar.');
    }
    setLoading(true);
    try {
      await submitSignature({
        signatureType,
        signatureData: signatureType === 'DRAW' ? signatureData : undefined,
        efirmaFileName: efirmaFile?.name,
      });
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la firma.');
    } finally {
      setLoading(false);
    }
  }

  if (done || step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div className="text-center space-y-5 px-6 max-w-sm">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
              <FileCheck className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              ¡Contrato firmado!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
              Hemos registrado tu firma digital. Recibirás una copia del contrato de licenciamiento y el convenio de confidencialidad en tu correo electrónico.
            </p>
          </div>
          <a
            href="/billing/subscription"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-500/30"
          >
            <CheckCircle2 className="h-4 w-4" />
            Ir a mi suscripción
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-slate-50 dark:bg-neutral-950 p-4 py-10">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-emerald-400/8 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-blue-400/8 dark:bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-10 px-4 rounded-xl bg-slate-900 dark:bg-neutral-800 shadow-md ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center">
              <svg viewBox="0 0 90 32" className="h-6 w-auto" aria-label="ÇifRΛ" role="img">
                <text x="45" y="24" textAnchor="middle" fontSize="24" fontWeight="800" fill="white"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
                  letterSpacing="-0.8">ÇifRΛ</text>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contrato de Licenciamiento</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Completa tus datos para generar y firmar el contrato y el convenio de confidencialidad
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {[
            { id: 1, label: 'Tipo' },
            { id: 2, label: 'Datos' },
            { id: 3, label: 'Firma' },
            { id: 4, label: 'Listo' },
          ].map((s, i) => {
            const isActive    = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md'
                    : isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>{s.id}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < 3 && (
                  <div className={`h-px w-6 transition-colors ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-neutral-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ══ PASO 1: Tipo de persona ══════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="pb-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">¿Cómo contratas el servicio?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  El tipo de persona determina los campos del contrato y el convenio de confidencialidad.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPersonType('FISICA')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                    personType === 'FISICA'
                      ? 'border-slate-900 dark:border-emerald-500 bg-slate-50 dark:bg-emerald-500/10'
                      : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-slate-300'
                  }`}
                >
                  <User className={`h-8 w-8 ${personType === 'FISICA' ? 'text-slate-900 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-bold ${personType === 'FISICA' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                      Persona Física
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Individuo o profesionista</p>
                  </div>
                  {personType === 'FISICA' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPersonType('MORAL')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                    personType === 'MORAL'
                      ? 'border-slate-900 dark:border-emerald-500 bg-slate-50 dark:bg-emerald-500/10'
                      : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-slate-300'
                  }`}
                >
                  <Building2 className={`h-8 w-8 ${personType === 'MORAL' ? 'text-slate-900 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-bold ${personType === 'MORAL' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                      Persona Moral
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Empresa, S.A. de C.V., S.C., etc.</p>
                  </div>
                  {personType === 'MORAL' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </button>
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                <strong>Nota legal:</strong> El contrato generado tendrá validez conforme al Código Civil Federal y la Ley de Firma Electrónica Avanzada (LFEA). Tu firma digital tiene la misma fuerza legal que una firma autógrafa.
              </div>
            </div>
          )}

          {/* ══ PASO 2: Datos legales ════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 -mr-1">
              <div className="pb-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {personType === 'FISICA' ? 'Datos de la Persona Física' : 'Datos de la Empresa'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Exactamente como aparecen en tu Constancia de Situación Fiscal del SAT.
                </p>
              </div>

              {personType === 'FISICA' ? (
                <>
                  <Field label="Nombre Completo" required>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nombre(s) Apellido Paterno Apellido Materno" className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="RFC (13 posiciones)" required>
                      <input type="text" value={rfcFisica}
                        onChange={(e) => setRfcFisica(e.target.value.toUpperCase().replace(/[^A-Z0-9&Ñ]/g,'').slice(0,13))}
                        placeholder="XAXX010101000" maxLength={13} className={`${inputCls} uppercase tracking-widest`} />
                    </Field>
                    <Field label="CURP (18 caracteres)">
                      <input type="text" value={curp}
                        onChange={(e) => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,18))}
                        placeholder="XAXX000101HMCXXX00" maxLength={18} className={`${inputCls} uppercase tracking-widest`} />
                    </Field>
                  </div>
                  <Field label="Domicilio Fiscal" required>
                    <input type="text" value={domicilioFiscal} onChange={(e) => setDomicilioFiscal(e.target.value)}
                      placeholder="Calle, Número, Colonia, Municipio, C.P., Estado" className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Correo Electrónico" required>
                      <input type="email" value={emailFisica} onChange={(e) => setEmailFisica(e.target.value)}
                        placeholder="correo@ejemplo.com" className={inputCls} />
                    </Field>
                    <Field label="Número de Celular" required>
                      <input type="tel" value={phoneFisica}
                        onChange={(e) => setPhoneFisica(e.target.value.replace(/\D/g,'').slice(0,10))}
                        placeholder="5512345678" maxLength={10} className={inputCls} />
                    </Field>
                  </div>
                </>
              ) : (
                <>
                  <SectionTitle>A. Datos de la Empresa (El Licenciatario)</SectionTitle>
                  <Field label="Razón o Denominación Social" required>
                    <input type="text" value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                      placeholder="MI EMPRESA S.A. DE C.V." className={`${inputCls} uppercase`} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="RFC de la Empresa (12 pos.)" required>
                      <input type="text" value={rfcEmpresa}
                        onChange={(e) => setRfcEmpresa(e.target.value.toUpperCase().replace(/[^A-Z0-9&Ñ]/g,'').slice(0,12))}
                        placeholder="MEE010101000" maxLength={12} className={`${inputCls} uppercase tracking-widest`} />
                    </Field>
                    <Field label="Nacionalidad">
                      <input type="text" defaultValue="Mexicana" disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
                    </Field>
                  </div>
                  <Field label="Domicilio Legal / Fiscal" required>
                    <input type="text" value={domicilioLegal} onChange={(e) => setDomicilioLegal(e.target.value)}
                      placeholder="Calle, Número, Colonia, Municipio, C.P., Estado" className={inputCls} />
                  </Field>

                  <SectionTitle>B. Representante Legal (Quien firma)</SectionTitle>
                  <Field label="Nombre Completo del Representante" required>
                    <input type="text" value={nombreRepresentante} onChange={(e) => setNombreRepresentante(e.target.value)}
                      placeholder="Nombre(s) Apellido Paterno Apellido Materno" className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="RFC del Representante">
                      <input type="text" value={rfcRepresentante}
                        onChange={(e) => setRfcRepresentante(e.target.value.toUpperCase().replace(/[^A-Z0-9&Ñ]/g,'').slice(0,13))}
                        placeholder="XAXX010101000" maxLength={13} className={`${inputCls} uppercase tracking-widest`} />
                    </Field>
                    <Field label="Celular del Representante" required>
                      <input type="tel" value={celularRepresentante}
                        onChange={(e) => setCelularRepresentante(e.target.value.replace(/\D/g,'').slice(0,10))}
                        placeholder="5512345678" maxLength={10} className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Correo del Representante" required>
                    <input type="email" value={emailRepresentante} onChange={(e) => setEmailRepresentante(e.target.value)}
                      placeholder="representante@empresa.com" className={inputCls} />
                  </Field>

                  <SectionTitle>C. Acreditación de Personalidad Jurídica</SectionTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1 mb-2">
                    Datos de la escritura pública que acredita las facultades del representante legal.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Número de Escritura">
                      <input type="text" value={numEscritura} onChange={(e) => setNumEscritura(e.target.value)}
                        placeholder="Ej. 12,345" className={inputCls} />
                    </Field>
                    <Field label="Fecha de la Escritura">
                      <input type="date" value={fechaEscritura} onChange={(e) => setFechaEscritura(e.target.value)}
                        className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Nombre del Notario / Corredor Público">
                    <input type="text" value={nombreNotario} onChange={(e) => setNombreNotario(e.target.value)}
                      placeholder="Lic. Juan Pérez García" className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Número de Notaría / Correduría">
                      <input type="text" value={numNotaria} onChange={(e) => setNumNotaria(e.target.value)}
                        placeholder="Notaría No. 42" className={inputCls} />
                    </Field>
                    <Field label="Ciudad y Estado">
                      <input type="text" value={ciudadNotaria} onChange={(e) => setCiudadNotaria(e.target.value)}
                        placeholder="Ciudad de México, CDMX" className={inputCls} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Folio Mercantil Electrónico (RPC)">
                      <input type="text" value={folioMercantil} onChange={(e) => setFolioMercantil(e.target.value)}
                        placeholder="Folio No. 12*123456*8" className={inputCls} />
                    </Field>
                    <Field label="Fecha de Inscripción en RPC">
                      <input type="date" value={fechaInscripcionRPC} onChange={(e) => setFechaInscripcionRPC(e.target.value)}
                        className={inputCls} />
                    </Field>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ PASO 3: Firma Digital ════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="pb-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Firma Digital</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Elige cómo deseas firmar el contrato. Ambas opciones tienen validez legal conforme a la LFEA.
                </p>
              </div>

              {/* Toggle */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSignatureType('DRAW')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    signatureType === 'DRAW'
                      ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <PenLine className="h-4 w-4" />
                  Trazo en pantalla
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureType('EFIRMA')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    signatureType === 'EFIRMA'
                      ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  e.firma SAT
                </button>
              </div>

              {signatureType === 'DRAW' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Usa tu dedo o el mouse para plasmar tu firma. El trazo se almacena como imagen PNG con marca de tiempo.
                  </p>
                  <SignatureCanvas onSave={setSignatureData} />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Sube el archivo <strong>.cer</strong> de tu e.firma emitida por el SAT (FIEL). El sistema valida la vigencia del certificado antes de aceptarlo.
                  </p>
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-neutral-600 p-4 bg-slate-50 dark:bg-neutral-800/50">
                    {efirmaFile ? (
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 truncate">{efirmaFile.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{(efirmaFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => setEfirmaFile(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => efirmaRef.current?.click()}
                        className="w-full flex flex-col items-center gap-2 py-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        <Upload className="h-6 w-6" />
                        <span className="text-sm font-medium">Seleccionar archivo .cer</span>
                        <span className="text-xs text-slate-400">Certificado de e.firma del SAT</span>
                      </button>
                    )}
                    <input
                      ref={efirmaRef}
                      type="file"
                      accept=".cer"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) setEfirmaFile(e.target.files[0]); }}
                    />
                  </div>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    <strong>Seguridad:</strong> El archivo .cer solo contiene tu llave pública (certificado). Jamás subas tu archivo .key (llave privada). CIFRA nunca solicita tu contraseña de e.firma.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Botones ───────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => { setError(''); setStep((s) => Math.max(s - 1, 1) as ContratoStep); }}
                disabled={loading}
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
            ) : (
              <div />
            )}

            {step === 1 && (
              <button type="button" onClick={() => { setError(''); setStep(2); }}
                className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-sm">
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {step === 2 && (
              <button type="button" onClick={handleSaveData} disabled={loading}
                className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-sm disabled:opacity-50">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando…</> : <>Continuar <ChevronRight className="h-4 w-4" /></>}
              </button>
            )}

            {step === 3 && (
              <button type="button" onClick={handleSign} disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-emerald-500/30">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Procesando…</>
                  : <><FileCheck className="h-4 w-4" />Firmar y Contratar</>
                }
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
          CIFRA · Firma Digital con validez conforme a LFEA y NOM-151-SCFI-2016
        </p>
      </div>
    </div>
  );
}
