import React, { useState } from 'react';
import { useBookingStore } from '../../../store/useBookingStore';
import { useAvailability } from '../hooks/useAvailability';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format, addDays } from 'date-fns';
import { Loader2, ArrowLeft, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast, Toaster } from 'sonner';
import 'react-day-picker/style.css';

/**
 * FUNCIONALIDAD IMPORTANTE: VISUALIZADOR DE HORARIOS INTELIGENTE.
 * Se encarga de mostrar un calendario y las horas extraídas y depuradas.
 * - Consume el Hook `useAvailability` para traer únicamente turnos disponibles reales.
 * - Bloquea días pasados y respeta la `ventana_reserva_dias` a futuro.
 */
export const AvailabilitySelector = () => {
    // 1. Extraemos el estado de la reserva local para armar nuestra solicitud al backend
    const { barbero, servicio, fecha, setFecha, setHora, setAppointmentId, nextStep, prevStep } = useBookingStore();

    // 2. React Query: Dispara la búsqueda a Supabase y corre el algoritmo de Gap Packing.
    const { data: slots, isLoading, isError } = useAvailability({
        barberoId: barbero?.id || null,
        fecha,
        duracionServicio: servicio?.duracion_minutos || null
    });

    const handleSlotSelection = (hora: string) => {
        if (!barbero || !servicio || !fecha) return;
        setHora(hora);
        nextStep();
    };

    const handlePrevDay = () => {
        if (!fecha) return;
        const newDate = addDays(fecha, -1);
        const minDate = new Date();
        minDate.setHours(0, 0, 0, 0);
        if (newDate >= minDate) {
            setFecha(newDate);
        }
    };

    const handleNextDay = () => {
        if (!fecha) return;
        const newDate = addDays(fecha, 1);
        const maxDate = addDays(new Date(), barbero?.ventana_reserva_dias || 14);
        maxDate.setHours(23, 59, 59, 999);
        if (newDate <= maxDate) {
            setFecha(newDate);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <Toaster position="top-center" />
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={prevStep}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white">Fecha y Hora</h2>
                    <p className="text-slate-400">Selecciona el momento ideal para tu sesión con {barbero?.nombre_completo}.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Calendario */}
                <div className="w-full lg:w-auto p-6 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm">
                    <style>{`
            .rdp { --rdp-accent-color: #3b82f6; --rdp-background-color: #1e293b; margin: 0; }
            .rdp-day_selected, .rdp-selected, .rdp-selected:focus, .rdp-selected:hover { background-color: var(--rdp-accent-color) !important; color: white !important; font-weight: bold !important; border-radius: 12px !important; border: none !important; opacity: 1 !important; }
            .rdp-day:hover:not(.rdp-selected):not(.rdp-day_selected) { background-color: #334155 !important; border-radius: 12px !important; }
            .rdp-day_button:hover:not(.rdp-day_selected) { background-color: #334155; border-radius: 12px; }
            .rdp-day { border-radius: 12px; transition: all 0.2s ease; cursor: pointer; }
            .rdp-root { --rdp-day-height: 40px; --rdp-day-width: 40px; }
          `}</style>
                    <DayPicker
                        mode="single"
                        selected={fecha || undefined}
                        onSelect={(d) => setFecha(d || null)}
                        disabled={{
                            before: new Date(),
                            after: addDays(new Date(), barbero?.ventana_reserva_dias || 14)
                        }}
                        locale={es}
                        className="text-slate-200"
                    />
                </div>

                {/* Listado de Slots */}
                <div className="flex-1 w-full space-y-6">
                    <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                        <CalendarIcon size={18} className="text-blue-500" />
                        <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">
                                {fecha ? format(fecha, "EEEE, d 'de' MMMM", { locale: es }) : 'Selecciona una fecha'}
                            </span>
                            {fecha && (
                                <div className="flex items-center ml-2 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                                    <button
                                        onClick={handlePrevDay}
                                        className="p-1.5 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                                        title="Día anterior"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div className="w-px h-4 bg-slate-700"></div>
                                    <button
                                        onClick={handleNextDay}
                                        className="p-1.5 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                                        title="Día siguiente"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>


                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                            <Loader2 className="animate-spin mb-3 text-blue-500" size={32} />
                            <p className="text-sm font-medium">Calculando ventanas disponibles...</p>
                        </div>
                    ) : fecha && slots && slots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {slots.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleSlotSelection(s)}
                                    className="group relative flex flex-col items-center justify-center py-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-300"
                                >
                                    <Clock size={14} className="mb-1 text-slate-600 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-white font-bold tracking-tight">{s}</span>
                                </button>
                            ))}
                        </div>
                    ) : fecha ? (
                        <div className="p-8 text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                            <p className="text-slate-500">No hay turnos disponibles para este día.</p>
                            <p className="text-sm text-slate-600 mt-1">Prueba con otra fecha o barbero.</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
