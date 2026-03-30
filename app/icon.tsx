/**
 * CIFRA — Favicon auto-generado por Next.js App Router
 * Símbolo Delta (Δ) azul CIFRA, visible y limpio en todos los tamaños.
 */
import { ImageResponse } from 'next/og'

export const size        = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
        }}
      >
        {/* Δ - Delta symbol, marca de CIFRA */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <polygon
            points="10,2 19,18 1,18"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          <polygon
            points="10,7 15.5,16.5 4.5,16.5"
            fill="#1d4ed8"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
