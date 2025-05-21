import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export const twoFASchema = z.object({
  code: z.string().length(6, { message: 'El código debe tener 6 dígitos' }),
});
