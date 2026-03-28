'use client';

/**
 * CIFRA — Dropzone para XMLs (ZIP)
 * ======================================
 * Componente drag-and-drop para subir archivos .ZIP
 * con cientos de XMLs CFDI para contabilización automática.
 */

import { useCallback, useState, useRef } from 'react';

interface XmlDropzoneProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

export default function XmlDropzone({ onFileSelected, isProcessing }: XmlDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        alert('Solo se aceptan archivos .ZIP con XMLs');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        alert('El archivo no puede exceder 100 MB');
        return;
      }
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !isProcessing && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
        ${isDragging
          ? 'border-pink-500 bg-pink-500/10'
          : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/30'
        }
        ${isProcessing ? 'opacity-60 pointer-events-none' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        onChange={handleChange}
        className="hidden"
      />

      {isProcessing ? (
        <div className="space-y-3">
          <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-300 font-medium">Procesando {fileName}...</p>
          <p className="text-xs text-zinc-500">Extrayendo XMLs y generando polizas</p>
        </div>
      ) : fileName ? (
        <div className="space-y-2">
          <svg className="w-10 h-10 text-green-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-zinc-300 font-medium">{fileName}</p>
          <p className="text-xs text-zinc-500">Click para seleccionar otro archivo</p>
        </div>
      ) : (
        <div className="space-y-3">
          <svg className="w-12 h-12 text-zinc-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <p className="text-zinc-300 font-medium">Arrastra tu archivo ZIP aqui</p>
            <p className="text-zinc-500 text-sm mt-1">o haz click para seleccionarlo</p>
          </div>
          <p className="text-xs text-zinc-600">
            Acepta archivos .ZIP con XMLs CFDI — Maximo 100 MB
          </p>
        </div>
      )}
    </div>
  );
}
