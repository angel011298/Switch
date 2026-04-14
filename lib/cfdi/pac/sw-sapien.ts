/**
 * CIFRA — PAC SW Sapien (Proveedor Autorizado de Certificación)
 * ================================================================
 * Integración con SW Sapien para timbrado CFDI 4.0.
 *
 * Variables de entorno (en orden de precedencia):
 *   SW_PAC_TOKEN       → Token estático (Infinite Token del portal SW)
 *   SW_PAC_URL         → URL base del servicio (sandbox o producción)
 *   SW_SAPIEN_TOKEN    → Alias heredado (compatible con versiones anteriores)
 *   SW_SAPIEN_URL      → Alias heredado
 *   SW_SAPIEN_USER     → Usuario para autenticación user+password
 *   SW_SAPIEN_PASSWORD → Contraseña
 *
 * Sandbox:    https://services.test.sw.com.mx
 * Producción: https://services.sw.com.mx
 *
 * Comportamiento especial:
 *   • HTTP 401 → invalida el token cacheado y reintenta UNA vez con token fresco.
 *   • SW código 307 → CFDI ya timbrado anteriormente; retorna el XML existente
 *     con `alreadyStamped: true` en lugar de un error.
 *
 * Documentación oficial: https://developers.sw.com.mx/
 */

import type { PacAdapter, PacStampResult, PacCancelResult, PacStatusResult } from './adapter';

const SANDBOX_URL = 'https://services.test.sw.com.mx';
const PROD_URL    = 'https://services.sw.com.mx';

// RFC del SAT como proveedor de certificación (fijo para todos los PAC)
const RFC_PROV_CERTIF = 'SAT970701NN3';

// ─── Tipos de respuesta SW Sapien ──────────────────────────────────────────────

interface SwAuthData {
  token: string;
  /** Timestamp Unix (segundos) de expiración del token. */
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
  /** XML timbrado codificado en Base64. */
  cfdi: string;
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

interface SwResponse<T> {
  status: 'success' | 'error';
  /** En errores de negocio SW usa el código como message (ej. "307", "401"). */
  message: string;
  messageDetail: string | null;
  data: T | null;
}

// ─── Implementación ────────────────────────────────────────────────────────────

export class SwSapienPac implements PacAdapter {
  readonly name = 'SWSapien';

  private readonly baseUrl: string;
  private readonly staticToken: string | null;
  private readonly user: string | null;
  private readonly password: string | null;

  /** Token cacheado obtenido con user+password (válido hasta tokenExpiry). */
  private cachedToken: string | null = null;
  /** Timestamp en ms (Date.now()) hasta el que el cachedToken es válido. */
  private tokenExpiry = 0;

