import { Metadata } from 'next';
// Estos ya funcionan con un solo '../' porque los moviste a /app
import { Providers } from '../providers';
import Sidebar from '../Sidebar';

// Probamos con dos niveles '../../' por si la carpeta styles se quedó en la raíz
import '../../styles/main.css'; 

export const metadata: Metadata = {
  title: 'Switch',
  icons: {
    icon: '/icon.png?v=2', 
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            
            <Sidebar /> 
            
            <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
              {children}
            </main>
            
          </div>
        </Providers>
      </body>
    </html>
  );
}