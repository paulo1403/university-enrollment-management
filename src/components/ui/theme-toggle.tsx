'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ asMenuItem = false }: { asMenuItem?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  if (!mounted) return null;

  if (asMenuItem) {
    return (
      <button
        type='button'
        aria-label='Cambiar tema'
        onClick={toggleTheme}
        className='flex w-full items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-muted focus:outline-none focus:bg-muted text-sm font-normal'
      >
        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        <span className='flex-1 text-left'>Tema</span>
        <span className='ml-auto text-xs text-muted-foreground capitalize'>
          {theme === 'dark' ? 'Oscuro' : 'Claro'}
        </span>
      </button>
    );
  }

  return (
    <button
      type='button'
      aria-label='Cambiar tema'
      onClick={toggleTheme}
      className='p-2 rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer'
    >
      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
