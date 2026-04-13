import { z } from 'zod';

export const barberSchema = z.object({
    nombre_completo: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    sillon_asignado: z.number().min(1, "Debe ser al menos la silla 1").optional(),
    monto_adelanto_fijo: z.coerce.number().min(0).default(0),
    estado: z.boolean().default(true),
    // Estos se manejarán por separado en el upload
    foto_url: z.string().optional(),
    qr_pago_url: z.string().optional(),
});

export type BarberFormData = z.infer<typeof barberSchema>;

export const scheduleSchema = z.object({
    dia_semana: z.number().min(0).max(6),
    hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:mm"),
    hora_fin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:mm"),
    margen_minutos: z.number().min(0).default(15),
    activo: z.boolean().default(true)
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;
