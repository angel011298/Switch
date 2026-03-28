'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  History, Search, Download, RefreshCw, Eye, AlertTriangle, 
  Info, ShieldAlert, Calendar, Database, Activity, FileText, Lock
} from 'lucide-react';

// --- TIPOS DE DATOS ---
type Severity = 'info' | 'warning' | 'critical';

interface AuditLog {
  id: string;
  created_at: string;
  actor_name: string;
  actor_email: string;
  action: string;
  module: string;
  resource_id: string;
  ip_address: string;
  severity: Severity;
  old_data?: any;
  new_data?: any;
  user_agent?: string;
}

export default function AuditLogsPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'health' | 'retention'>('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Datos simulados para ilustrar la UI (En producción, esto viene de Supabase)
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: 'log-9982', created_at: '2026-03-12T10:45:21.000Z', actor_name: 'Angel Ortiz', actor_email: '553angelortiz@gmail.com',
      action: 'UPDATE_PLAN', module: 'Suscripciones', resource_id: 'org-445', ip_address: '189.215.45.12', severity: 'warning',
      old_data: { plan: 'basic', price: 499 }, new_data: { plan: 'full', price: 0 }, user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0'
    },
    {
      id: 'log-9981', created_at: '2026-03-12T09:12:05.000Z', actor_name: 'Sistema Automático', actor_email: 'system@switch.com',
      action: 'DELETE_INVOICE', module: 'Facturación', resource_id: 'cfdi-8821', ip_address: 'Internal', severity: 'critical',
      old_data: { folio: 'F-102', total: 15000.00, status: 'vigente' }, new_data: null, user_agent: 'CIFRA/Backend-Worker'
    },
    {
      id: 'log-9980', created_at: '2026-03-11T16:30:00.000Z', actor_name: 'Carlos Ruiz', actor_email: 'carlos@cliente.com',
      action: 'LOGIN_SUCCESS', module: 'Autenticación', resource_id: 'user-carlos', ip_address: '201.140.11.9', severity: 'info',
      old_data: null, new_data: { login_method: 'password' }, user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'
    },
    {
      id: 'log-9979', created_at: '2026-03-11T16:29:45.000Z', actor_name: 'Desconocido', actor_email: 'carlos@cliente.com',
      action: 'LOGIN_FAIL', module: 'Seguridad', resource_id: 'user-carlos', ip_address: '45.33.22.11', severity: 'warning',
      old_data: null, new_data: { reason: 'invalid_password', attempts: 4 }, user_agent: 'Python-urllib/3.9'
    }
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
    // Aquí iría el fetch real: supabase.from('audit_logs').select('*')
  };

  // --- RENDERIZADORES DE UI ---
  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'info': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }
  };

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'info': return <Info className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <ShieldAlert className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* ENCABEZADO Y GARANTÍA LEGAL */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-neutral-100 dark:bg-black p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <History className="h-8 w-8 text-neutral-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Auditoría Forense</h1>
              <div className="flex items-center gap-2 mt-1">
                <Lock className="h-3 w-3 text-emerald-500" />
                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
                  Registro Inmutable • Solo Lectura
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm">
              <FileText className="h-4 w-4" /> Exportar PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm">
              <Download className="h-4 w-4" /> CSV
            </button>
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all text-sm shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              Refrescar
            </button>
          </div>
        </header>

        {/* NAVEGACIÓN DE PESTAÑAS */}
        <div className="flex space-x-2 bg-white dark:bg-neutral-900 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {[
            { id: 'general', label: 'Registros Generales', icon: Database },
            { id: 'security', label: 'Logs de Seguridad', icon: ShieldAlert },
            { id: 'health', label: 'Salud del Sistema', icon: Activity },
            { id: 'retention', label: 'Políticas de Retención', icon: Archive },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-black shadow-md' 
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* BARRA DE FILTROS */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID, Usuario, Acción o IP..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400" />
            <select className="pl-12 pr-8 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none appearance-none shadow-sm cursor-pointer">
              <option>Últimas 24 horas</option>
              <option>Últimos 7 días</option>
              <option>Este mes</option>
              <option>Rango personalizado...</option>
            </select>
          </div>
        </div>

        {/* TABLA PRINCIPAL DE ALTA DENSIDAD */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-neutral-50 dark:bg-black/50 text-neutral-500 text-xs uppercase tracking-widest border-b border-neutral-200 dark:border-neutral-800">
                  <th className="p-4 font-black">Severidad</th>
                  <th className="p-4 font-black">Timestamp (ISO)</th>
                  <th className="p-4 font-black">Actor / Usuario</th>
                  <th className="p-4 font-black">Acción</th>
                  <th className="p-4 font-black">Módulo / Recurso</th>
                  <th className="p-4 font-black">Dirección IP</th>
                  <th className="p-4 font-black text-right">Forense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${getSeverityColor(log.severity)}`}>
                        {getSeverityIcon(log.severity)} {log.severity}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                      {log.created_at}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-neutral-900 dark:text-white">{log.actor_name}</p>
                      <p className="text-xs text-neutral-500">{log.actor_email}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-mono bg-neutral-100 dark:bg-black px-2 py-1 rounded text-neutral-700 dark:text-neutral-300 font-bold text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-neutral-700 dark:text-neutral-300">{log.module}</p>
                      <p className="text-xs font-mono text-neutral-500">{log.resource_id}</p>
                    </td>
                    <td className="p-4 font-mono text-xs text-neutral-500">
                      {log.ip_address}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors inline-flex items-center gap-2 font-bold text-xs"
                      >
                        <Eye className="h-4 w-4" /> Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL FORENSE (VISTA DE DETALLE) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-black/50">
              <div>
                <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  Análisis Forense de Evento <span className="text-neutral-400 font-mono text-sm font-normal">#{selectedLog.id}</span>
                </h2>
                <p className="text-sm text-neutral-500 font-mono mt-1">{selectedLog.created_at}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 bg-neutral-200 dark:bg-neutral-800 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Metadatos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Actor</p>
                  <p className="font-bold text-neutral-900 dark:text-white text-sm">{selectedLog.actor_name}</p>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Acción</p>
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{selectedLog.action}</p>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Recurso ID</p>
                  <p className="font-mono text-neutral-900 dark:text-white text-sm">{selectedLog.resource_id}</p>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Dirección IP</p>
                  <p className="font-mono text-neutral-900 dark:text-white text-sm">{selectedLog.ip_address}</p>
                </div>
              </div>

              {/* Comparativa JSON (Antes / Después) */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white mb-3">Trazabilidad de Datos (Payload)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Estado Anterior */}
                  <div className="rounded-2xl border border-red-500/20 overflow-hidden">
                    <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/20">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Estado Anterior (Old Data)</p>
                    </div>
                    <div className="bg-neutral-50 dark:bg-[#0a0a0a] p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        {selectedLog.old_data ? JSON.stringify(selectedLog.old_data, null, 2) : 'null (Registro Nuevo)'}
                      </pre>
                    </div>
                  </div>

                  {/* Estado Nuevo */}
                  <div className="rounded-2xl border border-emerald-500/20 overflow-hidden">
                    <div className="bg-emerald-500/10 px-4 py-2 border-b border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Estado Nuevo (New Data)</p>
                    </div>
                    <div className="bg-neutral-50 dark:bg-[#0a0a0a] p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        {selectedLog.new_data ? JSON.stringify(selectedLog.new_data, null, 2) : 'null (Registro Eliminado)'}
                      </pre>
                    </div>
                  </div>

                </div>
              </div>

              {/* Info Técnica Adicional */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white mb-3">Información de Red y Dispositivo</h3>
                <div className="bg-neutral-50 dark:bg-black p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-bold text-neutral-500 mb-1">User-Agent</p>
                  <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 break-words">{selectedLog.user_agent}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Icono auxiliar para Retención (Faltaba importar)
function Archive(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"></polyline>
      <rect x="1" y="3" width="22" height="5"></rect>
      <line x1="10" y1="12" x2="14" y2="12"></line>
    </svg>
  );
}