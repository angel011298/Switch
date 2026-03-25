'use client';

/**
 * Switch OS — Contabilidad (Partida Doble)
 * ==========================================
 * Módulo de contabilidad con:
 * - Importación masiva de XMLs (ZIP)
 * - Generación automática de pólizas
 * - Catálogo de cuentas SAT (Anexo 24)
 * - Balanza de comprobación
 * - Consulta de pólizas
 *
 * Ref: CFF Art. 28, Anexo 24, NIF A-2
 */

import { useEffect, useState, useTransition } from 'react';
import XmlDropzone from '@/components/accounting/XmlDropzone';
import {
  seedChartOfAccounts,
  getAccounts,
  processXmlZip,
  getJournalEntries,
  getTrialBalance,
  getXmlBatches,
} from './actions';

type Tab = 'import' | 'polizas' | 'balanza' | 'catalogo' | 'historial';

export default function ContabilidadPage() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>('import');

  // Estado
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [balance, setBalance] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [catalogReady, setCatalogReady] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verificar catálogo al montar
  useEffect(() => {
    startTransition(async () => {
      const accs = await getAccounts();
      setAccounts(accs);
      setCatalogReady(accs.length > 0);
    });
  }, []);

  function handleSeedCatalog() {
    startTransition(async () => {
      const result = await seedChartOfAccounts();
      if (result.success) {
        const accs = await getAccounts();
        setAccounts(accs);
        setCatalogReady(true);
      }
    });
  }

  function handleFileSelected(file: File) {
    setIsProcessing(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      try {
        const result = await processXmlZip(formData);
        setImportResult(result);
      } catch (err) {
        setImportResult({
          success: false,
          error: err instanceof Error ? err.message : 'Error al procesar ZIP',
        });
      } finally {
        setIsProcessing(false);
      }
    });
  }

  function loadPolizas() {
    startTransition(async () => {
      const data = await getJournalEntries();
      setEntries(data);
    });
  }

  function loadBalance() {
    startTransition(async () => {
      const data = await getTrialBalance();
      setBalance(data);
    });
  }

  function loadBatches() {
    startTransition(async () => {
      const data = await getXmlBatches();
      setBatches(data);
    });
  }

  useEffect(() => {
    if (tab === 'polizas') loadPolizas();
    if (tab === 'balanza') loadBalance();
    if (tab === 'historial') loadBatches();
    if (tab === 'catalogo') {
      startTransition(async () => {
        const accs = await getAccounts();
        setAccounts(accs);
      });
    }
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'import', label: 'Importar XMLs' },
    { key: 'polizas', label: 'Polizas' },
    { key: 'balanza', label: 'Balanza' },
    { key: 'catalogo', label: 'Catalogo' },
    { key: 'historial', label: 'Historial' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Contabilidad</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Partida doble — Polizas automaticas desde XMLs CFDI
        </p>
      </div>

      {/* Alerta: Catálogo no inicializado */}
      {catalogReady === false && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-amber-300 font-medium text-sm">Catalogo de cuentas no inicializado</p>
            <p className="text-amber-400/70 text-xs mt-1">
              Debes crear el catalogo SAT (Anexo 24) antes de importar XMLs
            </p>
          </div>
          <button
            onClick={handleSeedCatalog}
            disabled={isPending}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isPending ? 'Creando...' : 'Crear Catalogo SAT'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-pink-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: Importar XMLs ═══ */}
      {tab === 'import' && (
        <div className="space-y-6">
          <XmlDropzone
            onFileSelected={handleFileSelected}
            isProcessing={isProcessing}
          />

          {importResult && (
            <div className={`rounded-xl border p-6 ${
              importResult.success
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-red-900/20 border-red-500/30'
            }`}>
              {importResult.success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="text-green-300 font-bold">Importacion completada</h3>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">{importResult.totalFiles}</p>
                      <p className="text-xs text-zinc-500">XMLs totales</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-400">{importResult.processed}</p>
                      <p className="text-xs text-zinc-500">Procesados</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-pink-400">{importResult.polizasCreated}</p>
                      <p className="text-xs text-zinc-500">Polizas creadas</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-red-400">{importResult.errors}</p>
                      <p className="text-xs text-zinc-500">Errores</p>
                    </div>
                  </div>

                  {/* Contadores por tipo */}
                  <div className="flex gap-4 text-sm">
                    {importResult.counters.ingresos > 0 && (
                      <span className="text-zinc-400">Ingresos: <strong className="text-white">{importResult.counters.ingresos}</strong></span>
                    )}
                    {importResult.counters.egresos > 0 && (
                      <span className="text-zinc-400">Egresos: <strong className="text-white">{importResult.counters.egresos}</strong></span>
                    )}
                    {importResult.counters.pagos > 0 && (
                      <span className="text-zinc-400">Pagos: <strong className="text-white">{importResult.counters.pagos}</strong></span>
                    )}
                    {importResult.counters.nominas > 0 && (
                      <span className="text-zinc-400">Nominas: <strong className="text-white">{importResult.counters.nominas}</strong></span>
                    )}
                  </div>

                  {/* Errores */}
                  {importResult.errorLog && importResult.errorLog.length > 0 && (
                    <details className="text-sm">
                      <summary className="text-red-400 cursor-pointer">
                        Ver {importResult.errorLog.length} errores
                      </summary>
                      <ul className="mt-2 space-y-1 text-red-300/70 text-xs font-mono max-h-40 overflow-y-auto">
                        {importResult.errorLog.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-300">{importResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Pólizas ═══ */}
      {tab === 'polizas' && (
        <div className="space-y-4">
          {isPending ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500">No hay polizas registradas</p>
              <p className="text-zinc-600 text-sm mt-1">Importa XMLs para generar polizas automaticas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry: any) => (
                <div key={entry.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-zinc-800 text-zinc-300 text-xs font-mono px-2 py-1 rounded">
                        #{entry.entryNumber}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        entry.entryType === 'INGRESO' ? 'bg-green-900/30 text-green-400' :
                        entry.entryType === 'EGRESO' ? 'bg-red-900/30 text-red-400' :
                        entry.entryType === 'AJUSTE' ? 'bg-amber-900/30 text-amber-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {entry.entryType}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(entry.date).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                    <span className={`text-xs ${entry.isBalanced ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.isBalanced ? 'Balanceada' : 'Desbalanceada'}
                    </span>
                  </div>

                  <p className="text-sm text-white mb-3">{entry.concept}</p>

                  {/* Líneas de la póliza */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-zinc-500 text-xs">
                        <th className="text-left pb-1">Cuenta</th>
                        <th className="text-left pb-1">Descripcion</th>
                        <th className="text-right pb-1">Cargo</th>
                        <th className="text-right pb-1">Abono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lines.map((line: any) => (
                        <tr key={line.id} className="border-t border-zinc-800/50">
                          <td className="py-1.5 text-zinc-400 font-mono text-xs">
                            {line.account.code}
                          </td>
                          <td className="py-1.5 text-zinc-300">
                            {line.description || line.account.name}
                          </td>
                          <td className="py-1.5 text-right text-white font-mono">
                            {Number(line.debit) > 0 ? `$${Number(line.debit).toFixed(2)}` : ''}
                          </td>
                          <td className="py-1.5 text-right text-white font-mono">
                            {Number(line.credit) > 0 ? `$${Number(line.credit).toFixed(2)}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-zinc-700 font-bold">
                        <td colSpan={2} className="py-2 text-zinc-400 text-xs">SUMAS IGUALES</td>
                        <td className="py-2 text-right text-white font-mono">
                          ${Number(entry.totalDebit).toFixed(2)}
                        </td>
                        <td className="py-2 text-right text-white font-mono">
                          ${Number(entry.totalCredit).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Balanza de Comprobación ═══ */}
      {tab === 'balanza' && (
        <div>
          {isPending ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : balance.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-800/50 text-zinc-400 text-xs">
                    <th className="text-left px-4 py-3">Codigo</th>
                    <th className="text-left px-4 py-3">Cuenta</th>
                    <th className="text-right px-4 py-3">Cargos</th>
                    <th className="text-right px-4 py-3">Abonos</th>
                    <th className="text-right px-4 py-3">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.map((acc: any) => (
                    <tr key={acc.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="px-4 py-2 text-zinc-400 font-mono text-xs">{acc.code}</td>
                      <td className={`px-4 py-2 text-zinc-300 ${acc.level === 1 ? 'font-bold' : acc.level === 2 ? 'pl-8' : 'pl-12 text-xs'}`}>
                        {acc.name}
                      </td>
                      <td className="px-4 py-2 text-right text-white font-mono">
                        {acc.debitBalance > 0 ? `$${acc.debitBalance.toFixed(2)}` : ''}
                      </td>
                      <td className="px-4 py-2 text-right text-white font-mono">
                        {acc.creditBalance > 0 ? `$${acc.creditBalance.toFixed(2)}` : ''}
                      </td>
                      <td className={`px-4 py-2 text-right font-mono font-bold ${
                        acc.saldo > 0 ? 'text-green-400' : acc.saldo < 0 ? 'text-red-400' : 'text-zinc-500'
                      }`}>
                        ${Math.abs(acc.saldo).toFixed(2)}
                        {acc.saldo !== 0 && (
                          <span className="text-xs ml-1">{acc.saldo > 0 ? 'D' : 'A'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-700 bg-zinc-800/50 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-zinc-300">TOTALES</td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      ${balance.reduce((s: number, a: any) => s + a.debitBalance, 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      ${balance.reduce((s: number, a: any) => s + a.creditBalance, 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Catálogo de Cuentas ═══ */}
      {tab === 'catalogo' && (
        <div>
          {accounts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500">Catalogo vacio</p>
              <button
                onClick={handleSeedCatalog}
                disabled={isPending}
                className="mt-3 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg"
              >
                Crear Catalogo SAT
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-sm text-zinc-400">{accounts.length} cuentas</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-800/90">
                    <tr className="text-zinc-400 text-xs">
                      <th className="text-left px-4 py-2">Codigo</th>
                      <th className="text-left px-4 py-2">Cuenta</th>
                      <th className="text-left px-4 py-2">Tipo</th>
                      <th className="text-center px-4 py-2">Nivel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc: any) => (
                      <tr key={acc.id} className="border-t border-zinc-800/30 hover:bg-zinc-800/30">
                        <td className="px-4 py-1.5 font-mono text-zinc-400 text-xs">{acc.code}</td>
                        <td className={`px-4 py-1.5 text-zinc-300 ${
                          acc.level === 1 ? 'font-bold text-white' : acc.level === 2 ? 'pl-8' : 'pl-12 text-xs text-zinc-400'
                        }`}>
                          {acc.name}
                        </td>
                        <td className="px-4 py-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            acc.accountType === 'ASSET' ? 'bg-blue-900/30 text-blue-400' :
                            acc.accountType === 'LIABILITY' ? 'bg-red-900/30 text-red-400' :
                            acc.accountType === 'EQUITY' ? 'bg-purple-900/30 text-purple-400' :
                            acc.accountType === 'REVENUE' ? 'bg-green-900/30 text-green-400' :
                            acc.accountType === 'EXPENSE' ? 'bg-amber-900/30 text-amber-400' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {acc.accountType}
                          </span>
                        </td>
                        <td className="px-4 py-1.5 text-center text-zinc-500 text-xs">{acc.level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Historial de Importaciones ═══ */}
      {tab === 'historial' && (
        <div>
          {isPending ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500">No hay importaciones registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch: any) => (
                <div key={batch.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium text-sm">{batch.fileName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        batch.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' :
                        batch.status === 'FAILED' ? 'bg-red-900/30 text-red-400' :
                        'bg-amber-900/30 text-amber-400'
                      }`}>
                        {batch.status}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(batch.createdAt).toLocaleString('es-MX')}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-zinc-400">
                    <span>Total: <strong className="text-white">{batch.totalFiles}</strong></span>
                    <span>OK: <strong className="text-green-400">{batch.processed}</strong></span>
                    <span>Errores: <strong className="text-red-400">{batch.errors}</strong></span>
                    {batch.ingresos > 0 && <span>I:{batch.ingresos}</span>}
                    {batch.egresos > 0 && <span>E:{batch.egresos}</span>}
                    {batch.pagos > 0 && <span>P:{batch.pagos}</span>}
                    {batch.nominas > 0 && <span>N:{batch.nominas}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
