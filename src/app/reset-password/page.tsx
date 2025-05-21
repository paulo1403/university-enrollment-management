'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      resetPasswordSchema.refine(
        (data) => data.password === data.confirmPassword,
        {
          message: 'Las contraseñas no coinciden',
          path: ['confirmPassword'],
        }
      )
    ),
  });

  const onSubmit = async (data: {
    password: string;
    confirmPassword: string;
  }) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || 'Error al cambiar la contraseña');
      setSuccess(
        'Contraseña cambiada correctamente. Ahora puedes iniciar sesión.'
      );
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <ThemeToggle />
        <div className='bg-card p-8 rounded-lg shadow-md w-full max-w-md'>
          <h1 className='text-2xl font-bold mb-4'>Token inválido</h1>
          <p>El enlace de recuperación no es válido o ha expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-background px-4'>
      <ThemeToggle />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-card p-8 rounded-lg shadow-md w-full max-w-md dark:bg-zinc-900'
        aria-label='Formulario de restablecimiento de contraseña'
      >
        <h1 className='text-2xl font-bold mb-4 text-primary text-center'>
          Restablecer contraseña
        </h1>
        <div className='mb-4'>
          <label htmlFor='password' className='block mb-1 font-medium'>
            Nueva contraseña
          </label>
          <Input
            id='password'
            type='password'
            autoComplete='new-password'
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby='password-error'
          />
          {errors.password && (
            <span id='password-error' className='text-red-500 text-sm'>
              {errors.password.message}
            </span>
          )}
        </div>
        <div className='mb-4'>
          <label htmlFor='confirmPassword' className='block mb-1 font-medium'>
            Confirmar contraseña
          </label>
          <Input
            id='confirmPassword'
            type='password'
            autoComplete='new-password'
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby='confirmPassword-error'
          />
          {errors.confirmPassword && (
            <span id='confirmPassword-error' className='text-red-500 text-sm'>
              {errors.confirmPassword.message}
            </span>
          )}
        </div>
        {error && <div className='text-red-500 mb-2'>{error}</div>}
        {success && <div className='text-green-600 mb-2'>{success}</div>}
        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Cambiando...' : 'Cambiar contraseña'}
        </Button>
      </form>
    </div>
  );
}
