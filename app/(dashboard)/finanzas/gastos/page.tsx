'use client';

import { useCallback, useState, DragEvent, ChangeEvent } from 'react';
import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, Filter, Eye, TrendingDown, 
  Clock, Receipt, FileSpreadsheet, AlertCircle, 
  MoreVertical, Save, Trash2, Loader2
} from 'lucide-react';

// --- Supabase Client setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Tipos y Lógica de Parseo (Tu código intacto) ---
type XmlResumen = {
  id: string;
  nombreArchivo: string;
  uuid: string;
  rfcEmisor: string;
  nombreEmisor: string;
  regimenFiscalEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  usoCfdi: string;
  fechaExpedicion: string;
  fechaTimbrado: string;
  lugarExpedicion: string;
  version: string;
  conceptos: string;
  claveProdServ: string;
  subtotal: string;
  iva: string;
  total: string;
  moneda: string;
  formaPago: string;
  metodoPago: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true 
});

const getVal = (obj: any, keys: string[]) => {
  if (!obj) return 'N/A';
  for (const k of keys) {
    if (obj[k] !== undefined) return String(obj[k]);
  }
  return 'N/A';
};

function extraerDatosDesdeXml(xmlString: string, nombreArchivo: string): XmlResumen {
  const json = parser.parse(xmlString);
  const comprobante = json.Comprobante || {};
  const emisor = comprobante.Emisor || {};
  const receptor = comprobante.Receptor || {};
  const complemento = comprobante.Complemento || {};
  const timbre = complemento.TimbreFiscalDigital || {};
  const impuestos = comprobante.Impuestos || {};
  
  const nodosConcepto = comprobante.Conceptos?.Concepto;
  const arrayConceptos = Array.isArray(nodosConcepto) ? nodosConcepto : (nodosConcepto ? [nodosConcepto] : []);
  
  const descripcionConceptos = arrayConceptos.map((c: any) => c.Descripcion || c.descripcion).join(', ') || 'N/A';
  const clavesProdServ = arrayConceptos.map((c: any) => c.ClaveProdServ || c.claveProdServ).join(', ') || 'N/A';

  return {
    id: `${nombreArchivo}-${getVal(timbre, ['UUID', 'uuid'])}-${Date.now()}`,
    nombreArchivo,
    uuid: getVal(timbre, ['UUID', 'uuid']),
    rfcEmisor: getVal(emisor, ['Rfc', 'rfc', 'RFC']),
    nombreEmisor: getVal(emisor, ['Nombre', 'nombre']),
    regimenFiscalEmisor: getVal(emisor, ['RegimenFiscal', 'regimenFiscal']),
    rfcReceptor: getVal(receptor, ['Rfc', 'rfc', 'RFC']),
    nombreReceptor: getVal(receptor, ['Nombre', 'nombre']),
    usoCfdi: getVal(receptor, ['UsoCFDI', 'usoCFDI']),
    fechaExpedicion: getVal(comprobante, ['Fecha', 'fecha']),
    fechaTimbrado: getVal(timbre, ['FechaTimbrado', 'fechaTimbrado']),
    lugarExpedicion: getVal(comprobante, ['LugarExpedicion', 'lugarExpedicion']),
    version: getVal(comprobante, ['Version', 'version']),
    conceptos: descripcionConceptos.substring(0, 50) + (descripcionConceptos.length > 50 ? '...' : ''),
    claveProdServ: clavesProdServ,
    subtotal: getVal(comprobante, ['SubTotal', 'subTotal']),
    iva: getVal(impuestos, ['TotalImpuestosTrasladados', 'totalImpuestosTrasladados']),
    total: getVal(comprobante, ['Total', 'total']),
    moneda: getVal(comprobante, ['Moneda', 'moneda']),
    formaPago: getVal(comprobante, ['FormaPago', 'formaPago']),
    metodoPago: getVal(comprobante, ['MetodoPago', 'metodoPago']),
  };
}

