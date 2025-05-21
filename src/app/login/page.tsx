'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, twoFASchema } from '@/schemas/auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    reset,
  } = useForm({ resolver: zodResolver(loginSchema) });

  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: errors2FA },
    setError: setFormError2FA,
    reset: reset2FA,
  } = useForm({ resolver: zodResolver(twoFASchema) });

  async function onLogin(data: any) {
    setLoading(true);
    setError('');
    setTwoFactor(false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const result = await res.json();
      if (result.twoFactorRequired) {
        setTwoFactor(true);
        setPendingEmail(data.email);
        reset();
      } else if (result.token) {
        localStorage.setItem('token', result.token);
        window.location.href = '/dashboard/' + result.user.role.toLowerCase();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }

  async function on2FA(data: any) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: data.code }),
      });
      const result = await res.json();
      if (result.token) {
        localStorage.setItem('token', result.token);
        window.location.href = '/dashboard/' + result.user.role.toLowerCase();
      } else {
        setError(result.error || 'Código incorrecto');
      }
    } catch (err) {
      setError('Error conectando al servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <ThemeToggle />
      <div className='w-full max-w-md bg-card shadow-lg rounded-xl p-8 dark:bg-zinc-900'>
        <h1 className='text-2xl font-bold mb-6 text-center text-primary'>
          Iniciar sesión
        </h1>
        {error && <div className='mb-4 text-red-500 text-center'>{error}</div>}
        {!twoFactor ? (
          <form onSubmit={handleSubmit(onLogin)} className='space-y-4'>
            <div>
              <label className='block mb-1 font-medium'>Email</label>
              <Input
                type='email'
                {...register('email', { required: 'Email requerido' })}
                autoFocus
              />
              {errors.email && (
                <span className='text-xs text-red-500'>
                  {errors.email.message as string}
                </span>
              )}
            </div>
            <div>
              <label htmlFor='password' className='block mb-1 font-medium'>
                Contraseña
              </label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  aria-label='Contraseña'
                  autoComplete='current-password'
                  {...register('password', {
                    required: 'Contraseña requerida',
                  })}
                />
                <button
                  type='button'
                  tabIndex={0}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  onClick={() => setShowPassword((v) => !v)}
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded'
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className='text-xs text-red-500'>
                  {errors.password.message as string}
                </span>
              )}
            </div>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Cargando...' : 'Entrar'}
            </Button>
            <Button
              type='button'
              variant='link'
              className='w-full mt-2 text-sm text-center text-primary underline hover:no-underline'
              onClick={() => (window.location.href = '/forgot-password')}
              tabIndex={0}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit2FA(on2FA)} className='space-y-4'>
            <div>
              <label className='block mb-1 font-medium'>
                Código de autenticación
              </label>
              <Input
                type='text'
                maxLength={6}
                {...register2FA('code', { required: 'Código requerido' })}
                autoFocus
              />
              {errors2FA.code && (
                <span className='text-xs text-red-500'>
                  {errors2FA.code.message as string}
                </span>
              )}
            </div>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar código'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
