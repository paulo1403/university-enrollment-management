'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const forgotSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
});

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState(''); // Solo para pruebas
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotSchema) });

  async function onSubmit(data: any) {
    setError('');
    setSuccess(false);
    setToken('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        if (result.token) setToken(result.token); // Solo para pruebas
      } else {
        setError(result.error || 'Error al solicitar recuperación');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <div className='w-full max-w-md bg-card shadow-lg rounded-xl p-8 dark:bg-zinc-900'>
        <h1 className='text-2xl font-bold mb-6 text-center text-primary'>
          Recuperar contraseña
        </h1>
        {success ? (
          <div className='mb-4 text-green-600 text-center'>
            Si el email existe, recibirás instrucciones para restablecer tu
            contraseña.
            {token && (
              <div className='mt-2 text-xs break-all'>
                Token para pruebas: <span className='font-mono'>{token}</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <label className='block mb-1 font-medium'>Email</label>
              <Input
                type='email'
                {...register('email', { required: true })}
                autoFocus
              />
              {errors.email && (
                <span className='text-xs text-red-500'>
                  {errors.email.message as string}
                </span>
              )}
            </div>
            {error && (
              <div className='text-xs text-red-500 text-center'>{error}</div>
            )}
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
            <Button
              type='button'
              variant='link'
              className='w-full mt-2 text-sm text-center text-primary underline hover:no-underline'
              onClick={() => (window.location.href = '/login')}
              tabIndex={0}
            >
              Volver a iniciar sesión
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
