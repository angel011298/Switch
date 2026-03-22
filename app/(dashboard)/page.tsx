import { redirect } from 'next/navigation';

/**
 * Ruta raiz "/" — redirige al Dashboard Hub.
 * Esto evita tener logica duplicada y centraliza el landing post-login.
 */
export default function RootPage() {
  redirect('/dashboard');
}
