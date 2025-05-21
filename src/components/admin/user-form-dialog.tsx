'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  twoFactorEnabled: boolean;
}

interface UserFormDialogProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: () => void;
}

const userFormSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  name: z.string().optional(),
  role: z.enum(['STUDENT', 'PROFESSOR', 'ADMIN']),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    .optional(),
  twoFactorEnabled: z.boolean(),
});

export function UserFormDialog({
  isOpen,
  user,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!user;

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: user?.email || '',
      name: user?.name || '',
      role: user?.role || 'STUDENT',
      password: '',
      twoFactorEnabled: user?.twoFactorEnabled || false,
    },
  });
  // Reset form when user changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        email: user?.email || '',
        name: user?.name || '',
        role: user?.role || 'STUDENT',
        password: '',
        twoFactorEnabled: user?.twoFactorEnabled || false,
      });
    }
  }, [isOpen, user, form]);

  const handleSubmit = async (data: z.infer<typeof userFormSchema>) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        email: data.email,
        name: data.name,
        role: data.role,
        twoFactorEnabled: data.twoFactorEnabled,
      };

      // Only include password if provided (required for new users)
      if (data.password) {
        payload.password = data.password;
      } else if (!isEditing) {
        toast.error('La contraseña es requerida para nuevos usuarios');
        setLoading(false);
        return;
      }

      const url = isEditing
        ? `/api/auth/admin-user/${user.id}`
        : '/api/auth/admin-user';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la operación');
      }

      toast.success(
        isEditing
          ? 'Usuario actualizado correctamente'
          : 'Usuario creado correctamente'
      );

      onSubmit();
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza los datos del usuario seleccionado.'
              : 'Ingresa los datos para crear un nuevo usuario.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
          <div className='grid w-full items-center gap-1.5'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='ejemplo@universidad.edu'
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className='text-sm text-red-500'>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className='grid w-full items-center gap-1.5'>
            <Label htmlFor='name'>Nombre</Label>
            <Input
              id='name'
              placeholder='Nombre completo'
              {...form.register('name')}
            />
          </div>

          <div className='grid w-full items-center gap-1.5'>
            <Label htmlFor='role'>Rol</Label>
            <Select
              onValueChange={(value) =>
                form.setValue(
                  'role',
                  value as 'STUDENT' | 'PROFESSOR' | 'ADMIN'
                )
              }
              defaultValue={form.getValues('role')}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecciona un rol' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='STUDENT'>Estudiante</SelectItem>
                <SelectItem value='PROFESSOR'>Profesor</SelectItem>
                <SelectItem value='ADMIN'>Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid w-full items-center gap-1.5'>
            <Label htmlFor='password'>
              {isEditing
                ? 'Contraseña (dejar en blanco para mantener)'
                : 'Contraseña'}
            </Label>
            <Input
              id='password'
              type='password'
              placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className='text-sm text-red-500'>
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='twoFactorEnabled'
              checked={form.getValues('twoFactorEnabled')}
              onCheckedChange={(checked) => {
                form.setValue('twoFactorEnabled', checked === true);
              }}
            />
            <Label htmlFor='twoFactorEnabled' className='cursor-pointer'>
              Habilitar autenticación de dos factores
            </Label>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Procesando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