// --- Componente Principal ---
export default function GastosXmlPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [registros, setRegistros] = useState<XmlResumen[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // --- Lógica de Manejo de Archivos ---
  const procesarArchivos = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setProcesando(true);

    const nuevosRegistros: XmlResumen[] = [];

    for (const file of Array.from(files)) {
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension !== 'xml') {
        setError('Solo se permiten archivos con extensión .xml');
        continue;
      }

      try {
        const text = await file.text();
        const resumen = extraerDatosDesdeXml(text, file.name);
        // Validar que realmente sea un CFDI
        if (resumen.uuid === 'N/A') throw new Error('No es un CFDI válido');
        nuevosRegistros.push(resumen);
      } catch (e) {
        console.error(e);
        setError(`Error al leer ${file.name}. Asegúrate de que sea un CFDI válido.`);
      }
    }

    if (nuevosRegistros.length > 0) {
      setRegistros((prev) => [...prev, ...nuevosRegistros]);
    }
    setProcesando(false);
  }, []);

  const handleDrop = useCallback(async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    await procesarArchivos(event.dataTransfer.files);
  }, [procesarArchivos]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    await procesarArchivos(event.target.files);
    event.target.value = '';
  }, [procesarArchivos]);

  const removerRegistro = (id: string) => {
    setRegistros((prev) => prev.filter(r => r.id !== id));
  };

  // --- Lógica de Base de Datos ---
  const handleGuardarEnBoveda = useCallback(async () => {
    if (registros.length === 0) return;
    setGuardando(true);
    setError(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Debes tener una sesión activa para guardar facturas.');
      setGuardando(false);
      return;
    }

    const rowsToInsert = registros.map((row) => ({
      user_id: user.id,
      uuid_fiscal: row.uuid,
      rfc_emisor: row.rfcEmisor,
      nombre_emisor: row.nombreEmisor,
      regimen_fiscal_emisor: row.regimenFiscalEmisor,
      rfc_receptor: row.rfcReceptor,
      nombre_receptor: row.nombreReceptor,
      uso_cfdi: row.usoCfdi,
      fecha_expedicion: row.fechaExpedicion,
      fecha_timbrado: row.fechaTimbrado,
      lugar_expedicion: row.lugarExpedicion,
      version: row.version,
      conceptos: row.conceptos,
      clave_prod_serv: row.claveProdServ,
      subtotal: parseFloat(row.subtotal) || 0,
      iva: parseFloat(row.iva) || 0,
      total: parseFloat(row.total) || 0,
      moneda: row.moneda,
      forma_pago: row.formaPago,
      metodo_pago: row.metodoPago,
    }));

    const { error: insertError } = await supabase.from('gastos_xml').insert(rowsToInsert);

    setGuardando(false);

    if (!insertError) {
      alert('¡Facturas guardadas con éxito en tu Bóveda Fiscal!');
      setRegistros([]); 
    } else {
      if (insertError.code === '23505') {
        setError('Error: Al menos una de estas facturas ya había sido guardada anteriormente (UUID duplicado).');
      } else {
        setError(`Error al guardar: ${insertError.message}`);
      }
    }
  }, [registros]);

  // Cálculos dinámicos para los KPIs de la vista previa
  const totalBorrador = registros.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
  const ivaBorrador = registros.reduce((acc, curr) => acc + (parseFloat(curr.iva) || 0), 0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER EMPRESARIAL */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Receipt className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Gastos y Compras</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Motor de lectura de CFDI 4.0 (XML) y cuentas por pagar.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm">
              <FileSpreadsheet className="h-4 w-4" /> Exportar Historial
            </button>
          </div>
        </header>

        {/* ZONA DE CARGA (DRAG & DROP) */}
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
            isDragging 
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
              : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          <input type="file" accept=".xml" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" title="Sube tus XML" />
          
          <div className="p-12 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className={`p-4 rounded-full mb-4 transition-transform duration-300 ${isDragging ? 'scale-110 bg-emerald-100 dark:bg-emerald-500/20' : 'bg-neutral-100 dark:bg-black'}`}>
              <UploadCloud className={`h-10 w-10 ${isDragging ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`} />
            </div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              {isDragging ? '¡Suelta los archivos aquí!' : 'Arrastra tus facturas XML'}
            </h3>
            <p className="text-sm text-neutral-500 max-w-md">
              El sistema extraerá automáticamente el proveedor, montos, impuestos y folio fiscal. Puedes subir múltiples archivos a la vez.
            </p>
            {procesando && (
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando CFDI...
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* VISTA PREVIA Y TABLA DE RESULTADOS */}
        {registros.length > 0 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* KPIs Dinámicos del lote actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total a Guardar ({registros.length} facturas)</p>
                  <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">${totalBorrador.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <TrendingDown className="h-10 w-10 text-emerald-500 opacity-50" />
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-3xl border border-blue-200 dark:border-blue-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">IVA Detectado</p>
                  <p className="text-3xl font-black text-blue-900 dark:text-blue-100">${ivaBorrador.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <Receipt className="h-10 w-10 text-blue-500 opacity-50" />
              </div>
            </div>

            {/* Tabla ERP de Alta Densidad */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-black/50">
                <h2 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Eye className="h-4 w-4 text-neutral-400" /> Vista Previa de Extracción
                </h2>
                <button 
                  onClick={handleGuardarEnBoveda}
                  disabled={guardando}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
                >
                  {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {guardando ? 'Guardando en BD...' : 'Confirmar y Guardar'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-black/50 text-neutral-500 text-[10px] uppercase tracking-widest border-b border-neutral-200 dark:border-neutral-800">
                      <th className="p-4 font-bold">Fecha / Uso</th>
                      <th className="p-4 font-bold">Proveedor (Emisor)</th>
                      <th className="p-4 font-bold">Folio Fiscal (UUID)</th>
                      <th className="p-4 font-bold text-right">Subtotal</th>
                      <th className="p-4 font-bold text-right">IVA</th>
                      <th className="p-4 font-bold text-right text-emerald-600 dark:text-emerald-500">Total</th>
                      <th className="p-4 font-bold text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                    {registros.map((row) => (
                      <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                        <td className="p-4">
                          <p className="font-mono text-neutral-900 dark:text-white">{row.fechaExpedicion.split('T')[0]}</p>
                          <p className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded mt-1 w-fit">{row.usoCfdi}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white truncate max-w-[200px]" title={row.nombreEmisor}>{row.nombreEmisor || 'Sin Razón Social'}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{row.rfcEmisor} • {row.regimenFiscalEmisor}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-[11px] font-mono text-neutral-500 bg-neutral-100 dark:bg-black px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800">{row.uuid}</p>
                        </td>
                        <td className="p-4 text-right text-neutral-600 dark:text-neutral-400 font-medium">
                          ${parseFloat(row.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right text-neutral-600 dark:text-neutral-400 font-medium">
                          ${parseFloat(row.iva).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                          ${parseFloat(row.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => removerRegistro(row.id)}
                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Descartar XML"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}