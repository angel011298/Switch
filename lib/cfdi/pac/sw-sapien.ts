/**
 * CIFRA — PAC SW Sapien (Proveedor Autorizado de Certificación)
 * ================================================================
 * Integración con SW Sapien para timbrado CFDI 4.0.
 *
 * COSTO: Gratis en sandbox. Producción: contrato con SW Sapien.
 *
 * Modos de autenticación (elige uno):
 *
 *   OPCIÓN A — Usuario + Contraseña (más fácil):
 *     SW_SAPIEN_USER       Email con el que te registraste en portal.test.sw.com.mx
 *     SW_SAPIEN_PASSWORD   Contraseña de tu cuenta
 *
 *   OPCIÓN B — Token estático (si ya tienes un Infinite Token):
 *     SW_SAPIEN_TOKEN      Token JWT obtenido del portal
 *
 *   SW_SAPIEN_URL          (opcional) Sandbox: https://services.test.sw.com.mx
 *                                    Producción: https://services.sw.com.mx
 *
 * Documentación: https://developers.sw.com.mx/
 */

import type { PacAdapter, PacStampResult, PacCancelResult, PacStatusResult } from './adapter';

const SANDBOX_URL = 'https://services.test.sw.com.mx';
const PROD_URL    = 'https://services.sw.com.mx';

// ─── Tipos de respuesta SW Sapien ──────────────────────────────────────────

interface SwAuthData {
  token: string;
  expires_in: number;
  tokeny_type: string;
}

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
}

interface SwStatusData {
  codigoEstatus: string;
  esCancelable: string;
  estado: string;
  validacionEFOS: string | null;
}

// ─── Implementación ────────────────────────────────────────────────────────

export class SwSapienPac implements PacAdapter {
  readonly name = 'SWSapien';

  private readonly baseUrl: string;
  private readonly staticToken: string | null;
  private readonly user: string | null;
  private readonly password: string | null;

  // Cache del token obtenido por usuario/contraseña (válido 2 horas)
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(opts: { token?: string; user?: string; password?: string; sandbox?: boolean }) {
    const envUrl = process.env.SW_SAPIEN_URL;
    const isSandbox = opts.sandbox ?? (envUrl ?? 'test').includes('test');
    this.baseUrl = envUrl ?? (isSandbox ? SANDBOX_URL : PROD_URL);
    this.staticToken = opts.token ?? null;
    this.user = opts.user ?? null;
    this.password = opts.password ?? null;
  }

  /**
   * Obtiene un Bearer token válido.
   * Usa el token estático si existe, o autentica con usuario/contraseña.
   */
  private async getToken(): Promise<string> {
    // Opción A: token estático siempre válido
    if (this.staticToken) return this.staticToken;

    // Opción B: token temporal cacheado (dura 2 horas)
    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiry - 60_000) {
      return this.cachedToken;
    }

    // Obtener nuevo token por usuario + contraseña
    if (!this.user || !this.password) {
      throw new Error('SW Sapien: se requiere SW_SAPIEN_TOKEN o SW_SAPIEN_USER + SW_SAPIEN_PASSWORD');
    }

    const res = await fetch(`${this.baseUrl}/v2/security/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: this.user, password: this.password }),
    });

    const body = await res.json() as SwResponse<SwAuthData>;

    if (body.status !== 'success' || !body.data?.token) {
      throw new Error(`SW Sapien auth error: ${body.messageDetail ?? body.message}`);
    }

    this.cachedToken = body.data.token;
    // expires_in es un timestamp Unix — calcular cuánto falta
    this.tokenExpiry = body.data.expires_in * 1000;

    return this.cachedToken;
  }

  /**
   * Timbra un CFDI 4.0 enviando el XML en base64 al PAC.
   */
  async stamp(xmlSellado: string): Promise<PacStampResult> {
    let token: string;
    try {
      token = await this.getToken();
    } catch (err) {
      return {
        success: false,
        uuid: null,
        fechaTimbrado: null,
        selloSat: null,
        noCertificadoSat: null,
        rfcProvCertif: null,
        xmlTimbrado: null,
        error: `Error de autenticación con SW Sapien: ${(err as Error).message}`,
      };
    }

    const xmlBase64 = Buffer.from(xmlSellado, 'utf-8').toString('base64');

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/cfdi40/stamp/v4/b64`, {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${token}`,
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
    const xmlTimbrado = Buffer.from(d.cfdi, 'base64').toString('utf-8');

    return {
      success: true,
      uuid: d.uuid,
      fechaTimbrado: d.fechaTimbrado,
      selloSat: d.selloSAT,
      noCertificadoSat: d.noCertificadoSAT,
      rfcProvCertif: 'SAT970701NN3',
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
    let token: string;
    try {
      token = await this.getToken();
    } catch (err) {
      return { success: false, acuse: null, error: (err as Error).message };
    }

    let endpoint = `${this.baseUrl}/cfdi40/cancel/${uuid}/motivo/${motivo}`;
    if (motivo === '01' && folioSustitucion) {
      endpoint += `/folioSustitucion/${folioSustitucion}`;
    }

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `bearer ${token}`, 'rfc': rfcEmisor },
      });
    } catch (err) {
      return { success: false, acuse: null, error: `Error de red al cancelar: ${(err as Error).message}` };
    }

    let body: SwResponse<SwCancelData>;
    try {
      body = await res.json() as SwResponse<SwCancelData>;
    } catch {
      return { success: false, acuse: null, error: `Respuesta inválida al cancelar (HTTP ${res.status})` };
    }

    if (body.status !== 'success' || !body.data) {
      return { success: false, acuse: null, error: body.messageDetail ?? body.message ?? 'Error al cancelar' };
    }

    return { success: true, acuse: body.data.acuse };
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
    let token: string;
    try {
      token = await this.getToken();
    } catch (err) {
      return { esCancelable: 'No cancelable', estado: 'No encontrado', error: (err as Error).message };
    }

    let res: Response;
    try {
      res = await fetch(
        `${this.baseUrl}/cfdi40/status/${rfcEmisor}/${rfcReceptor}/${total}/${uuid}`,
        { method: 'GET', headers: { 'Authorization': `bearer ${token}` } }
      );
    } catch (err) {
      return { esCancelable: 'No cancelable', estado: 'No encontrado', error: (err as Error).message };
    }

    let body: SwResponse<SwStatusData>;
    try {
      body = await res.json() as SwResponse<SwStatusData>;
    } catch {
      return { esCancelable: 'No cancelable', estado: 'No encontrado', error: `HTTP ${res.status}` };
    }

    if (body.status !== 'success' || !body.data) {
      return { esCancelable: 'No cancelable', estado: 'No encontrado', error: body.message };
    }

    return { esCancelable: body.data.esCancelable, estado: body.data.estado };
  }
}
