'use client';

/**
 * CIFRA — Wizard Nueva Factura CFDI 4.0
 * ==========================================
 * FASE 13: 4 pasos — Receptor → Conceptos → Datos → Preview + Emitir
 */

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Loader2, AlertCircle,
  Plus, Trash2, Search, User, Package, FileText, Send,
  ChevronDown,
} from 'lucide-react';
import {
  searchCustomers,
  getTenantProfile,
  createInvoiceAction,
  getPosOrderForBilling,
} from '../actions';
import { FORMA_PAGO, USO_CFDI } from '@/lib/cfdi/catalogs/sat-catalogs';
import type { CfdiInput, CfdiConceptoInput } from '@/lib/cfdi/types';

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface ReceptorForm {
  rfc: string;
  nombre: string;
  domicilioFiscalReceptor: string; // CP
  regimenFiscalReceptor: string;
  usoCfdi: string;
}

interface ConceptoForm extends Omit<CfdiConceptoInput, 'objetoImp'> {
  _id: string; // local key
  ivaRate: '16' | '8' | '0' | 'exento';
}

interface DatosForm {
  formaPago: string;
  metodoPago: 'PUE' | 'PPD';
  serie: string;
  condicionesDePago: string;
}

// ─── Catálogos pequeños ───────────────────────────────────────────────────────

const REGIMENES_RECEPTOR: Record<string, string> = {
  '601': 'General de Ley Personas Morales',
  '603': 'Personas Morales con Fines no Lucrativos',
  '605': 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
  '606': 'Arrendamiento',
  '607': 'Régimen de Enajenación o Adquisición de Bienes',
  '608': 'Demás ingresos',
  '609': 'Consolidación',
  '610': 'Residentes en el Extranjero sin Establecimiento Permanente en México',
  '611': 'Ingresos por Dividendos (socios y accionistas)',
  '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
  '614': 'Ingresos por intereses',
  '615': 'Régimen de los ingresos por obtención de premios',
  '616': 'Sin obligaciones fiscales',
  '620': 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
  '621': 'Incorporación Fiscal',
  '622': 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
  '623': 'Opcional para Grupos de Sociedades',
  '624': 'Coordinados',
  '625': 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
  '626': 'Régimen Simplificado de Confianza – RESICO',
};

