/**
 * CIFRA — Dashboard Loading Skeleton
 * =========================================
 * Se muestra mientras Next.js carga una ruta del dashboard.
 */

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 animate-pulse">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header skeleton */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-4 w-32 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg" />
            </div>
          </div>
        </div>

        {/* KPI cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl space-y-3">
              <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800/60 rounded" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-4">
          {/* Tabs skeleton */}
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 ${i === 0 ? 'w-32' : 'w-24'}`} />
            ))}
          </div>
          {/* Table skeleton */}
          <div className="space-y-3 mt-4">
            <div className="h-10 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
