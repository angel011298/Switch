'use client';

import { useI18n } from '@/lib/i18n/context';
import { LOCALES, LOCALE_NAMES, LOCALE_FLAGS, type Locale } from '@/lib/i18n';

export default function IdiomaPage() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.settings.language}</h1>
      <p className="text-gray-500 mb-8">
        Selecciona el idioma de la interfaz / Select the interface language
      </p>

      <div className="space-y-3">
        {LOCALES.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocale(loc as Locale)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              locale === loc
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="text-3xl">{LOCALE_FLAGS[loc as Locale]}</span>
            <div className="flex-1">
              <div
                className={`font-semibold text-lg ${
                  locale === loc ? 'text-blue-700' : 'text-gray-900'
                }`}
              >
                {LOCALE_NAMES[loc as Locale]}
              </div>
              <div className="text-sm text-gray-500">
                {loc === 'es' ? 'Español — México' : 'English — United States'}
              </div>
            </div>
            {locale === loc && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Nota:</strong> El cambio de idioma se aplica inmediatamente y se guarda en tu
          navegador. Esta preferencia es por dispositivo.
        </p>
      </div>
    </div>
  );
}
