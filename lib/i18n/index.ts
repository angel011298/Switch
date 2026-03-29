import { es } from './translations/es';
import { en } from './translations/en';

export type Locale = 'es' | 'en';
export type { Translations } from './translations/es';

export const LOCALES: Locale[] = ['es', 'en'];
export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALE_NAMES: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  es: '🇲🇽',
  en: '🇺🇸',
};

export const translations: Record<Locale, typeof es> = { es, en };

export function getTranslations(locale: Locale) {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

// Deep path lookup: t('common.save') → 'Guardar'
type NestedKeyOf<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? NestedKeyOf<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`>
    : `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`;
}[keyof T];

type TranslationKey = NestedKeyOf<typeof es>;

export function t(translations: typeof es, key: TranslationKey): string {
  const parts = key.split('.');
  let current: unknown = translations;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return key;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : key;
}
