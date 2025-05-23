'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function ProfessorDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'PROFESSOR') {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('token');
    router.replace('/login');
  }

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <header className='flex items-center justify-between px-6 py-4 border-b border-border bg-card'>
        <h1 className='text-xl font-bold'>Panel de Profesor</h1>
        <div className='flex items-center gap-2'>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className='ml-2 px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors cursor-pointer'
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className='p-8'>
        <h2 className='text-2xl font-semibold mb-2'>¡Bienvenido, Profesor!</h2>
        <p className='text-muted-foreground mb-4'>
          Aquí puedes ver tus cursos asignados, estudiantes y gestionar
          calificaciones.
        </p>
      </main>
    </div>
  );
}