// Unidades comunes
const UNIDADES = [
  { clave: 'H87', nombre: 'Pieza' },
  { clave: 'E48', nombre: 'Servicio' },
  { clave: 'ACT', nombre: 'Actividad' },
  { clave: 'KGM', nombre: 'Kilogramo' },
  { clave: 'LTR', nombre: 'Litro' },
  { clave: 'MTR', nombre: 'Metro' },
  { clave: 'XBX', nombre: 'Caja' },
  { clave: 'HUR', nombre: 'Hora' },
  { clave: 'DAY', nombre: 'Día' },
  { clave: 'MON', nombre: 'Mes' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function formatCurrency(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function conceptoSubtotal(c: ConceptoForm): number {
  const base = Math.round(c.cantidad * c.valorUnitario * 100) / 100;
  return base - (c.descuento ?? 0);
}

function conceptoIva(c: ConceptoForm): number {
  const base = conceptoSubtotal(c);
  const rate = c.ivaRate === '16' ? 0.16 : c.ivaRate === '8' ? 0.08 : 0;
  return Math.round(base * rate * 100) / 100;
}

function conceptoTotal(c: ConceptoForm): number {
  return conceptoSubtotal(c) + conceptoIva(c);
}

function buildTotals(conceptos: ConceptoForm[]) {
  const subtotal = conceptos.reduce((s, c) => s + conceptoSubtotal(c), 0);
  const iva = conceptos.reduce((s, c) => s + conceptoIva(c), 0);
  const total = subtotal + iva;
  return { subtotal, iva, total };
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Receptor', icon: User },
  { id: 2, label: 'Conceptos', icon: Package },
  { id: 3, label: 'Datos', icon: FileText },
  { id: 4, label: 'Emitir', icon: Send },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function NuevaFacturaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const posOrderId = searchParams.get('posOrderId');
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Estado de los pasos
  const [receptor, setReceptor] = useState<ReceptorForm>({
    rfc: '',
    nombre: '',
    domicilioFiscalReceptor: '',
    regimenFiscalReceptor: '626',
    usoCfdi: 'G03',
  });

  const [conceptos, setConceptos] = useState<ConceptoForm[]>([
    {
      _id: uid(),
      claveProdServ: '84111506',
      noIdentificacion: '',
      cantidad: 1,
      claveUnidad: 'E48',
      unidad: 'Servicio',
      descripcion: '',
      valorUnitario: 0,
      descuento: 0,
      ivaRate: '16',
    },
  ]);

  const [datos, setDatos] = useState<DatosForm>({
    formaPago: '03',
    metodoPago: 'PUE',
    serie: 'A',
    condicionesDePago: '',
  });

  // Customer search
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Emisor
  const [emisorRfc, setEmisorRfc] = useState('');

  // Error / éxito
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Cargar perfil del emisor
  useEffect(() => {
    getTenantProfile().then((t) => {
      if (t?.rfc) setEmisorRfc(t.rfc);
    });
  }, []);

  // ── Pre-llenado desde ticket POS ──────────────────────
  useEffect(() => {
    if (!posOrderId) return;
    getPosOrderForBilling(posOrderId)
      .then((order) => {
        // Pre-llenar conceptos con los productos del ticket
        setConceptos(
          order.items.map((item) => ({
            _id: uid(),
            claveProdServ: item.claveProdServ,
            noIdentificacion: '',
            cantidad: item.quantity,
            claveUnidad: item.claveUnidad,
            unidad: item.unidad,
            descripcion: item.productName,
            valorUnitario: item.unitPrice,
            descuento: 0,
            // Inferir tasa de IVA desde taxRate
            ivaRate: (
              item.taxRate >= 0.155 ? '16' :
              item.taxRate >= 0.075 ? '8' :
              item.taxRate > 0 ? '0' :
              'exento'
            ) as '16' | '8' | '0' | 'exento',
          }))
        );
        // Pre-llenar forma de pago desde el método del POS
        setDatos((prev) => ({ ...prev, formaPago: order.paymentMethod }));
      })
      .catch((err) => {
        console.error('[Nueva factura] Error cargando orden POS:', err);
      });
  }, [posOrderId]);

  // Buscar clientes con debounce
  useEffect(() => {
    if (query.length < 2) { setCustomers([]); return; }
    const t = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const results = await searchCustomers(query);
        setCustomers(results);
      } finally {
        setSearchingCustomers(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function selectCustomer(c: any) {
    setReceptor({
      rfc: c.rfc,
      nombre: c.legalName,
      domicilioFiscalReceptor: c.zipCode ?? '',
      regimenFiscalReceptor: c.taxRegime?.satCode ?? '626',
      usoCfdi: c.defaultUsoCfdi ?? 'G03',
    });
    setQuery('');
    setCustomers([]);
  }

  // ── Validaciones por paso ──

  function step1Valid(): string | null {
    if (!receptor.rfc.trim()) return 'RFC del receptor requerido';
    if (receptor.rfc.length < 12 || receptor.rfc.length > 13) return 'RFC inválido (12-13 caracteres)';
    if (!receptor.nombre.trim()) return 'Nombre/Razón social requerido';
    if (!/^\d{5}$/.test(receptor.domicilioFiscalReceptor)) return 'Código postal debe tener 5 dígitos';
    if (!receptor.regimenFiscalReceptor) return 'Régimen fiscal requerido';
    if (!receptor.usoCfdi) return 'Uso del CFDI requerido';
    return null;
  }

  function step2Valid(): string | null {
    if (conceptos.length === 0) return 'Agrega al menos un concepto';
    for (const c of conceptos) {
      if (!c.descripcion.trim()) return 'Todos los conceptos deben tener descripción';
      if (c.cantidad <= 0) return 'La cantidad debe ser mayor a cero';
      if (c.valorUnitario <= 0) return 'El valor unitario debe ser mayor a cero';
      if (!c.claveProdServ.trim()) return 'Clave producto/servicio requerida';
    }
    return null;
  }

  function step3Valid(): string | null {
    if (!datos.formaPago) return 'Forma de pago requerida';
    if (!datos.metodoPago) return 'Método de pago requerido';
    return null;
  }

  const [stepError, setStepError] = useState<string | null>(null);

  function goNext() {
    let err: string | null = null;
    if (step === 1) err = step1Valid();
    else if (step === 2) err = step2Valid();
    else if (step === 3) err = step3Valid();
    if (err) { setStepError(err); return; }
    setStepError(null);
    setStep(s => s + 1);
  }

  function goBack() {
    setStepError(null);
    setStep(s => s - 1);
  }

  // ── Emitir ──

  async function handleEmitir() {
    setSubmitError(null);
    startTransition(async () => {
      try {
        const cfdiConceptos: CfdiConceptoInput[] = conceptos.map((c) => ({
          claveProdServ: c.claveProdServ,
          noIdentificacion: c.noIdentificacion || undefined,
          cantidad: c.cantidad,
          claveUnidad: c.claveUnidad,
          unidad: c.unidad || undefined,
          descripcion: c.descripcion,
          valorUnitario: c.valorUnitario,
          descuento: c.descuento || undefined,
          objetoImp: c.ivaRate === 'exento' ? '01' : '02',
        }));

        const input: CfdiInput = {
          tenantId: '', // El server action valida el tenantId del JWT — se ignora aquí
          serie: datos.serie || undefined,
          formaPago: datos.formaPago,
          metodoPago: datos.metodoPago as any,
          condicionesDePago: datos.condicionesDePago || undefined,
          receptor: {
            rfc: receptor.rfc.trim().toUpperCase(),
            nombre: receptor.nombre.trim(),
            domicilioFiscalReceptor: receptor.domicilioFiscalReceptor,
            regimenFiscalReceptor: receptor.regimenFiscalReceptor,
            usoCfdi: receptor.usoCfdi,
          },
          conceptos: cfdiConceptos,
        };

        const res = await createInvoiceAction(input, posOrderId ?? undefined);
        setResult(res);
      } catch (err: any) {
        setSubmitError(err.message || 'Error al emitir la factura');
      }
    });
  }

  // ── Render ──

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-neutral-950 dark:text-white">
            Nueva Factura CFDI 4.0
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
            Comprobante Fiscal Digital por Internet
          </p>
        </div>
      </div>

      {/* Banner origen POS */}
      {posOrderId && (
        <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30 rounded-xl text-sm text-pink-700 dark:text-pink-400">
          <span className="text-base">🧾</span>
          <span>Facturando ticket <strong className="font-mono">{posOrderId.slice(-8).toUpperCase()}</strong> — Los conceptos se pre-llenaron desde la venta del POS.</span>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                active
                  ? 'bg-emerald-600 text-white'
                  : done
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
              }`}>
                {done ? <Check size={14} /> : <Icon size={14} />}
                <span className="text-xs font-black hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${done ? 'bg-emerald-300 dark:bg-emerald-600' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Paso 1: Receptor */}
      {step === 1 && (
        <Step1Receptor
          receptor={receptor}
          setReceptor={setReceptor}
          query={query}
          setQuery={setQuery}
          customers={customers}
          searchingCustomers={searchingCustomers}
          onSelectCustomer={selectCustomer}
        />
      )}

      {/* Paso 2: Conceptos */}
      {step === 2 && (
        <Step2Conceptos
          conceptos={conceptos}
          setConceptos={setConceptos}
        />
      )}

      {/* Paso 3: Datos del comprobante */}
      {step === 3 && (
        <Step3Datos
          datos={datos}
          setDatos={setDatos}
        />
      )}

      {/* Paso 4: Preview + Emitir */}
      {step === 4 && !result && (
        <Step4Preview
          receptor={receptor}
          conceptos={conceptos}
          datos={datos}
          emisorRfc={emisorRfc}
          isPending={isPending}
          submitError={submitError}
          onEmitir={handleEmitir}
        />
      )}

      {/* Resultado exitoso */}
      {result && (
        <ResultPanel result={result} onReset={() => router.push('/billing')} />
      )}

      {/* Error de paso */}
      {stepError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {stepError}
        </div>
      )}

      {/* Botones de navegación */}
      {!result && (
        <div className="flex justify-between gap-3">
          <button
            onClick={goBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowLeft size={15} /> Anterior
          </button>

          {step < 4 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black transition-colors shadow-sm shadow-emerald-500/20"
            >
              Siguiente <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleEmitir}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white rounded-xl text-sm font-black transition-colors shadow-sm shadow-emerald-500/20"
            >
              {isPending
                ? <><Loader2 size={15} className="animate-spin" /> Timbrando...</>
                : <><Send size={15} /> Emitir CFDI</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Paso 1: Receptor ─────────────────────────────────────────────────────────

function Step1Receptor({ receptor, setReceptor, query, setQuery, customers, searchingCustomers, onSelectCustomer }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
      <h2 className="font-black text-neutral-900 dark:text-white">Datos del Receptor</h2>

      {/* Búsqueda en CRM */}
      <div>
        <label className="block text-xs font-black text-neutral-500 uppercase tracking-wide mb-1.5">
          Buscar cliente existente
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="RFC o nombre del cliente..."
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {searchingCustomers && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-400" />
          )}
        </div>
        {customers.length > 0 && (
          <div className="mt-1 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-lg z-10">
            {customers.map((c: any) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCustomer(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-b border-neutral-100 dark:border-neutral-800 last:border-0 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-neutral-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{c.legalName}</p>
                  <p className="text-xs font-mono text-neutral-500">{c.rfc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
        <p className="text-xs text-neutral-400 mb-4">— o ingresa manualmente —</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            label="RFC *"
            value={receptor.rfc}
            onChange={(v: string) => setReceptor({ ...receptor, rfc: v.toUpperCase() })}
            placeholder="XAXX010101000"
            mono
          />
          <FieldInput
            label="Nombre / Razón Social *"
            value={receptor.nombre}
            onChange={(v: string) => setReceptor({ ...receptor, nombre: v })}
            placeholder="Nombre completo o empresa"
          />
          <FieldInput
            label="Código Postal *"
            value={receptor.domicilioFiscalReceptor}
            onChange={(v: string) => setReceptor({ ...receptor, domicilioFiscalReceptor: v })}
            placeholder="06600"
            maxLength={5}
          />
          <FieldSelect
            label="Régimen Fiscal *"
            value={receptor.regimenFiscalReceptor}
            onChange={(v: string) => setReceptor({ ...receptor, regimenFiscalReceptor: v })}
            options={Object.entries(REGIMENES_RECEPTOR).map(([k, v]) => ({ value: k, label: `${k} - ${v}` }))}
          />
          <FieldSelect
            label="Uso del CFDI *"
            value={receptor.usoCfdi}
            onChange={(v: string) => setReceptor({ ...receptor, usoCfdi: v })}
            options={Object.entries(USO_CFDI).map(([k, v]) => ({ value: k, label: `${k} - ${v}` }))}
            className="sm:col-span-2"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Paso 2: Conceptos ────────────────────────────────────────────────────────

function Step2Conceptos({ conceptos, setConceptos }: { conceptos: ConceptoForm[]; setConceptos: any }) {
  const { subtotal, iva, total } = buildTotals(conceptos);

  function addConcepto() {
    setConceptos((prev: ConceptoForm[]) => [
      ...prev,
      {
        _id: uid(),
        claveProdServ: '84111506',
        noIdentificacion: '',
        cantidad: 1,
        claveUnidad: 'E48',
        unidad: 'Servicio',
        descripcion: '',
        valorUnitario: 0,
        descuento: 0,
        ivaRate: '16',
      },
    ]);
  }

  function removeConcepto(id: string) {
    setConceptos((prev: ConceptoForm[]) => prev.filter((c) => c._id !== id));
  }

  function updateConcepto(id: string, field: string, value: any) {
    setConceptos((prev: ConceptoForm[]) =>
      prev.map((c) => (c._id === id ? { ...c, [field]: value } : c))
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <h2 className="font-black text-neutral-900 dark:text-white">Conceptos</h2>
        <button
          type="button"
          onClick={addConcepto}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-colors"
        >
          <Plus size={13} /> Agregar
        </button>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {conceptos.map((c, idx) => (
          <div key={c._id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-neutral-500 uppercase tracking-wide">
                Concepto {idx + 1}
              </span>
              {conceptos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeConcepto(c._id)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-4">
                <FieldInput
                  label="Descripción *"
                  value={c.descripcion}
                  onChange={(v: string) => updateConcepto(c._id, 'descripcion', v)}
                  placeholder="Descripción del producto o servicio"
                />
              </div>
              <FieldInput
                label="Clave SAT *"
                value={c.claveProdServ}
                onChange={(v: string) => updateConcepto(c._id, 'claveProdServ', v)}
                placeholder="84111506"
                mono
              />
              <FieldSelect
                label="Unidad *"
                value={c.claveUnidad}
                onChange={(v: string) => {
                  const u = UNIDADES.find((x) => x.clave === v);
                  updateConcepto(c._id, 'claveUnidad', v);
                  if (u) updateConcepto(c._id, 'unidad', u.nombre);
                }}
                options={UNIDADES.map((u) => ({ value: u.clave, label: `${u.clave} - ${u.nombre}` }))}
              />
              <FieldNumber
                label="Cantidad *"
                value={c.cantidad}
                onChange={(v: number) => updateConcepto(c._id, 'cantidad', v)}
                min={0.001}
                step={1}
              />
              <FieldNumber
                label="Valor Unitario *"
                value={c.valorUnitario}
                onChange={(v: number) => updateConcepto(c._id, 'valorUnitario', v)}
                min={0}
                step={0.01}
                prefix="$"
              />
              <FieldNumber
                label="Descuento"
                value={c.descuento ?? 0}
                onChange={(v: number) => updateConcepto(c._id, 'descuento', v)}
                min={0}
                step={0.01}
                prefix="$"
              />
              <FieldSelect
                label="IVA"
                value={c.ivaRate}
                onChange={(v: string) => updateConcepto(c._id, 'ivaRate', v)}
                options={[
                  { value: '16', label: 'IVA 16%' },
                  { value: '8', label: 'IVA 8%' },
                  { value: '0', label: 'IVA 0%' },
                  { value: 'exento', label: 'Exento' },
                ]}
              />
            </div>

            {/* Totales del concepto */}
            <div className="flex justify-end gap-4 text-xs text-neutral-500 pt-1">
              <span>Importe: <strong className="text-neutral-800 dark:text-neutral-200">{formatCurrency(conceptoSubtotal(c))}</strong></span>
              <span>IVA: <strong className="text-neutral-800 dark:text-neutral-200">{formatCurrency(conceptoIva(c))}</strong></span>
              <span>Total: <strong className="text-emerald-600">{formatCurrency(conceptoTotal(c))}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="px-6 py-4 bg-neutral-50 dark:bg-black/20 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex justify-between w-56">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between w-56">
            <span className="text-neutral-500">IVA</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(iva)}</span>
          </div>
          <div className="flex justify-between w-56 border-t border-neutral-200 dark:border-neutral-700 pt-1 mt-1">
            <span className="font-black text-neutral-900 dark:text-white">Total</span>
            <span className="font-black text-lg text-emerald-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Paso 3: Datos del comprobante ────────────────────────────────────────────

function Step3Datos({ datos, setDatos }: { datos: DatosForm; setDatos: any }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
      <h2 className="font-black text-neutral-900 dark:text-white">Datos del Comprobante</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldSelect
          label="Forma de Pago *"
          value={datos.formaPago}
          onChange={(v: string) => setDatos({ ...datos, formaPago: v })}
          options={Object.entries(FORMA_PAGO).map(([k, v]) => ({ value: k, label: `${k} - ${v}` }))}
        />
        <FieldSelect
          label="Método de Pago *"
          value={datos.metodoPago}
          onChange={(v: string) => setDatos({ ...datos, metodoPago: v as any })}
          options={[
            { value: 'PUE', label: 'PUE - Pago en una sola exhibición' },
            { value: 'PPD', label: 'PPD - Pago en parcialidades o diferido' },
          ]}
        />
        <FieldInput
          label="Serie"
          value={datos.serie}
          onChange={(v: string) => setDatos({ ...datos, serie: v.toUpperCase() })}
          placeholder="A"
          maxLength={10}
        />
        <FieldInput
          label="Condiciones de Pago"
          value={datos.condicionesDePago}
          onChange={(v: string) => setDatos({ ...datos, condicionesDePago: v })}
          placeholder="Ej. NETO 30, Contado, etc."
        />
      </div>

      {datos.metodoPago === 'PPD' && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl text-xs text-blue-700 dark:text-blue-400">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>PPD:</strong> Para pagos en parcialidades. En la forma de pago usa <strong>99 - Por definir</strong>.
            Deberás emitir complementos de pago al recibir cada parcialidad.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Paso 4: Preview + Emitir ─────────────────────────────────────────────────

function Step4Preview({ receptor, conceptos, datos, emisorRfc, isPending, submitError, onEmitir }: any) {
  const { subtotal, iva, total } = buildTotals(conceptos);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-black text-neutral-900 dark:text-white">Vista previa</h2>
          <p className="text-neutral-500 text-xs mt-1">Revisa los datos antes de emitir. Esta acción sellará y timbrará el CFDI.</p>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {/* Emisor / Receptor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-black text-neutral-500 uppercase tracking-wide">Emisor</p>
              <p className="font-mono font-semibold text-neutral-900 dark:text-white">{emisorRfc || '(RFC de tu empresa)'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-neutral-500 uppercase tracking-wide">Receptor</p>
              <p className="font-semibold text-neutral-900 dark:text-white">{receptor.nombre}</p>
              <p className="font-mono text-xs text-neutral-500">{receptor.rfc} · CP {receptor.domicilioFiscalReceptor}</p>
              <p className="text-xs text-neutral-500">{receptor.regimenFiscalReceptor} · Uso: {receptor.usoCfdi}</p>
            </div>
          </div>

          {/* Datos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-xs">
            <div>
              <p className="text-neutral-400 mb-0.5">Serie</p>
              <p className="font-mono font-black text-neutral-900 dark:text-white">{datos.serie || 'A'}</p>
            </div>
            <div>
              <p className="text-neutral-400 mb-0.5">Forma Pago</p>
              <p className="font-semibold text-neutral-900 dark:text-white">{datos.formaPago} - {FORMA_PAGO[datos.formaPago]}</p>
            </div>
            <div>
              <p className="text-neutral-400 mb-0.5">Método Pago</p>
              <p className="font-semibold text-neutral-900 dark:text-white">{datos.metodoPago}</p>
            </div>
            <div>
              <p className="text-neutral-400 mb-0.5">Condiciones</p>
              <p className="font-semibold text-neutral-900 dark:text-white">{datos.condicionesDePago || '—'}</p>
            </div>
          </div>

          {/* Conceptos */}
          <div>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-wide mb-2">Conceptos ({conceptos.length})</p>
            <div className="space-y-2">
              {conceptos.map((c: ConceptoForm, i: number) => (
                <div key={c._id} className="flex justify-between items-start gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white truncate">{c.descripcion}</p>
                    <p className="text-neutral-400 mt-0.5">{c.cantidad} × {formatCurrency(c.valorUnitario)} · IVA {c.ivaRate === 'exento' ? 'Exento' : `${c.ivaRate}%`}</p>
                  </div>
                  <p className="font-black text-neutral-900 dark:text-white flex-shrink-0">{formatCurrency(conceptoTotal(c))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="flex flex-col items-end gap-1 border-t border-neutral-100 dark:border-neutral-800 pt-3">
            <div className="flex justify-between w-52 text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between w-52 text-sm">
              <span className="text-neutral-500">IVA</span>
              <span className="font-semibold">{formatCurrency(iva)}</span>
            </div>
            <div className="flex justify-between w-52 text-base font-black">
              <span>Total</span>
              <span className="text-emerald-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {submitError}
        </div>
      )}
    </div>
  );
}

// ─── Panel de resultado ───────────────────────────────────────────────────────

function ResultPanel({ result, onReset }: { result: any; onReset: () => void }) {
  const isTimbrado = result?.status === 'STAMPED';

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center space-y-4">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto ${
        isTimbrado
          ? 'bg-emerald-100 dark:bg-emerald-500/20'
          : 'bg-orange-100 dark:bg-orange-500/20'
      }`}>
        {isTimbrado
          ? <Check size={32} className="text-emerald-600" />
          : <AlertCircle size={32} className="text-orange-500" />
        }
      </div>

      <div>
        <h3 className="text-xl font-black text-neutral-900 dark:text-white">
          {isTimbrado ? 'Factura emitida' : 'Factura sellada (sin timbrar)'}
        </h3>
        <p className="text-neutral-500 text-sm mt-1">
          {isTimbrado
            ? 'Tu CFDI fue sellado y timbrado correctamente por el PAC.'
            : 'La factura fue sellada pero aún no fue procesada por el PAC.'}
        </p>
      </div>

      {result?.uuid && (
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all">
          UUID: {result.uuid}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-colors"
        >
          Ver todas las facturas
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-sm rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Emitir otra
        </button>
      </div>
    </div>
  );
}

// ─── Componentes de campo reutilizables ───────────────────────────────────────

function FieldInput({ label, value, onChange, placeholder, mono, maxLength, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-xs font-black text-neutral-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-neutral-900 dark:text-white ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

function FieldNumber({ label, value, onChange, min, step, prefix, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-xs font-black text-neutral-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={step}
          className={`w-full ${prefix ? 'pl-7' : 'pl-3'} pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-neutral-900 dark:text-white`}
        />
      </div>
    </div>
  );
}

function FieldSelect({ label, value, onChange, options, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-xs font-black text-neutral-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-2.5 pr-8 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-neutral-900 dark:text-white"
        >
          {options.map((o: any) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
      </div>
    </div>
  );
}
