'use client';

/**
 * CIFRA — Catálogo de Empleados
 * ====================================
 * FASE 15: CRUD completo de empleados del tenant.
 * Alta, edición de datos laborales y baja (soft-delete via active=false).
 */

import { useState, useEffect, useTransition } from 'react';
import {
  Users, UserPlus, Search, Pencil, UserMinus, UserCheck,
  X, ChevronDown, Loader2, Banknote,
} from 'lucide-react';
import { getEmployees, createEmployee, type EmployeeRow } from '../actions';
import { updateEmployee } from '../nomina/actions';

// ─── Formulario de alta/edición ───────────────────────────────────────────────

interface EmployeeFormData {
  name: string;
  curp: string;
  rfc: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: string;
  salaryType: 'MENSUAL' | 'QUINCENAL';
  imssNumber: string;
  bankAccount: string;
  hireDate: string;
}

const EMPTY_FORM: EmployeeFormData = {
  name: '', curp: '', rfc: '', email: '', phone: '',
  position: '', department: '', salary: '', salaryType: 'MENSUAL',
  imssNumber: '', bankAccount: '',
  hireDate: new Date().toISOString().split('T')[0],
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EmpleadosPage() {
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeFormData>(EMPTY_FORM);

  // ── Cargar empleados ──
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  // ── Filtrar ──
  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.position ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.department ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Abrir modal de alta ──
  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  // ── Abrir modal de edición ──
  function openEdit(emp: EmployeeRow) {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      curp: '',
      rfc: '',
      email: emp.email ?? '',
      phone: emp.phone ?? '',
      position: emp.position,
      department: emp.department ?? '',
      salary: '',
      salaryType: 'MENSUAL',
      imssNumber: '',
      bankAccount: '',
      hireDate: emp.hireDate.split('T')[0],
    });
    setError(null);
    setShowModal(true);
  }

  // ── Submit formulario ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) {
          // Edición — solo campos con valor
          await updateEmployee(editingId, {
            name: form.name || undefined,
            position: form.position || undefined,
            department: form.department || undefined,
            email: form.email || undefined,
            phone: form.phone || undefined,
            ...(form.salary && { salary: parseFloat(form.salary) }),
            ...(form.salaryType && { salaryType: form.salaryType }),
            bankAccount: form.bankAccount || undefined,
          });
        } else {
          // Alta nueva
          if (!form.salary) throw new Error('El salario es requerido');
          await createEmployee({
            name: form.name,
            curp: form.curp,
            rfc: form.rfc || undefined,
            email: form.email || undefined,
            phone: form.phone || undefined,
            position: form.position,
            department: form.department || undefined,
            salary: parseFloat(form.salary),
            salaryType: form.salaryType,
            imssNumber: form.imssNumber || undefined,
            bankAccount: form.bankAccount || undefined,
            hireDate: form.hireDate,
          });
        }
        setShowModal(false);
        await loadEmployees();
      } catch (err: any) {
        setError(err.message || 'Error al guardar empleado');
      }
    });
  }

  // ── Dar de baja / reactivar ──
  function handleToggleActive(emp: EmployeeRow) {
    const action = emp.active ? 'dar de baja' : 'reactivar';
    if (!confirm(`¿Deseas ${action} a ${emp.name}?`)) return;
    startTransition(async () => {
      try {
        await updateEmployee(emp.id, { active: !emp.active });
        await loadEmployees();
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  // ── Helper ──
  function field(label: string, key: keyof EmployeeFormData, opts?: {
    type?: string;
    required?: boolean;
    placeholder?: string;
  }) {
    return (
      <div>
        <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
          {label} {opts?.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={opts?.type ?? 'text'}
          placeholder={opts?.placeholder}
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          required={opts?.required}
          className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Catálogo de Empleados</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Alta, edición y baja de colaboradores. Base para cálculo de nómina.
              </p>
            </div>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
          >
            <UserPlus className="h-4 w-4" /> Nuevo Empleado
          </button>
        </header>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <Users className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total Activos</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">
                {employees.filter((e) => e.active).length}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <UserMinus className="h-6 w-6 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">De Baja</p>
              <p className="text-2xl font-black text-neutral-500">
                {employees.filter((e) => !e.active).length}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Banknote className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total Headcount</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">
                {employees.length}
              </p>
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && !showModal && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── TABLA ── */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 flex-1 max-w-xs">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-neutral-900 dark:text-white flex-1"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 font-medium">Sin empleados registrados</p>
              <p className="text-neutral-400 text-sm mt-1">Agrega el primer empleado con el botón "Nuevo Empleado"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                  <tr>
                    <th className="px-6 py-3">Empleado</th>
                    <th className="px-6 py-3">Departamento</th>
                    <th className="px-6 py-3">Contacto</th>
                    <th className="px-6 py-3">Ingreso</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${!emp.active ? 'opacity-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-neutral-900 dark:text-white">{emp.name}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{emp.position}</p>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                        {emp.department ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        {emp.email && <p className="text-xs text-neutral-600 dark:text-neutral-400">{emp.email}</p>}
                        {emp.phone && <p className="text-xs text-neutral-500">{emp.phone}</p>}
                        {!emp.email && !emp.phone && <span className="text-neutral-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500">
                        {new Date(emp.hireDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                          emp.active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                        }`}>
                          {emp.active ? 'Activo' : 'Baja'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(emp)}
                            className="p-2 rounded-lg text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(emp)}
                            disabled={isPending}
                            className={`p-2 rounded-lg transition-colors ${
                              emp.active
                                ? 'text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                                : 'text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                            }`}
                            title={emp.active ? 'Dar de baja' : 'Reactivar'}
                          >
                            {emp.active ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── MODAL ── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                  {editingId ? 'Editar Empleado' : 'Nuevo Empleado'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* Datos personales */}
                <div>
                  <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-3">Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {field('Nombre completo', 'name', { required: true, placeholder: 'Juan Pérez López' })}
                    {!editingId && field('CURP', 'curp', { required: true, placeholder: 'PELJ800101HDFRZN04' })}
                    {!editingId && field('RFC personal', 'rfc', { placeholder: 'PELJ800101ABC' })}
                    {field('Email', 'email', { type: 'email', placeholder: 'juan@empresa.com' })}
                    {field('Teléfono', 'phone', { placeholder: '5512345678' })}
                  </div>
                </div>

                {/* Datos laborales */}
                <div>
                  <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-3">Datos Laborales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {field('Puesto / Título', 'position', { required: true, placeholder: 'Desarrollador Senior' })}
                    {field('Departamento', 'department', { placeholder: 'Tecnología' })}
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        Fecha de ingreso <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.hireDate}
                        onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))}
                        required
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Nómina */}
                <div>
                  <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-3">Nómina</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        Salario {!editingId && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="number"
                        placeholder="15000.00"
                        value={form.salary}
                        onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                        required={!editingId}
                        min={1}
                        step={0.01}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        Tipo de nómina
                      </label>
                      <select
                        value={form.salaryType}
                        onChange={(e) => setForm((f) => ({ ...f, salaryType: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="MENSUAL">Mensual</option>
                        <option value="QUINCENAL">Quincenal</option>
                      </select>
                    </div>
                    {!editingId && field('No. IMSS', 'imssNumber', { placeholder: '12345678901' })}
                    {field('CLABE bancaria', 'bankAccount', { placeholder: '123456789012345678' })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    {isPending ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar empleado'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
