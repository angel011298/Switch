'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserCheck, MapPin, Clock, Loader2, Building2, 
  FileText, Award, Network, MessageSquare, ShieldCheck, 
  Banknote, Download, ArrowRight, Activity 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function RRHHPage() {
  const [activeTab, setActiveTab] = useState<'reloj' | 'nomina' | 'organizacion' | 'desarrollo' | 'documentos'>('reloj');
  const [horaActual, setHoraActual] = useState('');
  const [registros, setRegistros] = useState<any[]>([]);
  const [totalEmpleados, setTotalEmpleados] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // 1. Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setHoraActual(now.toLocaleTimeString('es-MX', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Consulta de Asistencias Relacional
  const cargarDatosRRHH = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const hoy = new Date().toISOString().split('T')[0];

    if (user) {
      const { count } = await supabase.from('empleados').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setTotalEmpleados(count || 0);

      const { data, error } = await supabase
        .from('asistencias')
        .select(`
          *,
          empleados (
            nombre_completo, id_interno, puesto, departamento,
            horario_asignado, ubicacion_asignada
          )
        `)
        .eq('fecha', hoy)
        .order('hora_entrada', { ascending: false });

      if (!error && data) setRegistros(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { cargarDatosRRHH(); }, [cargarDatosRRHH]);

  const handleCheckOut = async (asistenciaId: string) => {
    const ahora = new Date().toLocaleTimeString('es-MX', { hour12: false });
    const { error } = await supabase
      .from('asistencias')
      .update({ hora_salida: ahora, ubicacion_salida: "Oficina Central (Salida)" })
      .eq('id', asistenciaId);
    if (!error) cargarDatosRRHH();
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="animate-spin text-emerald-500 h-10 w-10" /></div>;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Recursos Humanos (HXM)</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Nómina, Reloj Checador, Cultura y Desarrollo Organizacional.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-mono font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
              <Clock className="h-4 w-4" /> {horaActual}
            </div>
            <button className="flex items-center gap-2 px-6 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-[1.02] transition-all text-sm shadow-md">
              Portal del Colaborador <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* MÉTRICAS GLOBALES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Plantilla Activa</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{totalEmpleados}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl"><UserCheck className="h-6 w-6 text-blue-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">En Turno Hoy</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{registros.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><Activity className="h-6 w-6 text-emerald-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Nómina Próxima</p>
              <p className="text-lg font-black text-neutral-900 dark:text-white mt-1">15 de Marzo</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl"><Banknote className="h-6 w-6 text-amber-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Evaluaciones</p>
              <p className="text-lg font-black text-neutral-900 dark:text-white mt-1">3 Pendientes</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl"><Award className="h-6 w-6 text-rose-500" /></div>
          </div>
        </div>

        {/* NAVEGACIÓN DE MÓDULOS */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'reloj', label: 'Monitor de Asistencias', icon: Clock },
            { id: 'nomina', label: 'Cálculo de Nómina', icon: Banknote },
            { id: 'organizacion', label: 'Plataforma y Organigrama', icon: Network },
            { id: 'desarrollo', label: 'Desarrollo Organizacional', icon: Award },
            { id: 'documentos', label: 'Expedientes y Contratos', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ÁREA DE CONTENIDO */}
        <main className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[600px] p-6">
          
          {/* 1. RELOJ CHECADOR MAESTRO (10 Columnas Restauradas) */}
          {activeTab === 'reloj' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Reloj Checador Maestro</h2>
                  <p className="text-neutral-500 font-bold uppercase text-xs tracking-widest mt-1">Control Detallado de 10 Columnas</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <Download className="h-4 w-4" /> Exportar a Excel
                </button>
              </div>

              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-black/50 text-[10px] uppercase font-black tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                      <th className="px-4 py-4">1. Empleado</th>
                      <th className="px-3 py-4">2. ID</th>
                      <th className="px-3 py-4">3. Puesto</th>
                      <th className="px-3 py-4">4. Área/Depto</th>
                      <th className="px-3 py-4 text-emerald-600">5. Entrada</th>
                      <th className="px-3 py-4">6. Ubic. Entrada</th>
                      <th className="px-3 py-4 text-rose-600">7. Salida</th>
                      <th className="px-3 py-4">8. Ubic. Salida</th>
                      <th className="px-3 py-4 text-blue-600">9. Horario Asig.</th>
                      <th className="px-3 py-4 text-blue-600">10. Ubic. Asig.</th>
                      <th className="px-3 py-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {registros.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-neutral-400 italic font-bold">Sin actividad registrada el día de hoy.</td>
                      </tr>
                    ) : (
                      registros.map((reg) => (
                        <tr key={reg.id} className="hover:bg-emerald-50/10 dark:hover:bg-neutral-800/40 transition-all font-medium group">
                          {/* 1. Nombre */}
                          <td className="px-4 py-4 font-black text-xs text-neutral-950 dark:text-white uppercase">
                            {reg.empleados?.nombre_completo}
                          </td>
                          {/* 2. ID */}
                          <td className="px-3 py-4 text-[10px] font-mono font-black text-neutral-500">
                            {reg.empleados?.id_interno}
                          </td>
                          {/* 3. Puesto */}
                          <td className="px-3 py-4 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-tighter">
                            {reg.empleados?.puesto}
                          </td>
                          {/* 4. Área */}
                          <td className="px-3 py-4 text-[10px] font-black text-neutral-500">
                            {reg.empleados?.departamento}
                          </td>
                          {/* 5. Entrada */}
                          <td className="px-3 py-4 font-mono font-black text-xs text-emerald-600">
                            {reg.hora_entrada}
                          </td>
                          {/* 6. Ubic Entrada */}
                          <td className="px-3 py-4 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                            <div className="flex items-center gap-1"><MapPin size={10} className="text-emerald-500" />{reg.ubicacion_entrada || 'N/A'}</div>
                          </td>
                          {/* 7. Salida */}
                          <td className="px-3 py-4 font-mono font-black text-xs text-rose-600">
                            {reg.hora_salida || <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] animate-pulse">ACTIVO</span>}
                          </td>
                          {/* 8. Ubic Salida */}
                          <td className="px-3 py-4 text-[10px] text-neutral-500">
                            {reg.ubicacion_salida || (reg.hora_salida ? 'Misma' : '-')}
                          </td>
                          {/* 9. Horario Asignado */}
                          <td className="px-3 py-4">
                            <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md text-[10px] font-black border border-blue-100 dark:border-blue-500/20">
                              {reg.empleados?.horario_asignado}
                            </span>
                          </td>
                          {/* 10. Ubicacion Asignada */}
                          <td className="px-3 py-4 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 underline decoration-emerald-500/30">
                            {reg.empleados?.ubicacion_asignada}
                          </td>
                          {/* Acción */}
                          <td className="px-3 py-4 text-center">
                            {!reg.hora_salida && (
                              <button onClick={() => handleCheckOut(reg.id)} className="bg-neutral-950 dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-rose-600 hover:text-white transition-all shadow-md active:scale-90">
                                LOG-OUT
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ... RESTO DE LAS PESTAÑAS (Nomina, Organizacion, Desarrollo, Documentos) SE MANTIENEN IGUAL ... */}
          
          {/* 2. CÁLCULO DE NÓMINA */}
          {activeTab === 'nomina' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-100">Cálculo de Nómina - Quincena 1 Marzo</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">El sistema ha cruzado las asistencias del Reloj Checador con el salario base para calcular deducciones.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-blue-500/20">
                  Pre-visualizar Nómina
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group">
                  <Banknote className="h-8 w-8 text-neutral-400 mx-auto mb-3 group-hover:text-emerald-500 transition-colors" />
                  <h4 className="font-bold text-neutral-900 dark:text-white">Incidencias y Bonos</h4>
                  <p className="text-xs text-neutral-500 mt-1">Aprobar horas extras y comisiones.</p>
                </div>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group">
                  <FileText className="h-8 w-8 text-neutral-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                  <h4 className="font-bold text-neutral-900 dark:text-white">Timbrado de Recibos</h4>
                  <p className="text-xs text-neutral-500 mt-1">Generación masiva de CFDI de Nómina.</p>
                </div>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group">
                  <Building2 className="h-8 w-8 text-neutral-400 mx-auto mb-3 group-hover:text-amber-500 transition-colors" />
                  <h4 className="font-bold text-neutral-900 dark:text-white">Dispersión Bancaria</h4>
                  <p className="text-xs text-neutral-500 mt-1">Exportar archivo .TXT para el banco.</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. PLATAFORMA Y ORGANIZACIÓN */}
          {activeTab === 'organizacion' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in duration-300">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-full mb-4 border border-emerald-100 dark:border-emerald-500/20">
                <Network className="h-12 w-12 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Estructura Organizacional</h2>
              <p className="text-neutral-500 text-sm max-w-md mb-6">
                Gestiona la jerarquía de la empresa, perfiles de acceso (RBAC) y los flujos de aprobación (Workflows) para vacaciones y permisos.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700">Ver Organigrama</button>
                <button className="px-6 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700">Gestionar Workflows</button>
              </div>
            </div>
          )}

          {/* 4. DESARROLLO ORGANIZACIONAL (Cultura) */}
          {activeTab === 'desarrollo' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-neutral-50 dark:bg-black">
                  <Award className="h-6 w-6 text-rose-500 mb-4" />
                  <h3 className="font-black text-neutral-900 dark:text-white text-lg">Evaluaciones de Desempeño</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-4 leading-relaxed">Configura evaluaciones 360°, encuestas de clima laboral y objetivos OKR.</p>
                  <button className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">Crear nueva campaña</button>
                </div>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-neutral-50 dark:bg-black">
                  <MessageSquare className="h-6 w-6 text-blue-500 mb-4" />
                  <h3 className="font-black text-neutral-900 dark:text-white text-lg">Cultura y Comunicación</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-4 leading-relaxed">Muro de anuncios, reconocimientos públicos y encuestas de pulso.</p>
                  <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Ir al Portal Interno</button>
                </div>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-neutral-50 dark:bg-black md:col-span-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" /> Canal de Denuncias Seguro
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">Buzón anónimo para cumplimiento de normativas laborales.</p>
                  </div>
                  <button className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold">Ver Reportes</button>
                </div>
              </div>
            </div>
          )}

          {/* 5. DOCUMENTOS Y EXPEDIENTES */}
          {activeTab === 'documentos' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in duration-300">
              <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-full mb-4 border border-amber-100 dark:border-amber-500/20">
                <FileText className="h-12 w-12 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Gestor Documental y Onboarding</h2>
              <p className="text-neutral-500 text-sm max-w-md mb-6">
                Generación automática de contratos laborales, envío para firma digital y gestión de activos asignados.
              </p>
              <button className="px-6 py-3 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl text-sm hover:scale-[1.02] transition-transform shadow-lg">
                Iniciar Onboarding de Nuevo Ingreso
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}