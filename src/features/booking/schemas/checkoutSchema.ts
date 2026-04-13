import { z } from 'zod';

export const checkoutSchema = z.object({
    nombre: z.string().min(3, "El nombre es demasiado corto"),
    email: z.string().email("Email inválido"),
    celular: z.string().min(8, "Ingresa un número de celular válido (ej: 70012345)"),
});

export type CheckoutForm = z.infer<typeof checkoutSchema>;