  constructor(opts: {
    token?: string;
    user?: string;
    password?: string;
    /** Sobrescribe la URL base. Si no se provee, se lee de env vars. */
    baseUrl?: string;
    /** @deprecated Usa baseUrl. Se mantiene por compatibilidad. */
    sandbox?: boolean;
  } = {}) {
    // Prioridad: opts.baseUrl > SW_PAC_URL > SW_SAPIEN_URL > sandbox flag
    const envUrl = opts.baseUrl
      ?? process.env.SW_PAC_URL
      ?? process.env.SW_SAPIEN_URL;

    const isSandbox = opts.sandbox ?? (envUrl?.includes('test') ?? true);
    this.baseUrl = envUrl ?? (isSandbox ? SANDBOX_URL : PROD_URL);

    // Prioridad de token: opts.token > SW_PAC_TOKEN > SW_SAPIEN_TOKEN
    this.staticToken = opts.token
      ?? process.env.SW_PAC_TOKEN
      ?? process.env.SW_SAPIEN_TOKEN
      ?? null;

    this.user     = opts.user     ?? process.env.SW_SAPIEN_USER     ?? null;
    this.password = opts.password ?? process.env.SW_SAPIEN_PASSWORD ?? null;
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  /**
   * Obtiene un Bearer token válido.
   * Usa el token estático si existe, o autentica con usuario/contraseña.
   * El token obtenido se cachea hasta 60s antes de su expiración.
   */
  async getToken(): Promise<string> {
    if (this.staticToken) return this.staticToken;

    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiry - 60_000) {
      return this.cachedToken;
    }

    if (!this.user || !this.password) {
      throw new Error(
        'SW Sapien: se requiere SW_PAC_TOKEN o SW_SAPIEN_USER + SW_SAPIEN_PASSWORD'
      );
    }

    const res = await fetch(`${this.baseUrl}/security/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: this.user, password: this.password }),
    });

    if (res.status === 401) {
      throw new Error('SW Sapien: credenciales inválidas (401)');
    }

    const body = await res.json() as SwResponse<SwAuthData>;

    if (body.status !== 'success' || !body.data?.token) {
      throw new Error(
        `SW Sapien auth error: ${body.messageDetail ?? body.message ?? 'respuesta inesperada'}`
      );
    }

    this.cachedToken = body.data.token;
    // expires_in es un Unix timestamp (segundos), lo convertimos a ms
    this.tokenExpiry = body.data.expires_in * 1_000;

    return this.cachedToken;
  }

  /** Invalida el token cacheado (se usa al recibir HTTP 401 del PAC). */
  private invalidateToken(): void {
    this.cachedToken = null;
    this.tokenExpiry = 0;
  }

  // ─── Timbrado ─────────────────────────────────────────────────────────────

  async stamp(xmlSellado: string): Promise<PacStampResult> {
    return this._doStamp(xmlSellado, false);
  }

  /**
   * Implementación interna del timbrado con soporte de reintento en 401.
   * @param isRetry - true si ya se intentó una vez (evita loop infinito).
   */
  private async _doStamp(
    xmlSellado: string,
    isRetry: boolean
  ): Promise<PacStampResult> {
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
        method:  'POST',
        headers: {
          'Authorization': `bearer ${token}`,
          'Content-Type':  'application/json',
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
        httpStatus: 0,
      };
    }

    // ── HTTP 401: token expirado — invalida caché y reintenta UNA vez ──────
    if (res.status === 401) {
      if (isRetry) {
        return {
          success: false,
          uuid: null,
          fechaTimbrado: null,
          selloSat: null,
          noCertificadoSat: null,
          rfcProvCertif: null,
          xmlTimbrado: null,
          error: 'SW Sapien: token expirado o inválido (401). No se pudo renovar.',
          httpStatus: 401,
        };
      }
      console.warn('[SW Sapien] Token rechazado (401) — renovando y reintentando...');
      this.invalidateToken();
      return this._doStamp(xmlSellado, true);
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
        httpStatus: res.status,
      };
    }

    // ── SW código 307: CFDI timbrado anteriormente (idempotente) ───────────
    // SW devuelve status:"error" pero con data completa y el XML ya timbrado.
    if (body.status === 'error' && body.message === '307' && body.data) {
      console.info('[SW Sapien] CFDI 307 — ya timbrado anteriormente, retornando XML existente.');
      const d = body.data;
      const xmlTimbrado = Buffer.from(d.cfdi, 'base64').toString('utf-8');
      return {
        success:       true,
        alreadyStamped: true,
        uuid:          d.uuid,
        fechaTimbrado: d.fechaTimbrado,
        selloSat:      d.selloSAT,
        noCertificadoSat: d.noCertificadoSAT,
        rfcProvCertif: RFC_PROV_CERTIF,
        xmlTimbrado,
        httpStatus:    res.status,
      };
    }

    // ── Error del PAC ───────────────────────────────────────────────────────
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
        httpStatus: res.status,
      };
    }

    // ── Éxito ───────────────────────────────────────────────────────────────
    const d = body.data;
    const xmlTimbrado = Buffer.from(d.cfdi, 'base64').toString('utf-8');

    return {
      success:          true,
      uuid:             d.uuid,
      fechaTimbrado:    d.fechaTimbrado,
      selloSat:         d.selloSAT,
      noCertificadoSat: d.noCertificadoSAT,
      rfcProvCertif:    RFC_PROV_CERTIF,
      xmlTimbrado,
      httpStatus:       res.status,
    };
  }

  // ─── Cancelación ──────────────────────────────────────────────────────────

  /**
   * Cancela un CFDI timbrado ante el SAT vía SW Sapien.
   * Motivos: "01" sustituye, "02" comprobante emitido errores con relación,
   *           "03" no se llevó a cabo la operación, "04" operación nominativa
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
      return {
        success: false,
        acuse: null,
        error: `Auth error: ${(err as Error).message}`,
      };
    }

    let endpoint = `${this.baseUrl}/cfdi40/cancel/${uuid}/motivo/${motivo}`;
    if (motivo === '01' && folioSustitucion) {
      endpoint += `/folioSustitucion/${folioSustitucion}`;
    }

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method:  'DELETE',
        headers: {
          'Authorization': `bearer ${token}`,
          'rfc':            rfcEmisor,
        },
      });
    } catch (err) {
      return {
        success: false,
        acuse: null,
        error: `Error de red al cancelar: ${(err as Error).message}`,
        httpStatus: 0,
      };
    }

    if (res.status === 401) {
      this.invalidateToken();
      return {
        success: false,
        acuse: null,
        error: 'Token expirado al cancelar (401). Reintenta la operación.',
        httpStatus: 401,
      };
    }

    let body: SwResponse<SwCancelData>;
    try {
      body = await res.json() as SwResponse<SwCancelData>;
    } catch {
      return {
        success: false,
        acuse: null,
        error: `Respuesta inválida al cancelar (HTTP ${res.status})`,
        httpStatus: res.status,
      };
    }

    if (body.status !== 'success' || !body.data) {
      return {
        success: false,
        acuse: null,
        error: body.messageDetail ?? body.message ?? 'Error al cancelar',
        httpStatus: res.status,
      };
    }

    return { success: true, acuse: body.data.acuse, httpStatus: res.status };
  }

  // ─── Estatus ──────────────────────────────────────────────────────────────

  /**
   * Consulta el estado de un CFDI ante el SAT vía SW Sapien.
   * Útil para verificar si un CFDI está vigente, cancelado o es cancelable.
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
      return {
        esCancelable: 'No cancelable',
        estado: 'No encontrado',
        error: `Auth error: ${(err as Error).message}`,
      };
    }

    let res: Response;
    try {
      res = await fetch(
        `${this.baseUrl}/cfdi40/status/${rfcEmisor}/${rfcReceptor}/${total}/${uuid}`,
        { method: 'GET', headers: { 'Authorization': `bearer ${token}` } }
      );
    } catch (err) {
      return {
        esCancelable: 'No cancelable',
        estado: 'No encontrado',
        error: `Error de red al consultar estatus: ${(err as Error).message}`,
      };
    }

    if (res.status === 401) {
      this.invalidateToken();
      return {
        esCancelable: 'No cancelable',
        estado: 'No encontrado',
        error: 'Token expirado (401)',
      };
    }

    let body: SwResponse<SwStatusData>;
    try {
      body = await res.json() as SwResponse<SwStatusData>;
    } catch {
      return {
        esCancelable: 'No cancelable',
        estado: 'No encontrado',
        error: `HTTP ${res.status}`,
      };
    }

    if (body.status !== 'success' || !body.data) {
      return {
        esCancelable: 'No cancelable',
        estado: 'No encontrado',
        error: body.messageDetail ?? body.message,
      };
    }

    return {
      esCancelable: body.data.esCancelable,
      estado:       body.data.estado,
    };
  }
}
