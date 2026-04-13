import { z } from 'zod';

export const serviceSchema = z.object({
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    descripcion: z.string().optional(),
    precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
    duracion_minutos: z.coerce.number().min(5, "Mínimo 5 minutos"),
    activo: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
