import React from 'react';
import { Scissors } from 'lucide-react';
import { ServiceList } from '../components/ServiceList';
import { BarberList } from '../components/BarberList';
import { AvailabilitySelector } from '../components/AvailabilitySelector';
import { BookingCheckout } from '../components/BookingCheckout';
import { useBookingStore } from '../../../store/useBookingStore';

/**
 * FUNCIONALIDAD IMPORTANTE: ORQUESTADOR PRINCIPAL DEL WIZARD DE RESERVA.
 * Maneja el enrutamiento lógico por estados (store) en lugar de crear rutas HTML diferentes.
 * Proceso:
 * 1. Selección de Servicio (Extrae Duración y Precio).
 * 2. Selección de Barbero.
 * 3. Selector de Disponibilidad (Llama a base de datos y calcula huecos eficientes).
 * 4. Checkout (Recolección de datos y bloqueo temporal de cupo con pago QR).
 */
export const BookingPage = () => {
    // Extracción de las acciones globales del manejador Zustand
    const { step, reset } = useBookingStore();

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Header con Glow */}
            <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
                        <div className="p-1.5 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                            <Scissors className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white uppercase">
                            Imperio <span className="text-blue-500 text-sm align-top ml-0.5 font-medium tracking-normal">Studio</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
                                style={{ width: `${(step / 4) * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                            Paso {step} <span className="text-slate-700 mx-1">/</span> 4
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-12">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl font-bold text-white mb-2">Selecciona un servicio</h2>
                            <p className="text-slate-400">
                                Elige el corte o tratamiento que deseas. Cada servicio tiene una duración específica que afecta la disponibilidad.
                            </p>
                        </div>
                        <ServiceList />
                    </div>
                )}

                {step === 2 && <BarberList />}
                {step === 3 && <AvailabilitySelector />}
                {step === 4 && <BookingCheckout />}
            </main>
        </div>
    );
};
