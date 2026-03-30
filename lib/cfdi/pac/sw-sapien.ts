/**
 * CIFRA — PAC SW Sapien (Proveedor Autorizado de Certificación)
 * ================================================================
 * Integración con SW Sapien para timbrado CFDI 4.0.
 *
 * COSTO: Gratis en sandbox. Producción: contrato con SW Sapien.
 *
 * Variables de entorno:
 *   SW_SAPIEN_TOKEN     Token de API de SW Sapien (obtenido en app.sw.com.mx)
 *   SW_SAPIEN_URL       (opcional) Override de URL base
 *                       Sandbox:    https://services.test.sw.com.mx
 *                       Producción: https://services.sw.com.mx
 *
 * Documentación oficial: https://developers.sw.com.mx/
 */

import type { PacAdapter, PacStampResult, PacCancelResult, PacStatusResult } from './adapter';

// URLs del servicio
const SANDBOX_URL = 'https://services.test.sw.com.mx';
const PROD_URL    = 'https://services.sw.com.mx';

// ─── Tipos de respuesta SW Sapien ──────────────────────────────────────────

interface SwStampData {
  cadenaOriginalSAT: string;
  noCertificadoSAT: string;
  noCertificadoCFDI: string;
  uuid: string;
  selloSAT: string;
  selloCFDI: string;
  fechaTimbrado: string;
  qrCode: string;
  cfdi: string;           // XML timbrado en base64
}

interface SwResponse<T> {
  status: 'success' | 'error';
  message: string;
  messageDetail: string | null;
  data: T | null;
}

interface SwCancelData {
  acuse: string;
  uuid: string;
  statuses?: Array<{
    uuid: string;
    esCancelable: string;
    estatus: string;
  }>;
}

interface SwStatusData {
  codigoEstatus: string;    // "S - Comprobante obtenido satisfactoriamente."
  esCancelable: string;     // "Cancelable sin aceptación", etc.
  estado: string;           // "Vigente", "Cancelado"
  validacionEFOS: string | null;
}

// ─── Implementación ────────────────────────────────────────────────────────

export class SwSapienPac implements PacAdapter {
  readonly name = 'SWSapien';

  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token: string, sandbox = true) {
    this.token = token;
    const envUrl = process.env.SW_SAPIEN_URL;
    this.baseUrl = envUrl ?? (sandbox ? SANDBOX_URL : PROD_URL);
  }

  /**
   * Timbra un CFDI 4.0 enviando el XML en base64 al PAC.
   */
  async stamp(xmlSellado: string): Promise<PacStampResult> {
    const xmlBase64 = Buffer.from(xmlSellado, 'utf-8').toString('base64');

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/cfdi40/stamp/v4/b64`, {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xml: xmlBase64 }),
      });
    } catch (err) {
      return {
        success: false,
        uuid: null,
        fechaTimbrado: null,
        selloSat: null,
        noCertificadoSat: null,
        rfcProvCertif: null,
        xmlTimbrado: null,
        error: `Error de red al conectar con SW Sapien: ${(err as Error).message}`,
      };
    }

    let body: SwResponse<SwStampData>;
    try {
      body = await res.json() as SwResponse<SwStampData>;
    } catch {
      return {
        success: false,
        uuid: null,
        fechaTimbrado: null,
        selloSat: null,
        noCertificadoSat: null,
        rfcProvCertif: null,
        xmlTimbrado: null,
        error: `Respuesta inválida del PAC (HTTP ${res.status})`,
      };
    }

    if (body.status !== 'success' || !body.data) {
      return {
        success: false,
        uuid: null,
        fechaTimbrado: null,
        selloSat: null,
        noCertificadoSat: null,
        rfcProvCertif: null,
        xmlTimbrado: null,
        error: body.messageDetail ?? body.message ?? 'Error desconocido del PAC',
      };
    }

    const d = body.data;

    // El XML timbrado viene en base64 — decodificar
    const xmlTimbrado = Buffer.from(d.cfdi, 'base64').toString('utf-8');

    return {
      success: true,
      uuid: d.uuid,
      fechaTimbrado: d.fechaTimbrado,
      selloSat: d.selloSAT,
      noCertificadoSat: d.noCertificadoSAT,
      rfcProvCertif: 'SAT970701NN3',   // RFC del SAT como proveedor de certificación
      xmlTimbrado,
    };
  }

  /**
   * Cancela un CFDI ante el SAT vía SW Sapien.
   */
  async cancel(
    uuid: string,
    rfcEmisor: string,
    motivo: string,
    folioSustitucion?: string
  ): Promise<PacCancelResult> {
    let endpoint = `${this.baseUrl}/cfdi40/cancel/${uuid}/motivo/${motivo}`;
    if (motivo === '01' && folioSustitucion) {
      endpoint += `/folioSustitucion/${folioSustitucion}`;
    }

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `bearer ${this.token}`,
          'rfc': rfcEmisor,
        },
      });
    } catch (err) {
      return {
        success: false,
        acuse: null,
        error: `Error de red al cancelar: ${(err as Error).message}`,
      };
    }

    let body: SwResponse<SwCancelData>;
    try {
      body = await res.json() as SwResponse<SwCancelData>;
    } catch {
      return {
        success: false,
        acuse: null,
        error: `Respuesta inválida del PAC al cancelar (HTTP ${res.status})`,
      };
    }

    if (body.status !== 'success' || !body.data) {
      return {
        success: false,
        acuse: null,
        error: body.messageDetail ?? body.message ?? 'Error al cancelar',
      };
    }

    return {
      success: true,
      acuse: body.data.acuse,
    };
  }

  /**
   * Consulta el estado de un CFDI ante el SAT vía SW Sapien.
   */
  async status(
    uuid: string,
    rfcEmisor: string,
    rfcReceptor: string,
    total: string
  ): Promise<PacStatusResult> {
    let res: Response;
    try {
      res = await fetch(
        `${this.baseUrl}/cfdi40/status/${rfcEmisor}/${rfcReceptor}/${total}/${uuid}`,
        {
          method: 'GET',
          headers: { 'Authorization': `bearer ${this.token}` },
        }
      );
    } catch (err) {
      return {
        esCancelable: 'No cancelable',
        estado: 'No encontrado',
        error: `Error de red al consultar estado: ${(err as Error).message}`,
      };
    }

    let body: SwResponse<SwStatusData>;
    try {
      body = await res.json() as SwResponse<SwStatusData>;
    } catch {
      return {
        esCancelable: 'No cancelable',
        estado: 'No encontrado',
        error: `Respuesta inválida al consultar estado (HTTP ${res.status})`,
      };
    }

    if (body.status !== 'success' || !body.data) {
      return {
        esCancelable: 'No cancelable',
        estado: 'No encontrado',
        error: body.message,
      };
    }

    return {
      esCancelable: body.data.esCancelable,
      estado: body.data.estado,
    };
  }
}
