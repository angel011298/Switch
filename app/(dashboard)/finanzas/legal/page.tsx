'use client';

import { useState } from 'react';
import { 
  Scale, FileSignature, Cloud, ShieldAlert, Link as LinkIcon, 
  Eye, Lock, Clock, AlertTriangle, FileText, CheckCircle2, 
  Download, RefreshCw, Send, ShieldCheck, Fingerprint, Network,
  EyeOff, FolderLock, FileKey2
} from 'lucide-react';

export default function LegalModulePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'repositorio' | 'workflow' | 'auditoria'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncCloud = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2500);
  };

  // Datos simulados para demostrar la correlación legal-financiera y los 3 niveles de seguridad
  const documentos = [
    {
      id: 'DOC-992',
      titulo: 'Contrato Marco de Suministro',
      tipo: 'Proveedor',
      contraparte: 'Constructora Horizonte S.A.',
      nivelSec: 'L1',
      estatus: 'Vigente',
      vinculoFinanzas: 'F-1042',
      cloud: 'SharePoint',
      vencimiento: '2027-12-31'
    },
    {
      id: 'DOC-1004',
      titulo: 'NDA - Proyecto Fénix',
      tipo: 'Confidencialidad',
      contraparte: 'Servicios Logísticos del Norte',
      nivelSec: 'L2',
      estatus: 'Pendiente Firma',
      vinculoFinanzas: 'N/A',
      cloud: 'OneDrive',
      vencimiento: '2026-06-15'
    },
    {
      id: 'DOC-1005',
      titulo: 'Acta Constitutiva y Fusión',
      tipo: 'Corporativo',
      contraparte: 'CIFRA Demo S.A.P.I.',
      nivelSec: 'L3',
      estatus: 'Vigente',
      vinculoFinanzas: 'Global',
      cloud: 'Drive Privado',
      vencimiento: 'Indefinido'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
              <Scale className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Legal y Corporate</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Bóveda ABAC, Firmas Digitales y Correlación Financiera.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSyncCloud}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm"
            >
              <Cloud className="h-4 w-4" /> 
              {isSyncing ? 'Verificando Links...' : 'Sincronizar Repositorio'}
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm">
              <LinkIcon className="h-4 w-4" /> Nuevo Vínculo Legal
            </button>
          </div>
        </header>

        {/* TOP METRICS & DASHBOARD DE SALUD LEGAL */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Firmas Pendientes</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">4</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform"><FileSignature className="h-6 w-6 text-amber-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Expiran (90 días)</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">2</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl group-hover:scale-110 transition-transform"><Clock className="h-6 w-6 text-rose-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Golden Records</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">128</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform"><LinkIcon className="h-6 w-6 text-emerald-500" /></div>
          </div>
          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-indigo-950 dark:to-black p-5 rounded-2xl border border-neutral-800 dark:border-indigo-500/30 flex items-center justify-between text-white">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Accesos L3 Bloqueados</p>
              <p className="text-2xl font-black text-white mt-1">12</p>
            </div>
            <div className="p-3 bg-neutral-800 dark:bg-indigo-500/20 rounded-xl"><ShieldAlert className="h-6 w-6 text-indigo-400" /></div>
          </div>
        </div>

        {/* CONTENEDOR DE PESTAÑAS */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[500px] overflow-hidden">
          
          <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50 p-2 gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard Legal' },
              { id: 'repositorio', label: 'Repositorio Inteligente' },
              { id: 'workflow', label: 'Flujo de Firmas (VoBo)' },
              { id: 'auditoria', label: 'Auditoría y Permisos (ABAC)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-neutral-200 dark:border-neutral-800' 
                    : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            
            {/* 1. REPOSITORIO INTELIGENTE (GOLDEN RECORD Y NIVELES) */}
            {activeTab === 'repositorio' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/20">L1: Operativo</span>
                    <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-500/20">L2: Confidencial</span>
                    <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-500/20"><Lock className="inline h-3 w-3 mr-1"/>L3: Corporativo</span>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs hover:scale-[1.02] transition-transform">
                    <Download className="h-4 w-4" /> Exportar Expediente Legal (Due Diligence)
                  </button>
                </div>

                <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  <table className="min-w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400">Documento / Contraparte</th>
                        <th className="p-4 font-bold text-center text-neutral-600 dark:text-neutral-400">Seguridad</th>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400">Golden Record (Finanzas)</th>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400">Nube</th>
                        <th className="p-4 font-bold text-center text-neutral-600 dark:text-neutral-400">Estatus</th>
                        <th className="p-4 font-bold text-right">Acciones (Proxy)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {documentos.map((doc, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group">
                          <td className="p-4">
                            <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                              {doc.titulo} 
                              {doc.nivelSec === 'L3' && <Lock className="h-3 w-3 text-indigo-500" />}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{doc.id} • {doc.tipo} • {doc.contraparte}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              doc.nivelSec === 'L1' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                              doc.nivelSec === 'L2' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                              'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                            }`}>
                              {doc.nivelSec}
                            </span>
                          </td>
                          <td className="p-4">
                            {doc.vinculoFinanzas !== 'N/A' && doc.vinculoFinanzas !== 'Global' ? (
                              <span className="flex items-center gap-1 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded w-fit cursor-pointer hover:underline">
                                <LinkIcon className="h-3 w-3" /> Factura {doc.vinculoFinanzas}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400 font-medium">{doc.vinculoFinanzas}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="flex items-center gap-1 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                              <Cloud className="h-3 w-3" /> {doc.cloud}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`flex items-center justify-center gap-1 text-xs font-bold ${doc.estatus === 'Vigente' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {doc.estatus === 'Vigente' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />} {doc.estatus}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1.5 rounded-lg transition text-xs border border-neutral-200 dark:border-neutral-800 inline-flex items-center gap-1" title="Abre con Marca de Agua Dinámica">
                              <Eye className="h-3 w-3" /> Previsualizar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. FLUJO DE FIRMAS Y WORKFLOW */}
            {activeTab === 'workflow' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-100">Panel de Firmas Pendientes</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Integración API simulada con DocuSign / Adobe Sign.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Borrador / VoBo */}
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <h4 className="font-black text-neutral-500 uppercase tracking-widest text-xs mb-4 flex items-center justify-between">
                      En Revisión (VoBo) <span className="bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300">1</span>
                    </h4>
                    <div className="bg-white dark:bg-black p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                      <p className="font-bold text-neutral-900 dark:text-white text-sm">Adendum Proveedores v2</p>
                      <p className="text-xs text-neutral-500 mt-1 mb-3">Responsable: Dirección de Finanzas</p>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-emerald-50 text-emerald-600 text-xs font-bold py-1.5 rounded-lg border border-emerald-200">Aprobar</button>
                        <button className="flex-1 bg-rose-50 text-rose-600 text-xs font-bold py-1.5 rounded-lg border border-rose-200">Rechazar</button>
                      </div>
                    </div>
                  </div>

                  {/* Pendiente de Firma */}
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/30">
                    <h4 className="font-black text-amber-600 uppercase tracking-widest text-xs mb-4 flex items-center justify-between">
                      Pendiente de Firma <span className="bg-amber-200 dark:bg-amber-800/50 px-2 py-0.5 rounded text-amber-800 dark:text-amber-200">1</span>
                    </h4>
                    <div className="bg-white dark:bg-black p-4 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm border-l-4 border-l-amber-500">
                      <p className="font-bold text-neutral-900 dark:text-white text-sm">NDA - Proyecto Fénix</p>
                      <p className="text-xs text-neutral-500 mt-1">Balón en cancha de: <span className="font-bold text-neutral-700 dark:text-neutral-300">Cliente Externo</span></p>
                      <p className="text-[10px] text-amber-600 font-mono mt-1 mb-3"><Clock className="inline h-3 w-3 mr-1"/>En espera desde hace 4 días</p>
                      <button className="w-full flex items-center justify-center gap-1 bg-neutral-950 dark:bg-white text-white dark:text-black text-xs font-bold py-2 rounded-lg transition-transform hover:scale-[1.02]">
                        <Send className="h-3 w-3" /> Enviar Recordatorio
                      </button>
                    </div>
                  </div>

                  {/* Resguardo Automático */}
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/30">
                    <h4 className="font-black text-emerald-600 uppercase tracking-widest text-xs mb-4 flex items-center justify-between">
                      Resguardados Recientes
                    </h4>
                    <div className="bg-white dark:bg-black p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm opacity-70">
                      <p className="font-bold text-neutral-900 dark:text-white text-sm line-through decoration-emerald-500">Contrato Arrendamiento</p>
                      <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Movido a SharePoint</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SEGURIDAD Y AUDITORÍA (ABAC / RBAC) */}
            {activeTab === 'auditoria' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Logs de Auditoría */}
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50 dark:bg-black">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-5 w-5 text-indigo-500" />
                        <h3 className="font-bold text-neutral-900 dark:text-white">Logs Inmutables (Object-Level)</h3>
                      </div>
                      <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Activo</span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                      Registro forense de quién visualiza enlaces directos. El ERP funciona como proxy para ofuscar la ruta real del archivo en la nube.
                    </p>
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3 font-mono text-[10px] text-neutral-500">
                      <p><span className="text-emerald-500 font-bold">[ACCESO CONCEDIDO]</span> 14:32:10 - angel@adastra - Previsualizó DOC-992 (L1) desde Factura F-1042.</p>
                      <p><span className="text-emerald-500 font-bold">[ACCESO CONCEDIDO]</span> 14:28:05 - ceo@adastra - Visualizó DOC-1005 (L3). <span className="text-blue-500">Marca de agua dinámica aplicada.</span></p>
                      <p className="text-rose-500"><span className="font-bold">[BLOQUEADO ABAC]</span> 11:15:22 - conta@adastra - Intento de acceso a DOC-1005 (L3). Motivo: Carencia de TAG Corporativo.</p>
                    </div>
                  </div>

                  {/* Motor ABAC (Atributos) */}
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50 dark:bg-black">
                    <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
                      <Network className="h-5 w-5 text-blue-500" /> Reglas de Contexto (ABAC)
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2"><FolderLock className="h-4 w-4 text-rose-500"/> Bloqueo de Nivel 3 (L3)</p>
                          <input type="checkbox" defaultChecked className="accent-indigo-500" />
                        </div>
                        <p className="text-xs text-neutral-500">Restringe Actas y Contratos de Socios. Requiere rol "Super Admin" o tag "Corporate_Access".</p>
                      </div>
                      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2"><EyeOff className="h-4 w-4 text-blue-500"/> Prevención de Pagos sin VoBo</p>
                          <input type="checkbox" defaultChecked className="accent-indigo-500" />
                        </div>
                        <p className="text-xs text-neutral-500">Oculta contratos en estado "Borrador" o "Revisión" al equipo de finanzas para evitar pagos adelantados sin sustento legal.</p>
                      </div>
                      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 opacity-60">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2"><FileKey2 className="h-4 w-4 text-neutral-500"/> Restricción por IP (Red Corporativa)</p>
                          <input type="checkbox" className="accent-indigo-500" />
                        </div>
                        <p className="text-xs text-neutral-500">Exige VPN o IP de oficina para abrir documentos L2 y L3.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}