Project Tasks: Plataforma de Gestión de Reservas
Fase 1: Infraestructura (DB & Auth)
 Inicializar proyecto en Supabase (organización gendeoOrg).
 Crear esquema SQL (perfiles, horarios_barbero, servicios, citas, log_auditoria).
 Scripts de Seeding (Admin inicial y servicios base).
 Configurar Buckets de Storage (avatars, qrs, comprobantes).
 Configurar RLS refinado y Custom Claims para Roles.
 Configurar Auth (Staff/Admins).
 Generar tipos de TypeScript.
 Configurar entorno frontend (Vite, TS, Tailwind) con estandarización de errores.

Fase 2: 
El Motor de Reservas (Client-Side)
 UI del catálogo y lista de barberos.
 Desarrollar lógica del Motor (Cálculo de slots dinámicos: $\max(A, C) < \min(B, D)$).
 Manejo de estados de "Cita Temporal" (bloqueo por 15 min).
 Componente selector de fecha/hora inteligente.
 Formulario Checkout con Validación de Zod.
 Módulo de pago QR y carga de archivo.
 Vista de seguimiento (Solo lectura, token link).

Fase 3:
 Panel de Gestión (Barber-Side & Admin)
 Layout con Auth Guards (Rutas protegidas).
 Dashboard de Agenda con Filtros por Fecha y Skeletons.
 Modal de Validación con Visor de Imágenes (Zoom/Lightbox).
 Gestión de perfil (QR y Margen de tiempo).
 Dashboard Admin: CRUD barberos y servicios.
 Log de Auditoría (Ver historial de confirmaciones).

Fase 4: 
Notificaciones y Pulido
 Edge Functions para Webhooks de la DB.
 Integración con Resend + Configuración de Dominio/DNS.
 Programación de Recordatorio (Email 2 horas antes de la cita).
 Refinar UI/UX (Responsive, Dark Mode, Empty States).
 Despliegue a producción (Vercel/Netlify).
 Pruebas E2E del flujo completo.