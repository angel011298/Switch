'use client';

import { useState, useMemo } from 'react';
import {
  History, Search, Download, RefreshCw, Eye, AlertTriangle,
  Info, ShieldAlert, Calendar, Database, Activity, Lock
} from 'lucide-react';

type Severity = 'info' | 'warning' | 'critical';

interface AuditLog {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ip: string;
  userAgent: string;
  severity: Severity;
  createdAt: string;
}

export default function AuditoriaClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const days = 30;
      const url = `/api/admin/audit-logs?days=${days}&limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        !searchTerm ||
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSeverity = severityFilter === 'all' || log.severity === severityFilter;

      const matchTab =
        activeTab === 'general' ||
        (activeTab === 'security' && ['ACCESS_DENIED', 'ROLE_CHANGE', 'USER_INVITE', 'USER_REMOVE'].includes(log.action));

      return matchSearch && matchSeverity && matchTab;
    });
  }, [logs, searchTerm, severityFilter, activeTab]);

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'info':     return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'warning':  return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }
  };

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'info':     return <Info className="h-4 w-4" />;
      case 'warning':  return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <ShieldAlert className="h-4 w-4" />;
    }
  };

  const handleExportCsv = () => {
    const header = 'ID,Fecha,Actor,Email,Accion,Recurso,RecursoID,Severidad,IP';
    const rows = filtered.map((l) =>
      [l.id, l.createdAt, `"${l.actorName}"`, l.actorEmail, l.action, l.resource, l.resourceId, l.severity, l.ip].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ENCABEZADO */}
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
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm"
            >
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

        {/* TABS */}
        <div className="flex space-x-2 bg-white dark:bg-neutral-900 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {[
            { id: 'general',  label: 'Registros Generales', icon: Database },
            { id: 'security', label: 'Seguridad y Roles',   icon: ShieldAlert },
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

        {/* FILTROS */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o recurso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <Activity className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="pl-12 pr-8 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none appearance-none shadow-sm cursor-pointer"
            >
              <option value="all">Todas las severidades</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <History className="h-12 w-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 font-medium">No hay registros que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-black/50 text-neutral-500 text-xs uppercase tracking-widest border-b border-neutral-200 dark:border-neutral-800">
                    <th className="p-4 font-black">Severidad</th>
                    <th className="p-4 font-black">Timestamp</th>
                    <th className="p-4 font-black">Actor</th>
                    <th className="p-4 font-black">Acción</th>
                    <th className="p-4 font-black">Recurso</th>
                    <th className="p-4 font-black">IP</th>
                    <th className="p-4 font-black text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${getSeverityColor(log.severity)}`}>
                          {getSeverityIcon(log.severity)} {log.severity}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(log.createdAt).toLocaleString('es-MX')}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-neutral-900 dark:text-white">{log.actorName}</p>
                        <p className="text-xs text-neutral-500">{log.actorEmail}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-mono bg-neutral-100 dark:bg-black px-2 py-1 rounded text-neutral-700 dark:text-neutral-300 font-bold text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-neutral-700 dark:text-neutral-300">{log.resource}</p>
                        <p className="text-xs font-mono text-neutral-500">{log.resourceId}</p>
                      </td>
                      <td className="p-4 font-mono text-xs text-neutral-500">{log.ip}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors inline-flex items-center gap-2 font-bold text-xs"
                        >
                          <Eye className="h-4 w-4" /> Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODAL FORENSE */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-black/50">
              <div>
                <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  Análisis Forense <span className="text-neutral-400 font-mono text-sm font-normal">#{selectedLog.id.slice(0, 8)}</span>
                </h2>
                <p className="text-sm text-neutral-500 font-mono mt-1">{new Date(selectedLog.createdAt).toLocaleString('es-MX')}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 bg-neutral-200 dark:bg-neutral-800 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Actor',    value: selectedLog.actorName },
                  { label: 'Acción',   value: selectedLog.action },
                  { label: 'Recurso',  value: selectedLog.resourceId || '—' },
                  { label: 'IP',       value: selectedLog.ip || '—' },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-1">{item.label}</p>
                    <p className="font-bold text-neutral-900 dark:text-white text-sm font-mono">{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white mb-3">Trazabilidad de Datos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-red-500/20 overflow-hidden">
                    <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/20">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Estado Anterior (Old Data)</p>
                    </div>
                    <div className="bg-neutral-50 dark:bg-[#0a0a0a] p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        {selectedLog.oldData ? JSON.stringify(selectedLog.oldData, null, 2) : 'null'}
                      </pre>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 overflow-hidden">
                    <div className="bg-emerald-500/10 px-4 py-2 border-b border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Estado Nuevo (New Data)</p>
                    </div>
                    <div className="bg-neutral-50 dark:bg-[#0a0a0a] p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        {selectedLog.newData ? JSON.stringify(selectedLog.newData, null, 2) : 'null'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
              {selectedLog.userAgent && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white mb-3">Dispositivo</h3>
                  <div className="bg-neutral-50 dark:bg-black p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 break-words">{selectedLog.userAgent}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
