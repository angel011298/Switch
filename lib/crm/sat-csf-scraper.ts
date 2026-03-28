/**
 * CIFRA — Scraper de Constancia de Situación Fiscal (CSF) del SAT
 * =====================================================================
 * Extrae datos fiscales de la URL contenida en el QR de la CSF.
 *
 * Flujo:
 * 1. El QR de la CSF contiene una URL del SAT
 * 2. Se hace fetch a esa URL simulando un navegador
 * 3. Se parsea el HTML con cheerio para extraer:
 *    - RFC
 *    - Nombre / Razón Social
 *    - Régimen(es) Fiscal(es)
 *    - Código Postal
 *
 * COSTO: $0 — cheerio es open-source, la URL del SAT es pública.
 *
 * NOTA: El SAT puede cambiar la estructura del HTML en cualquier momento.
 * Este scraper está diseñado para ser resiliente, pero podría requerir
 * ajustes si el SAT modifica su plantilla.
 *
 * Ref: CFF Art. 27 — Constancia de inscripción al RFC.
 */

import * as cheerio from 'cheerio';

export interface CsfData {
  rfc: string;
  legalName: string;
  regimes: string[];          // Claves de régimen fiscal (ej. ["601", "626"])
  regimeNames: string[];      // Nombres completos
  zipCode: string;
  personType: 'FISICA' | 'MORAL';
  rawUrl: string;
}

export interface CsfScrapeResult {
  success: boolean;
  data: CsfData | null;
  error?: string;
}

// User-Agent para simular navegador (evita bloqueos del SAT)
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Valida que la URL sea del dominio del SAT.
 */
export function isValidSatUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith('.sat.gob.mx') ||
      parsed.hostname === 'sat.gob.mx'
    );
  } catch {
    return false;
  }
}

/**
 * Extrae datos fiscales de la URL del QR de la CSF.
 */
export async function scrapeCsf(url: string): Promise<CsfScrapeResult> {
  // Validar dominio
  if (!isValidSatUrl(url)) {
    return {
      success: false,
      data: null,
      error: 'La URL no pertenece al dominio del SAT (sat.gob.mx). Verifique el QR escaneado.',
    };
  }

  try {
    // Fetch con headers de navegador
    const response = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `El SAT respondió con error HTTP ${response.status}. Intente de nuevo.`,
      };
    }

    const html = await response.text();
    return parseHtml(html, url);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      data: null,
      error: `Error al consultar al SAT: ${msg}. Puede ingresar los datos manualmente.`,
    };
  }
}

/**
 * Parsea el HTML de la CSF del SAT y extrae los datos fiscales.
 *
 * Estrategia de extracción:
 * - Busca tablas con etiquetas conocidas (RFC, Nombre, Régimen, CP)
 * - Usa múltiples selectores para ser resiliente a cambios menores
 * - Fallback a búsqueda por texto si la estructura cambia
 */
function parseHtml(html: string, rawUrl: string): CsfScrapeResult {
  const $ = cheerio.load(html);

  let rfc = '';
  let legalName = '';
  let zipCode = '';
  const regimes: string[] = [];
  const regimeNames: string[] = [];

  // Estrategia 1: Buscar en tablas (estructura más común de la CSF)
  $('table tr, .datos tr, .panel-body tr').each((_, row) => {
    const cells = $(row).find('td, th');
    if (cells.length < 2) return;

    const label = $(cells[0]).text().trim().toLowerCase();
    const value = $(cells[1]).text().trim();

    if (!value) return;

    if (label.includes('rfc') && !rfc) {
      rfc = value.replace(/\s/g, '').toUpperCase();
    }

    if (
      (label.includes('nombre') || label.includes('razón social') || label.includes('razon social') ||
       label.includes('denominación') || label.includes('denominacion')) &&
      !legalName
    ) {
      legalName = value;
    }

    if (label.includes('código postal') || label.includes('codigo postal') || label.includes('c.p.')) {
      if (!zipCode && /^\d{5}$/.test(value)) {
        zipCode = value;
      }
    }

    if (label.includes('régimen') || label.includes('regimen')) {
      // Extraer código numérico del régimen
      const codeMatch = value.match(/^(\d{3})/);
      if (codeMatch) {
        regimes.push(codeMatch[1]);
        regimeNames.push(value);
      }
    }
  });

  // Estrategia 2: Buscar por texto en cualquier elemento si la tabla no funcionó
  if (!rfc) {
    const bodyText = $('body').text();

    // RFC: buscar patrón de 12-13 caracteres alfanuméricos típico
    const rfcMatch = bodyText.match(/RFC[:\s]*([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})/i);
    if (rfcMatch) {
      rfc = rfcMatch[1].toUpperCase();
    }

    // CP: buscar patrón de 5 dígitos cerca de "postal"
    const cpMatch = bodyText.match(/(?:postal|c\.?p\.?)[:\s]*(\d{5})/i);
    if (cpMatch) {
      zipCode = cpMatch[1];
    }
  }

  // Estrategia 3: Buscar en spans, divs con clases/ids específicos del SAT
  if (!rfc) {
    const rfcEl = $('[id*="rfc" i], [class*="rfc" i], [name*="rfc" i]');
    if (rfcEl.length) rfc = rfcEl.first().text().trim().toUpperCase();
  }

  if (!legalName) {
    const nameEl = $('[id*="nombre" i], [id*="razon" i], [class*="nombre" i]');
    if (nameEl.length) legalName = nameEl.first().text().trim();
  }

  // Validar datos mínimos
  if (!rfc) {
    return {
      success: false,
      data: null,
      error: 'No se pudo extraer el RFC del HTML del SAT. La estructura puede haber cambiado. Ingrese los datos manualmente.',
    };
  }

  // Determinar tipo de persona
  const personType = rfc.length === 12 ? 'MORAL' : 'FISICA';

  return {
    success: true,
    data: {
      rfc,
      legalName: legalName || 'Sin nombre extraído',
      regimes,
      regimeNames,
      zipCode: zipCode || '',
      personType,
      rawUrl,
    },
  };
}
