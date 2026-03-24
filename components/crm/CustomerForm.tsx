'use client';

/**
 * Switch OS — Formulario de Alta de Cliente/Tercero Fiscal
 * =========================================================
 * Formulario para ingresar datos fiscales de un cliente.
 * Se puede llenar manualmente o pre-poblar con datos del QR/SAT.
 */

import { useState, useTransition } from 'react';
import { createCustomer } from '@/app/(dashboard)/crm/actions';
import type { CsfData } from '@/lib/crm/sat-csf-scraper';

interface CustomerFormProps {
  prefillData?: CsfData | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CustomerForm({ prefillData, onSuccess, onCancel }: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    rfc: prefillData?.rfc ?? '',
    legalName: prefillData?.legalName ?? '',
    zipCode: prefillData?.zipCode ?? '',
    taxRegimeSatCode: prefillData?.regimes[0] ?? '',
    defaultUsoCfdi: 'G03',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    notes: '',
    tags: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await createCustomer({
          ...form,
          source: prefillData ? 'QR_SCAN' : 'MANUAL',
        });
        setSuccess(true);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear cliente');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos Fiscales (requeridos) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Datos Fiscales (CFDI 4.0)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">RFC *</label>
            <input
              name="rfc"
              value={form.rfc}
              onChange={handleChange}
              required
              maxLength={13}
              placeholder="XAXX010101000"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase"
            />
            <p className="text-xs text-zinc-500 mt-1">12 chars (Moral) o 13 chars (Fisica)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Razon Social / Nombre *</label>
            <input
              name="legalName"
              value={form.legalName}
              onChange={handleChange}
              required
              placeholder="Empresa SA de CV"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Codigo Postal *</label>
            <input
              name="zipCode"
              value={form.zipCode}
              onChange={handleChange}
              required
              maxLength={5}
              pattern="\d{5}"
              placeholder="06600"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Regimen Fiscal</label>
            <input
              name="taxRegimeSatCode"
              value={form.taxRegimeSatCode}
              onChange={handleChange}
              placeholder="601"
              maxLength={3}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <p className="text-xs text-zinc-500 mt-1">Clave SAT (ej. 601, 612, 626)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Uso CFDI</label>
            <select
              name="defaultUsoCfdi"
              value={form.defaultUsoCfdi}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="G01">G01 - Adquisicion de mercancias</option>
              <option value="G02">G02 - Devoluciones, descuentos o bonificaciones</option>
              <option value="G03">G03 - Gastos en general</option>
              <option value="I01">I01 - Construcciones</option>
              <option value="I02">I02 - Mobiliario y equipo de oficina</option>
              <option value="I04">I04 - Equipo de computo y accesorios</option>
              <option value="I08">I08 - Otra maquinaria y equipo</option>
              <option value="D01">D01 - Honorarios medicos y gastos hospitalarios</option>
              <option value="D10">D10 - Pagos por servicios educativos</option>
              <option value="S01">S01 - Sin efectos fiscales</option>
              <option value="CP01">CP01 - Pagos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Datos de Contacto (opcionales) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Datos de Contacto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="contacto@empresa.com"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Telefono</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="55 1234 5678"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-1">Direccion</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Av. Reforma 123, Col. Centro"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Ciudad</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Ciudad de Mexico"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Estado</label>
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="CDMX"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tags y Notas */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Tags (separados por coma)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="proveedor, recurrente, premium"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Notas</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Notas internas sobre el cliente..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-green-300 text-sm">
          Cliente registrado exitosamente.
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-600/50 text-white rounded-lg transition-colors font-medium"
        >
          {isPending ? 'Registrando...' : 'Registrar Cliente'}
        </button>
      </div>
    </form>
  );
}
