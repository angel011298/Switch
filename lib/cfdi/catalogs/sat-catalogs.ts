/**
 * CIFRA — Catálogos SAT para CFDI 4.0
 * =========================================
 * Subconjuntos de los catálogos oficiales del Anexo 20.
 * Solo incluimos los más comunes para validación.
 */

// c_FormaPago — Formas de pago
export const FORMA_PAGO: Record<string, string> = {
  '01': 'Efectivo',
  '02': 'Cheque nominativo',
  '03': 'Transferencia electrónica de fondos',
  '04': 'Tarjeta de crédito',
  '05': 'Monedero electrónico',
  '06': 'Dinero electrónico',
  '08': 'Vales de despensa',
  '12': 'Dación en pago',
  '13': 'Pago por subrogación',
  '14': 'Pago por consignación',
  '15': 'Condonación',
  '17': 'Compensación',
  '23': 'Novación',
  '24': 'Confusión',
  '25': 'Remisión de deuda',
  '26': 'Prescripción o caducidad',
  '27': 'A satisfacción del acreedor',
  '28': 'Tarjeta de débito',
  '29': 'Tarjeta de servicios',
  '30': 'Aplicación de anticipos',
  '31': 'Intermediario pagos',
  '99': 'Por definir',
};

// c_UsoCFDI — Uso del CFDI
export const USO_CFDI: Record<string, string> = {
  'G01': 'Adquisición de mercancías',
  'G02': 'Devoluciones, descuentos o bonificaciones',
  'G03': 'Gastos en general',
  'I01': 'Construcciones',
  'I02': 'Mobiliario y equipo de oficina por inversiones',
  'I03': 'Equipo de transporte',
  'I04': 'Equipo de cómputo y accesorios',
  'I05': 'Dados, troqueles, moldes, matrices y herramental',
  'I06': 'Comunicaciones telefónicas',
  'I07': 'Comunicaciones satelitales',
  'I08': 'Otra maquinaria y equipo',
  'D01': 'Honorarios médicos, dentales y gastos hospitalarios',
  'D02': 'Gastos médicos por incapacidad o discapacidad',
  'D03': 'Gastos funerales',
  'D04': 'Donativos',
  'D05': 'Intereses reales efectivamente pagados por créditos hipotecarios',
  'D06': 'Aportaciones voluntarias al SAR',
  'D07': 'Primas por seguros de gastos médicos',
  'D08': 'Gastos de transportación escolar obligatoria',
  'D09': 'Depósitos en cuentas para el ahorro, primas de pensiones',
  'D10': 'Pagos por servicios educativos (colegiaturas)',
  'S01': 'Sin efectos fiscales',
  'CP01': 'Pagos',
  'CN01': 'Nómina',
};

// c_Moneda — Monedas
export const MONEDA: Record<string, string> = {
  'MXN': 'Peso Mexicano',
  'USD': 'Dólar americano',
  'EUR': 'Euro',
  'XXX': 'Los códigos asignados para transacciones en que intervenga ninguna moneda',
};

// c_Exportacion
export const EXPORTACION: Record<string, string> = {
  '01': 'No aplica',
  '02': 'Definitiva',
  '03': 'Temporal',
  '04': 'Definitiva con clave distinta a A1 o con Complemento de Comercio Exterior',
};

// c_ObjetoImp — Objeto del impuesto
export const OBJETO_IMP: Record<string, string> = {
  '01': 'No objeto de impuesto',
  '02': 'Sí objeto de impuesto',
  '03': 'Sí objeto del impuesto y no obligado al desglose',
  '04': 'Sí objeto del impuesto y no causa impuesto',
};

// Mapeo TaxType interno → clave SAT c_Impuesto
export const TAX_TYPE_TO_SAT: Record<string, string> = {
  'ISR': '001',
  'IVA': '002',
  'IEPS': '003',
  'RETENCION_ISR': '001',
  'RETENCION_IVA': '002',
};

// c_TipoFactor
export const TIPO_FACTOR = {
  TASA: 'Tasa',
  CUOTA: 'Cuota',
  EXENTO: 'Exento',
} as const;
