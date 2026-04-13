import { create } from 'zustand';
import { Database } from '../types/supabase';

type Servicio = Database['public']['Tables']['servicios']['Row'];
type Barbero = Database['public']['Tables']['perfiles']['Row'];

interface BookingState {
    step: number;
    servicio: Servicio | null;
    barbero: Barbero | null;
    fecha: Date | null;
    hora: string | null;
    appointmentId: string | null;
    // Acciones
    setServicio: (servicio: Servicio) => void;
    setBarbero: (barbero: Barbero) => void;
    setFecha: (fecha: Date | null) => void;
    setHora: (hora: string | null) => void;
    setAppointmentId: (id: string | null) => void;
    nextStep: () => void;
    prevStep: () => void;
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
