import React, { useState } from 'react';
import { useBookingStore } from '../../../store/useBookingStore';
import { useAvailability } from '../hooks/useAvailability';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format, addDays } from 'date-fns';
import { Loader2, ArrowLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast, Toaster } from 'sonner';

export const AvailabilitySelector = () => {
    const { barbero, servicio, fecha, setFecha, setHora, setAppointmentId, nextStep, prevStep } = useBookingStore();
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
            .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; font-weight: bold; border-radius: 12px; }
            .rdp-button:hover:not(.rdp-day_selected) { background-color: #334155; border-radius: 12px; }
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
                        <span className="font-medium">
                            {fecha ? format(fecha, "EEEE, d 'de' MMMM", { locale: es }) : 'Selecciona una fecha'}
                        </span>
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
