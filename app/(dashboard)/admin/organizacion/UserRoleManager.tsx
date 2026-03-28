'use client';

import { useState, useTransition } from 'react';
import { Users, Shield, ChevronDown, Check, AlertCircle, Loader2 } from 'lucide-react';
import { updateUserRole, type TenantUser } from './actions';

const ROLE_CONFIG = {
  ADMIN: {
    label: 'Administrador',
    description: 'Acceso total: usuarios, billing, configuración',
    color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  MANAGER: {
    label: 'Gerente',
    description: 'Puede crear y editar, no puede eliminar ni gestionar usuarios',
    color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  OPERATIVE: {
    label: 'Operativo',
    description: 'Acceso operativo básico según módulos asignados',
    color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    dot: 'bg-neutral-400',
  },
};

interface UserRoleManagerProps {
  users: TenantUser[];
  currentUserId: string;
  canEdit: boolean;
}

export default function UserRoleManager({ users, currentUserId, canEdit }: UserRoleManagerProps) {
  const [pending, startTransition] = useTransition();
  const [changingId, setChangingId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [result, setResult] = useState<{ userId: string; ok: boolean; msg?: string } | null>(null);

  const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'MANAGER' | 'OPERATIVE') => {
    setOpenDropdown(null);
    setChangingId(userId);
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      setResult({ userId, ok: res.success, msg: res.error });
      setChangingId(null);
      setTimeout(() => setResult(null), 3000);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-500" />
          <h3 className="font-black text-neutral-900 dark:text-white">
            Usuarios del tenant
          </h3>
          <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs font-bold px-2 py-0.5 rounded-full">
            {users.length}
          </span>
        </div>
        {!canEdit && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg">
            <Shield className="h-3.5 w-3.5" />
            Solo lectura — requiere rol ADMIN
          </div>
        )}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay usuarios registrados en este tenant.</p>
        </div>
      )}

      {users.map((user) => {
        const cfg = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.OPERATIVE;
        const isLoading = changingId === user.id && pending;
        const isSelf = user.id === currentUserId;

        return (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            {/* Avatar + Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-black text-neutral-600 dark:text-neutral-400 text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-neutral-900 dark:text-white text-sm">{user.name}</p>
                  {isSelf && (
                    <span className="text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                      Tú
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">{user.email}</p>
              </div>
            </div>

            {/* Role Badge / Selector */}
            <div className="flex items-center gap-3">
              {/* Feedback toast */}
              {result?.userId === user.id && (
                <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
                  result.ok
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {result.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {result.ok ? 'Guardado' : result.msg ?? 'Error'}
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center gap-2 px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                  <span className="text-xs text-neutral-500">Actualizando...</span>
                </div>
              ) : canEdit && !isSelf ? (
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:opacity-80 ${cfg.color}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </button>

                  {openDropdown === user.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenDropdown(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-20 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden">
                        {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG.ADMIN][]).map(([roleKey, rc]) => (
                          <button
                            key={roleKey}
                            onClick={() => handleRoleChange(user.id, roleKey as 'ADMIN' | 'MANAGER' | 'OPERATIVE')}
                            className={`w-full flex items-start gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors ${
                              user.role === roleKey ? 'bg-neutral-50 dark:bg-neutral-800' : ''
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${rc.dot}`} />
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-white text-sm">{rc.label}</p>
                              <p className="text-xs text-neutral-500 mt-0.5">{rc.description}</p>
                            </div>
                            {user.role === roleKey && (
                              <Check className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0 mt-0.5" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold ${cfg.color}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
