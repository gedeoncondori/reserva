import { create } from 'zustand';
import { Database } from '../types/supabase';

type Servicio = Database['public']['Tables']['servicios']['Row'];
type Barbero = Database['public']['Tables']['perfiles']['Row'];

/**
 * Interfaz que define el estado global del flujo de Reserva (Booking Wizard).
 * Centraliza la información que el cliente va seleccionando a lo largo 
 * de las 4 etapas principales de la plataforma.
 */
interface BookingState {
    /** Paso actual del Wizard (1 al 4) */
    step: number;
    /** Servicio seleccionado en el paso 1 */
    servicio: Servicio | null;
    /** Barbero escogido en el paso 2 */
    barbero: Barbero | null;
    /** Fecha específica solicitada en el paso 3 */
    fecha: Date | null;
    /** Hora exacta (e.g. "14:30") validada por Greedy Gap Packing */
    hora: string | null;
    /** ID de la cita temporal generada en el paso 4 */
    appointmentId: string | null;

    // Acciones y Mutaciones de Estado Global
    setServicio: (servicio: Servicio) => void;
    setBarbero: (barbero: Barbero) => void;
    setFecha: (fecha: Date | null) => void;
    setHora: (hora: string | null) => void;
    setAppointmentId: (id: string | null) => void;

    /** Avanza al siguiente paso del proceso de reserva */
    nextStep: () => void;
    /** Regresa al paso anterior para permitir correcciones del cliente */
    prevStep: () => void;
    /** Limpia por completo el estado tras una reserva exitosa o expirada */
    reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    step: 1,
    servicio: null,
    barbero: null,
    fecha: null,
    hora: null,
    appointmentId: null,
    setServicio: (servicio) => set({ servicio, step: 2 }),
    setBarbero: (barbero) => set({ barbero, step: 3 }),
    setFecha: (fecha) => set({ fecha }),
    setHora: (hora) => set({ hora }),
    setAppointmentId: (id) => set({ appointmentId: id }),
    nextStep: () => set((state) => ({ step: state.step + 1 })),
    prevStep: () => set((state) => ({ step: state.step - 1 })),
    reset: () => set({ step: 1, servicio: null, barbero: null, fecha: null, hora: null, appointmentId: null }),
}));
