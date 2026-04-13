# Barber Pro - Gestión de Reservas 💈

Sistema de gestión para barberías con panel de administración y sistema de reservas en tiempo real.

## Características 🚀

- **Agenda Interactiva**: Visualización de turnos y gestión de citas.
- **Gestión de Barberos**: Configuración individual de horarios y servicios.
- **Servicios Personalizados**: Define cortes y tratamientos con precios y duraciones.
- **Sistema de Reservas**: Interfaz para clientes intuitiva y rápida.
- **Notificaciones**: Integración con Edge Functions para alertas.
- **Optimización de Imágenes**: Carga eficiente de fotos de perfiles y comprobantes.

## Tecnologías Principales 🛠️

- **Frontend**: React, TypeScript, Vite.
- **Estilos**: Tailwind CSS.
- **Backend/Base de Datos**: Supabase (PostgreSQL).
- **Notificaciones**: Supabase Edge Functions.

## Configuración Local 💻

1. Clona el repositorio:
   ```bash
   git clone https://github.com/gedeoncondori/reserva.git
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configure sus variables de entorno en un archivo `.env`:
   ```env
   VITE_SUPABASE_URL=tu_url
   VITE_SUPABASE_ANON_KEY=tu_key
   ```

4. Ejecuta el entorno de desarrollo:
   ```bash
   npm run dev
   ```

---
Creado con ❤️ para Barberías Profesionales.
