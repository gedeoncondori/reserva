Implementation Plan: Plataforma de Gestión de Reservas
Este documento define la arquitectura técnica y el plan de implementación para la plataforma de "Imperio Barber Studio". El proyecto será una aplicación web moderna (Vite + React + TS + Tailwind) respaldada por Supabase (PostgreSQL + Auth + Storage + Edge Functions).

User Review Required
Por favor revisa detalladamente la arquitectura de datos (tablas) para asegurarse de que todos los campos requeridos estén cubiertos. Confirmamos el uso de Resend para notificaciones.

IMPORTANT

Se ha añadido una estrategia de Optimistic Locking (15 min) y una tabla de Auditoría para prevenir fraude interno. El campo token_seguimiento tendrá un INDEX para optimizar consultas de invitados.

Arquitectura de Datos (Supabase Schema)
Tablas Propuestas
perfiles (Perfiles de Staff/Barberos y Admins)

id (uuid, PK, referencias auth.users)
rol (enum: 'admin', 'barbero')
nombre_completo (text)
foto_url (text, nullable)
sillon_asignado (text, nullable) - Ej: "S1", "S2"
qr_pago_url (text, nullable)
monto_adelanto_fijo (numeric) - Para reportes y control de cobro.
estado (boolean) - Activo o inactivo.
horarios_barbero (Disponibilidad Flexible)

id (uuid, PK)
barbero_id (uuid, FK a perfiles)
dia_semana (int, 0-6) - 0: Domingo, 1: Lunes...
hora_inicio (time)
hora_fin (time)
margen_minutos (int) - Ej: 10 min entre citas.
servicios

id (uuid, PK)
nombre (text)
precio (numeric)
duracion_minutos (int)
activo (boolean)
citas

id (uuid, PK)
cliente_nombre (text)
cliente_email (text)
cliente_celular (text)
barbero_id (uuid, FK a perfiles)
servicio_id (uuid, FK a servicios)
fecha (date)
hora_inicio (time)
hora_fin (time)
estado (enum: 'pendiente', 'confirmada', 'rechazada', 'cancelada')
comprobante_url (text, nullable)
token_seguimiento (uuid, default gen)
pago_validado_por (uuid, FK a perfiles, nullable) - Auditoría.
pago_verificado_en (timestamp, nullable)
nota_rechazo (text, nullable)
monto_pagado (numeric, nullable)
log_auditoria (Prevención de Fraude)
id (uuid, PK)
cita_id (uuid, FK)
accion (text) - Ej: "Pago Validado", "Cita Cancelada"
realizado_por (uuid, FK a perfiles)
detalles (jsonb)
creado_en (timestamp)
Índices y Optimización
CREATE INDEX idx_citas_token ON citas (token_seguimiento);
Storage (Buckets)
avatars: Fotos de los barberos.
qrs: Códigos QR de pago de los barberos.
comprobantes: Capturas de pantalla subidas por los clientes.
Políticas de RLS (Row Level Security)
servicios: Lectura (Pública), Edit (Admins).
perfiles: Lectura (Pública), Edit Propietario/Admin.
citas:
Insert (Pública).
Lectura basada en token_seguimiento.
Update: Solo comprobante_url y solo si estado == 'pendiente'.
Full Access (Admins/Barbero asignado).
Motor de Slots & Concurrencia
Lógica de Bloques Continuos
La detección de colisión entre dos bloques $[A, B]$ y $[C, D]$ sigue la fórmula: $$\max(A, C) < \min(B, D)$$

Optimistic Locking (Bloqueo de 15 min)
Para evitar que dos personas reserven el mismo slot simultáneamente:

Al seleccionar un horario, se crea la cita en estado 'pendiente'.
El sistema reserva ese slot temporalmente.
Si el comprobante no se sube en 15 minutos (manejado vía Edge Function o Timeout), el estado pasa a 'cancelada_expirada' y el slot se libera.
Frontend (Stack Senior)
Validación: Zod + React Hook Form para blindar entradas de datos.
UX: States de carga (Skeletons) y visor de comprobantes con Zoom (Lightbox).
Notificaciones (Edge Functions)
Crearemos Supabase Edge Functions como Database Webhooks conectadas a los eventos de la tabla citas:

ON INSERT: Envía e-mail "Recibimos tu solicitud".
ON UPDATE: Si estado cambia a 'confirmada', envía e-mail con destalles de la reserva.
ON UPDATE: Si estado cambia a 'rechazada', envía e-mail de rechazo.
Verification Plan
Infraestructura: Desplegar el esquema SQL usando herramientas CLI o el panel de Supabase y probar las subidas de archivos Storage.
Componente de Reservas: Realizar un mock data de citas y validar que el Algoritmo de Slots filtre correctamente sin colisiones. Validar con pruebas unitarias en TypeScript (Vitest).
Flujo Cita Cliente -> Barbero: El usuario visita como cliente, elije el servicio, barbero, hora válida, sube comprobante y se crea el ticket. El panel de Dashboard de barbero carga exactamente esa cita.
Validación: Simular la aceptación como barbero, revisar que dispare en logs el webhook a la Edge Function de notificación.