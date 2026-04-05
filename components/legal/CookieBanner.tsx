'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react'

type ConsentState = {
  essential: true   // siempre true — no se puede desactivar
  preferences: boolean
  analytics: boolean
}

const CONSENT_KEY = '__cifra_cookie_consent'
const CONSENT_VERSION = '1'

function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed.consent as ConsentState
  } catch {
    return null
  }
}

function storeConsent(consent: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({
    version: CONSENT_VERSION,
    consent,
    timestamp: Date.now(),
  }))
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [prefs, setPrefs] = useState({ preferences: true, analytics: false })

  useEffect(() => {
    const stored = getStoredConsent()
    if (!stored) {
      // Pequeño delay para no flashear en hidratación
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  const acceptAll = () => {
    storeConsent({ essential: true, preferences: true, analytics: true })
    setVisible(false)
  }

  const acceptEssential = () => {
    storeConsent({ essential: true, preferences: false, analytics: false })
    setVisible(false)
  }

  const saveCustom = () => {
    storeConsent({ essential: true, ...prefs })
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Gestión de cookies"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50
                 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700
                 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Cookie className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="font-black text-neutral-900 dark:text-white text-sm">
              Usamos cookies
            </h2>
          </div>
          <button
            onClick={acceptEssential}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Cerrar — solo cookies esenciales"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          CIFRA ERP utiliza cookies esenciales para mantener tu sesión activa. Con tu permiso, también usamos cookies de preferencias y analíticas.{' '}
          <Link href="/cookies" className="text-blue-600 dark:text-blue-400 underline underline-offset-2">
            Ver Política de Cookies
          </Link>
        </p>
      </div>

      {/* Opciones expandibles */}
      {expanded && (
        <div className="px-5 pb-3 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
          {/* Esenciales */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">🔒 Esenciales</p>
              <p className="text-[10px] text-neutral-400">Sesión y autenticación — obligatorias.</p>
            </div>
            <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-not-allowed opacity-60">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>

          {/* Preferencias */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">⚙️ Preferencias</p>
              <p className="text-[10px] text-neutral-400">Tema, idioma e interfaz.</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs.preferences}
              onClick={() => setPrefs(p => ({ ...p, preferences: !p.preferences }))}
              className={`w-8 h-4 rounded-full relative transition-colors ${prefs.preferences ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${prefs.preferences ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Analíticas */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">📊 Analíticas</p>
              <p className="text-[10px] text-neutral-400">Métricas anonimizadas de uso.</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs.analytics}
              onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
              className={`w-8 h-4 rounded-full relative transition-colors ${prefs.analytics ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${prefs.analytics ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="px-5 pb-5 pt-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={acceptAll}
            className="flex-1 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-black rounded-xl hover:opacity-90 transition-opacity"
          >
            Aceptar todas
          </button>
          <button
            onClick={acceptEssential}
            className="flex-1 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Solo esenciales
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Personalizar
          </button>
          {expanded && (
            <button
              onClick={saveCustom}
              className="ml-auto text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Guardar selección
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
