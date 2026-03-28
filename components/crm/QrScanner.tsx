'use client';

/**
 * CIFRA — Escáner QR de Constancia de Situación Fiscal
 * =========================================================
 * Componente React que usa html5-qrcode para escanear el código QR
 * impreso en la Constancia de Situación Fiscal (CSF) del SAT.
 *
 * Soporta:
 * - Escaneo con cámara del dispositivo (móvil o desktop)
 * - Subida de imagen del QR
 *
 * El QR contiene una URL del SAT que se envía al Server Action
 * para hacer scraping de los datos fiscales.
 *
 * COSTO: $0 — html5-qrcode es open-source (Apache 2.0).
 */

import { useState, useRef, useCallback } from 'react';

interface QrScannerProps {
  onScanSuccess: (url: string) => void;
  onScanError?: (error: string) => void;
}

export default function QrScanner({ onScanSuccess, onScanError }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsScanning(true);

    try {
      // Importar dinámicamente html5-qrcode (solo client-side)
      const { Html5Qrcode } = await import('html5-qrcode');

      if (!containerRef.current) return;

      const scannerId = 'qr-reader-container';
      containerRef.current.id = scannerId;

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Cámara trasera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR escaneado exitosamente
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setIsScanning(false);
          onScanSuccess(decodedText);
        },
        () => {
          // Error de escaneo continuo (normal, se sigue intentando)
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al acceder a la cámara';
      setError(msg);
      setIsScanning(false);
      onScanError?.(msg);
    }
  }, [onScanSuccess, onScanError]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignorar errores al detener
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('qr-file-scanner');
        const result = await scanner.scanFile(file, true);
        scanner.clear();
        onScanSuccess(result);
      } catch (err) {
        const msg = 'No se detectó un código QR válido en la imagen. Intente con otra imagen o use la cámara.';
        setError(msg);
        onScanError?.(msg);
      }

      // Limpiar el input
      e.target.value = '';
    },
    [onScanSuccess, onScanError]
  );

  return (
    <div className="space-y-4">
      {/* Botones de acción */}
      <div className="flex gap-3">
        {!isScanning ? (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Escanear con Cámara
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Detener Cámara
          </button>
        )}

        <label className="flex items-center gap-2 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors font-medium cursor-pointer">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Subir Imagen
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Área de la cámara */}
      {isScanning && (
        <div className="relative rounded-lg overflow-hidden border-2 border-pink-500/30">
          <div ref={containerRef} className="w-full" style={{ minHeight: 300 }} />
          <p className="text-center text-sm text-zinc-400 py-2 bg-zinc-900/80">
            Apunte la cámara al código QR de la Constancia de Situación Fiscal
          </p>
        </div>
      )}

      {/* Contenedor oculto para escaneo de archivo */}
      <div id="qr-file-scanner" className="hidden" />

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
