'use client';

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { useTheme } from "next-themes"; // Importamos el lector de temas

export default function CitasPage() {
  const { resolvedTheme } = useTheme(); // Leemos si el usuario está en 'dark' o 'light'

  useEffect(() => {
    // Evitamos ejecutarlo antes de saber el tema actual
    if (!resolvedTheme) return; 

    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: resolvedTheme === 'dark' ? 'dark' : 'light', // Cambia de forma automática
        styles: { branding: { brandColor: "#10b981" } }, // Verde esmeralda para ambos modos
        hideEventTypeDetails: false,
        layout: "month_view"
      });
    })();
  }, [resolvedTheme]); // El useEffect se vuelve a disparar si cambias el interruptor

  return (
    <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto p-4 transition-colors duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Agenda de Consultas</h1>
        <p className="text-zinc-500 dark:text-gray-400 font-medium">Gestiona tus asesorías fiscales y citas legales de forma automática.</p>
      </div>
      
      <div className="flex-1 bg-white dark:bg-neutral-900/50 border border-zinc-200 dark:border-neutral-800 rounded-2xl overflow-hidden min-h-[600px] shadow-sm">
        <Cal
          calLink="angel-ortiz-b1opvg/asesoria-fiscal" // Reemplaza con tu link
          style={{ width: "100%", height: "100%", overflow: "scroll" }}
          config={{ layout: 'month_view' }}
        />
      </div>
    </div>
  );
}