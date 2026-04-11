'use client';

import { useState } from 'react';
import { Truck, Plus, CheckCircle2, Clock, XCircle, ChevronRight, ChevronLeft, Package, Loader2 } from 'lucide-react';
import { createCartaPorte, type CartaPorteInput } from './actions';

type Carta = { id: string; origenCp: string; destinoCp: string; viaTransporte: string; numPlacas: string | null; fechaSalidaLlegada: string; status: string; cfdiUuid: string | null; createdAt: string };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Borrador',  color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
  STAMPED:   { label: 'Timbrada', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
};

const VIA_LABELS: Record<string, string> = { '01': 'Autotransporte', '03': 'Aéreo', '04': 'Marítimo', '05': 'Ferroviario' };

type Mercancia = { clave: string; descripcion: string; cantidad: number; pesoKg: number; valorMercancia: number };

function emptyForm(): CartaPorteInput {
  return { viaTransporte: '01', origenCp: '', destinoCp: '', fechaSalidaLlegada: '', totalDistRec: 0, mercancias: [{ clave: '', descripcion: '', cantidad: 1, pesoKg: 0, valorMercancia: 0 }] };
}

export default function CartaPorteClient({ initialCartas }: { initialCartas: Carta[] }) {
  const [cartas, setCartas] = useState(initialCartas);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CartaPorteInput>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function setField<K extends keyof CartaPorteInput>(k: K, v: CartaPorteInput[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function updateMercancia(idx: number, field: keyof Mercancia, value: string | number) {
    setForm(prev => {
      const m = [...prev.mercancias];
      m[idx] = { ...m[idx], [field]: value };
      return { ...prev, mercancias: m };
    });
  }

  async function handleCreate() {
    setSaving(true); setMsg('');
    try {
      await createCartaPorte(form);
      setShowWizard(false);
      setForm(emptyForm());
      setStep(1);
      setMsg('✅ Carta Porte creada como borrador. Completa la configuración CSD para timbrar.');
      window.location.reload();
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`);
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 space-y-6">
      <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-500/10 p-3 rounded-2xl border border-cyan-500/20">
            <Truck className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Carta Porte 3.0</h1>
            <p className="text-neutral-500 text-sm mt-1">Complemento CFDI para traslado de mercancías — NOM-187-SCT2</p>
          </div>
        </div>
        <button onClick={() => { setShowWizard(true); setStep(1); setForm(emptyForm()); }} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-sm transition-colors">
          <Plus className="h-4 w-4" /> Nueva Carta Porte
        </button>
      </header>

      {msg && <div className={`p-4 rounded-2xl text-sm font-semibold ${msg.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200' : 'bg-red-50 dark:bg-red-500/10 text-red-700 border border-red-200'}`}>{msg}</div>}

      {cartas.length === 0 && !showWizard ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 flex flex-col items-center gap-4">
          <Truck className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="font-black text-neutral-500">Sin cartas porte creadas</p>
          <p className="text-sm text-neutral-400">Emite Complementos Carta Porte 3.0 para tus traslados</p>
        </div>
      ) : !showWizard ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>{['Origen CP', 'Destino CP', 'Vía', 'Placas', 'Salida', 'Estado', 'UUID'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-black text-neutral-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {cartas.map(c => {
                const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.DRAFT;
                return (
                  <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">{c.origenCp}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">{c.destinoCp}</td>
                    <td className="px-4 py-3 text-neutral-500">{VIA_LABELS[c.viaTransporte] ?? c.viaTransporte}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{c.numPlacas ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{new Date(c.fechaSalidaLlegada).toLocaleDateString('es-MX')}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}>{cfg.label}</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{c.cfdiUuid ? c.cfdiUuid.slice(0, 8) + '...' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Wizard */}
      {showWizard && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-5">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${s === step ? 'bg-cyan-600 text-white' : s < step ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>{s < step ? <CheckCircle2 className="h-4 w-4" /> : s}</div>
                <span className={`text-sm font-semibold ${s === step ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>{['Traslado', 'Vehículo', 'Mercancías'][s - 1]}</span>
                {s < 3 && <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-black text-neutral-900 dark:text-white">Datos del Traslado</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Vía de Transporte</label>
                  <select value={form.viaTransporte} onChange={e => setField('viaTransporte', e.target.value)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm">
                    {Object.entries(VIA_LABELS).map(([v, l]) => <option key={v} value={v}>{v} — {l}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Fecha y Hora Salida</label><input type="datetime-local" value={form.fechaSalidaLlegada} onChange={e => setField('fechaSalidaLlegada', e.target.value)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">CP Origen</label><input value={form.origenCp} onChange={e => setField('origenCp', e.target.value)} placeholder="06600" maxLength={5} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm font-mono" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">CP Destino</label><input value={form.destinoCp} onChange={e => setField('destinoCp', e.target.value)} placeholder="44100" maxLength={5} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm font-mono" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Domicilio Origen (opcional)</label><input value={form.origenDomicilio ?? ''} onChange={e => setField('origenDomicilio', e.target.value)} placeholder="Av. Insurgentes 1234..." className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Distancia Total (km)</label><input type="number" min={1} value={form.totalDistRec || ''} onChange={e => setField('totalDistRec', parseFloat(e.target.value) || 0)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-black text-neutral-900 dark:text-white">Vehículo y Transportista</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">RFC Transportista</label><input value={form.rfcTransportista ?? ''} onChange={e => setField('rfcTransportista', e.target.value.toUpperCase())} placeholder="XAXX010101000" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm font-mono" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Número de Placas</label><input value={form.numPlacas ?? ''} onChange={e => setField('numPlacas', e.target.value.toUpperCase())} placeholder="ABC-1234" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm font-mono" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Configuración Vehicular (SCT)</label><input value={form.configVehicular ?? ''} onChange={e => setField('configVehicular', e.target.value)} placeholder="C2, C3, T3S2..." className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Nombre del Operador</label><input value={form.nombreOperador ?? ''} onChange={e => setField('nombreOperador', e.target.value)} placeholder="Nombre completo" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">RFC Operador</label><input value={form.rfcOperador ?? ''} onChange={e => setField('rfcOperador', e.target.value.toUpperCase())} placeholder="RFC personal" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm font-mono" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Número de Licencia</label><input value={form.numLicencia ?? ''} onChange={e => setField('numLicencia', e.target.value)} placeholder="1234567890" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-neutral-900 dark:text-white">Mercancías</h3>
                <button onClick={() => setForm(prev => ({ ...prev, mercancias: [...prev.mercancias, { clave: '', descripcion: '', cantidad: 1, pesoKg: 0, valorMercancia: 0 }] }))} className="flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700">
                  <Plus className="h-3 w-3" />Agregar mercancía
                </button>
              </div>
              <div className="space-y-3">
                {form.mercancias.map((m, i) => (
                  <div key={i} className="grid grid-cols-5 gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                    <div><label className="block text-xs text-neutral-400 mb-1">Clave SAT</label><input value={m.clave} onChange={e => updateMercancia(i, 'clave', e.target.value)} placeholder="12345678" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-xs font-mono" /></div>
                    <div className="col-span-2"><label className="block text-xs text-neutral-400 mb-1">Descripción</label><input value={m.descripcion} onChange={e => updateMercancia(i, 'descripcion', e.target.value)} placeholder="Descripción de la mercancía" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-xs" /></div>
                    <div><label className="block text-xs text-neutral-400 mb-1">Peso (kg)</label><input type="number" min={0} step={0.1} value={m.pesoKg || ''} onChange={e => updateMercancia(i, 'pesoKg', parseFloat(e.target.value) || 0)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-xs" /></div>
                    <div><label className="block text-xs text-neutral-400 mb-1">Valor (MXN)</label><input type="number" min={0} value={m.valorMercancia || ''} onChange={e => updateMercancia(i, 'valorMercancia', parseFloat(e.target.value) || 0)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-xs" /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl text-sm"><ChevronLeft className="h-4 w-4" />Anterior</button>}
            {step < 3 && <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-sm ml-auto">Siguiente <ChevronRight className="h-4 w-4" /></button>}
            {step === 3 && <button onClick={handleCreate} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-sm ml-auto disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}Guardar Borrador</button>}
            <button onClick={() => { setShowWizard(false); setStep(1); }} className="px-5 text-neutral-500 font-semibold text-sm">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
