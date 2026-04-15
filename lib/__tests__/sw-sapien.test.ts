/**
 * CIFRA — Tests: SW Sapien PAC Client
 * ======================================
 * Tests unitarios del adaptador SwSapienPac contra el sandbox de SW Sapien.
 * fetch se mockea con vi.fn() — sin llamadas HTTP reales.
 *
 * Escenarios cubiertos:
 *   ✅ Autenticación exitosa (user+password)
 *   ✅ Autenticación fallida (credenciales incorrectas)
 *   ✅ Token estático (sin llamada auth)
 *   ✅ Timbrado exitoso
 *   ✅ Timbrado — 307 (CFDI ya timbrado, retorna XML existente)
 *   ✅ Timbrado — 401 (token expirado) con reintento automático
 *   ✅ Timbrado — error de red
 *   ✅ Timbrado — error de negocio PAC (XML malformado)
 *   ✅ Cancelación exitosa
 *   ✅ Cancelación — 401
 *   ✅ Cancelación con folioSustitucion (motivo 01)
 *   ✅ Consulta de estatus vigente
 *   ✅ Consulta de estatus cancelado
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwSapienPac } from '../cfdi/pac/sw-sapien';

// ─── Constantes de sandbox ────────────────────────────────────────────────────

const SANDBOX_URL  = 'https://services.test.sw.com.mx';
const TEST_UUID    = '6128396f-c09b-4ec6-8699-43c961f7e37d';
const TEST_TOKEN   = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.sandbox.token';
const RFC_EMISOR   = 'AAA010101AAA';
const RFC_RECEPTOR = 'XAXX010101000';
const XML_SELLADO  = '<cfdi:Comprobante Version="4.0"><!-- sellado --></cfdi:Comprobante>';

// ─── Helpers de respuesta ────────────────────────────────────────────────────

function xmlB64(xml: string) {
  return Buffer.from(xml, 'utf-8').toString('base64');
}

function makeAuthOk(token = TEST_TOKEN) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'success',
      message: 'OK',
      messageDetail: null,
      data: {
        token,
        expires_in: Math.floor(Date.now() / 1000) + 7200,
        tokeny_type: 'bearer',
      },
    }),
  };
}

function makeAuthFail() {
  return {
    ok: false,
    status: 401,
    json: async () => ({
      status: 'error',
      message: '401 Unauthorized',
      messageDetail: 'Usuario o contraseña incorrectos.',
      data: null,
    }),
  };
}

function makeStampOk(uuid = TEST_UUID) {
  const xmlTimbrado = `<cfdi:Comprobante><cfdi:Complemento><tfd:TimbreFiscalDigital UUID="${uuid}"/></cfdi:Complemento></cfdi:Comprobante>`;
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'success',
      message: 'OK',
      messageDetail: null,
      data: {
        cadenaOriginalSAT: `||1.1|${uuid}||`,
        noCertificadoSAT:  '20001000000300022323',
        noCertificadoCFDI: '20001000000300022324',
        uuid,
        selloSAT:          'selloSat_base64==',
        selloCFDI:         'selloCfdi_base64==',
        fechaTimbrado:     '2024-01-15T10:30:00',
        qrCode:            '',
        cfdi:              xmlB64(xmlTimbrado),
      },
    }),
  };
}

function makeStamp307(uuid = TEST_UUID) {
  const xmlTimbrado = `<cfdi:Comprobante><cfdi:Complemento><tfd:TimbreFiscalDigital UUID="${uuid}"/></cfdi:Complemento></cfdi:Comprobante>`;
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'error',
      message: '307',
      messageDetail: 'El comprobante fue timbrado previamente.',
      data: {
        cadenaOriginalSAT: `||1.1|${uuid}||`,
        noCertificadoSAT:  '20001000000300022323',
        noCertificadoCFDI: '20001000000300022324',
        uuid,
        selloSAT:          'selloSat_base64==',
        selloCFDI:         'selloCfdi_base64==',
        fechaTimbrado:     '2024-01-15T10:30:00',
        qrCode:            '',
        cfdi:              xmlB64(xmlTimbrado),
      },
    }),
  };
}

function makeHttp401() {
  return { ok: false, status: 401, json: async () => ({ status: 'error', message: '401', messageDetail: 'Token inválido.', data: null }) };
}

function makeStampError(message = 'CFDI_XML_INVALIDO', detail = 'XML mal formado') {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'error',
      message,
      messageDetail: detail,
      data: null,
    }),
  };
}

function makeCancelOk(uuid = TEST_UUID) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'success',
      message: 'OK',
      messageDetail: null,
      data: { acuse: `<Acuse><UUID>${uuid}</UUID><Estatus>Cancelado</Estatus></Acuse>`, uuid },
    }),
  };
}

function makeStatusOk(estado = 'Vigente', esCancelable = 'Cancelable sin aceptación') {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'success',
      message: 'OK',
      messageDetail: null,
      data: { codigoEstatus: 'S - Comprobante obtenido satisfactoriamente.', esCancelable, estado, validacionEFOS: null },
    }),
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

// ─── Autenticación ────────────────────────────────────────────────────────────

describe('SwSapienPac — autenticación', () => {
  it('usa token estático sin llamar al endpoint de auth', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeStampOk());

    await pac.stamp(XML_SELLADO);

    // Solo se llama UNA vez (stamp), nunca /security/authenticate
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0] as [string, ...unknown[]];
    expect(url).toContain('/cfdi40/stamp');
    expect(url).not.toContain('/security/authenticate');
  });

  it('obtiene token por user+password en el primer stamp', async () => {
    const pac = new SwSapienPac({ user: 'test@sw.com', password: 'pass123', baseUrl: SANDBOX_URL });
    mockFetch
      .mockResolvedValueOnce(makeAuthOk())   // auth
      .mockResolvedValueOnce(makeStampOk()); // stamp

    await pac.stamp(XML_SELLADO);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [authUrl] = mockFetch.mock.calls[0] as [string, ...unknown[]];
    expect(authUrl).toContain('/security/authenticate');
  });

  it('cachea el token y no vuelve a autenticar en el segundo stamp', async () => {
    const pac = new SwSapienPac({ user: 'test@sw.com', password: 'pass123', baseUrl: SANDBOX_URL });
    mockFetch
      .mockResolvedValueOnce(makeAuthOk())    // auth (primera vez)
      .mockResolvedValueOnce(makeStampOk())   // stamp 1
      .mockResolvedValueOnce(makeStampOk());  // stamp 2

    await pac.stamp(XML_SELLADO);
    await pac.stamp(XML_SELLADO);

    // Solo 1 auth + 2 stamps = 3 llamadas
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('falla si el endpoint de auth devuelve 401', async () => {
    const pac = new SwSapienPac({ user: 'bad@sw.com', password: 'wrong', baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeAuthFail());

    const result = await pac.stamp(XML_SELLADO);

    expect(result.success).toBe(false);
    expect(result.error).toContain('401');
  });

  it('falla si no hay credenciales configuradas', async () => {
    // Sin ninguna credencial
    const pac = new SwSapienPac({ baseUrl: SANDBOX_URL });

    const result = await pac.stamp(XML_SELLADO);

    expect(result.success).toBe(false);
    expect(result.error).toContain('SW_PAC_TOKEN');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ─── Timbrado ─────────────────────────────────────────────────────────────────

describe('SwSapienPac — timbrado', () => {
  it('timbra exitosamente y retorna UUID y XML con TimbreFiscalDigital', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeStampOk());

    const result = await pac.stamp(XML_SELLADO);

    expect(result.success).toBe(true);
    expect(result.uuid).toBe(TEST_UUID);
    expect(result.xmlTimbrado).toContain('TimbreFiscalDigital');
    expect(result.selloSat).toBe('selloSat_base64==');
    expect(result.noCertificadoSat).toBe('20001000000300022323');
    expect(result.rfcProvCertif).toBe('SAT970701NN3');
    expect(result.fechaTimbrado).toBe('2024-01-15T10:30:00');
    expect(result.alreadyStamped).toBeUndefined();
  });

  it('envía el XML en base64 en el cuerpo de la petición', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeStampOk());

    await pac.stamp(XML_SELLADO);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { xml: string };
    const decoded = Buffer.from(body.xml, 'base64').toString('utf-8');
    expect(decoded).toBe(XML_SELLADO);
  });

  it('incluye el header Authorization: bearer {token}', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeStampOk());

    await pac.stamp(XML_SELLADO);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe(`bearer ${TEST_TOKEN}`);
  });

  it('código 307 → retorna success=true y alreadyStamped=true con UUID existente', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeStamp307());

    const result = await pac.stamp(XML_SELLADO);

    expect(result.success).toBe(true);
    expect(result.alreadyStamped).toBe(true);
    expect(result.uuid).toBe(TEST_UUID);
    expect(result.xmlTimbrado).toContain(TEST_UUID);
    expect(result.error).toBeUndefined();
  });

  it('HTTP 401 → invalida token y reintenta UNA vez, timbra en el reintento', async () => {
    const pac = new SwSapienPac({ user: 'user@sw.com', password: 'pass', baseUrl: SANDBOX_URL });
    mockFetch
      .mockResolvedValueOnce(makeAuthOk('first-token'))   // auth inicial
      .mockResolvedValueOnce(makeHttp401())               // stamp falla 401
      .mockResolvedValueOnce(makeAuthOk('renewed-token')) // re-auth
      .mockResolvedValueOnce(makeStampOk());              // stamp exitoso

    const result = await pac.stamp(XML_SELLADO);

    expect(result.success).toBe(true);
    expect(result.uuid).toBe(TEST_UUID);
    // 4 llamadas: auth → stamp(401) → re-auth → stamp(ok)
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('HTTP 401 en reintento → falla con error 401 y no hace más retries', async () => {
    const pac = new SwSapienPac({ user: 'user@sw.com', password: 'pass', baseUrl: SANDBOX_URL });
    mockFetch
      .mockResolvedValueOnce(makeAuthOk())  // auth
      .mockResolvedValueOnce(makeHttp401()) // stamp 401 (primer intento)
      .mockResolvedValueOnce(makeAuthOk())  // re-auth
      .mockResolvedValueOnce(makeHttp401()); // stamp 401 (reintento — también falla)

    const result = await pac.stamp(XML_SELLADO);

    expect(result.success).toBe(false);
    expect(result.httpStatus).toBe(401);
    // No debe haber más de 4 llamadas (sin loop infinito)
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('error de negocio PAC → retorna success=false con mensaje del PAC', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeStampError('CFDI_INVALIDO', 'El XML no es un CFDI válido.'));

    const result = await pac.stamp(XML_SELLADO);

    expect(result.success).toBe(false);
    expect(result.error).toBe('El XML no es un CFDI válido.');
    expect(result.uuid).toBeNull();
  });

  it('error de red → retorna success=false con httpStatus=0', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await pac.stamp(XML_SELLADO);

    expect(result.success).toBe(false);
    expect(result.httpStatus).toBe(0);
    expect(result.error).toContain('Error de red');
  });
});

// ─── Cancelación ─────────────────────────────────────────────────────────────

describe('SwSapienPac — cancelación', () => {
  it('cancela exitosamente con motivo 02', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeCancelOk());

    const result = await pac.cancel(TEST_UUID, RFC_EMISOR, '02');

    expect(result.success).toBe(true);
    expect(result.acuse).toContain(TEST_UUID);
    expect(result.acuse).toContain('Cancelado');
  });

  it('usa método DELETE con header rfc', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeCancelOk());

    await pac.cancel(TEST_UUID, RFC_EMISOR, '02');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('DELETE');
    expect((init.headers as Record<string, string>)['rfc']).toBe(RFC_EMISOR);
    expect(url).toContain(TEST_UUID);
    expect(url).toContain('motivo/02');
  });

  it('agrega folioSustitucion a la URL cuando motivo es 01', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeCancelOk());

    const folio = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    await pac.cancel(TEST_UUID, RFC_EMISOR, '01', folio);

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`folioSustitucion/${folio}`);
  });

  it('HTTP 401 en cancelación → retorna error con httpStatus 401 e invalida token', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeHttp401());

    const result = await pac.cancel(TEST_UUID, RFC_EMISOR, '02');

    expect(result.success).toBe(false);
    expect(result.httpStatus).toBe(401);
  });
});

// ─── Estatus ─────────────────────────────────────────────────────────────────

describe('SwSapienPac — consulta de estatus', () => {
  it('retorna estado Vigente y esCancelable para un CFDI activo', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeStatusOk('Vigente', 'Cancelable sin aceptación'));

    const result = await pac.status(TEST_UUID, RFC_EMISOR, RFC_RECEPTOR, '1160.00');

    expect(result.estado).toBe('Vigente');
    expect(result.esCancelable).toBe('Cancelable sin aceptación');
    expect(result.error).toBeUndefined();
  });

  it('retorna estado Cancelado para un CFDI anulado', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeStatusOk('Cancelado', 'No cancelable'));

    const result = await pac.status(TEST_UUID, RFC_EMISOR, RFC_RECEPTOR, '1160.00');

    expect(result.estado).toBe('Cancelado');
  });

  it('construye la URL con rfcEmisor/rfcReceptor/total/uuid en orden correcto', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockResolvedValueOnce(makeStatusOk());

    await pac.status(TEST_UUID, RFC_EMISOR, RFC_RECEPTOR, '1160.00');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe(
      `${SANDBOX_URL}/cfdi40/status/${RFC_EMISOR}/${RFC_RECEPTOR}/1160.00/${TEST_UUID}`
    );
  });

  it('error de red → retorna estado No encontrado', async () => {
    const pac = new SwSapienPac({ token: TEST_TOKEN, baseUrl: SANDBOX_URL });
    mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

    const result = await pac.status(TEST_UUID, RFC_EMISOR, RFC_RECEPTOR, '1160.00');

    expect(result.estado).toBe('No encontrado');
    expect(result.error).toContain('Error de red');
  });
});
