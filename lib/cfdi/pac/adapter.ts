/**
 * CIFRA — Interfaz del PAC (Proveedor Autorizado de Certificación)
 * =====================================================================
 * Adapter Pattern para desacoplar el motor CFDI del PAC específico.
 *
 * Permite intercambiar entre PAC mock (desarrollo), PAC sandbox (pruebas)
 * y PAC producción sin modificar el código del motor.
 *
 * Ref: CFF Art. 29 fraccion IV — "remitir al SAT el comprobante fiscal
 *      digital por Internet... a través de un proveedor de certificación"
 */

export interface PacStampResult {
  success: boolean;
  uuid: string | null;
  fechaTimbrado: string | null;
  selloSat: string | null;
  noCertificadoSat: string | null;
  rfcProvCertif: string | null;
  xmlTimbrado: string | null;
  error?: string;
}

export interface PacCancelResult {
  success: boolean;
  acuse: string | null;
  error?: string;
}

export interface PacStatusResult {
  esCancelable: string;        // "Cancelable sin aceptación", "Cancelable con aceptación", "No cancelable"
  estado: string;              // "Vigente", "Cancelado", "No encontrado"
  error?: string;
}

/**
 * Interfaz que debe implementar cualquier PAC.
 * Para integrar un PAC real (Finkok, Digicel, SW Sapien, etc.)
 * solo se necesita crear una clase que implemente esta interfaz.
 */
export interface PacAdapter {
  /** Nombre del PAC para logs y auditoría */
  readonly name: string;

  /**
   * Timbra un CFDI (envía XML sellado al SAT vía PAC).
   * Retorna el XML con el complemento TimbreFiscalDigital.
   */
  stamp(xmlSellado: string): Promise<PacStampResult>;

  /**
   * Cancela un CFDI timbrado ante el SAT.
   * @param uuid - UUID del CFDI a cancelar
   * @param rfcEmisor - RFC del emisor
   * @param motivo - Código de motivo ("01", "02", "03", "04")
   * @param folioSustitucion - UUID del CFDI que sustituye (solo para motivo "01")
   */
  cancel(
    uuid: string,
    rfcEmisor: string,
    motivo: string,
    folioSustitucion?: string
  ): Promise<PacCancelResult>;

  /**
   * Consulta el estado de un CFDI ante el SAT.
   */
  status(uuid: string, rfcEmisor: string, rfcReceptor: string, total: string): Promise<PacStatusResult>;
}
