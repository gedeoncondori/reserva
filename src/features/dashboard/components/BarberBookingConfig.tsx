import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Save, Loader2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Componente Principal del Dashboard: BarberBookingConfig
 * Funcionalidad: Permite a los administradores / barberos gestionar las reglas dinámicas
 * de su agenda. Estos valores influirán directamente en el "Greedy Gap Packing" que corre en el lado del cliente.
 */
interface Props {
    /** Identificador único del barbero logueado o seleccionado */
    barberoId: string;
    /** Parámetros pre-cargados desde Supabase (tabla: perfiles) */
    initialConfig: {
        /** Margen requerido antes de que un cliente pueda agendar de pronto (evita sorpresas) */
        min_anticipacion_minutos: number;
        /** Límite de días hacia el futuro a los que el calendario está abierto */
        ventana_reserva_dias: number;
    };
}

export const BarberBookingConfig = ({ barberoId, initialConfig }: Props) => {
    const queryClient = useQueryClient();
    const [config, setConfig] = useState(initialConfig);

    const updateMutation = useMutation({
        mutationFn: async (newConfig: typeof config) => {
            const { error } = await (supabase.from('perfiles') as any)
                .update({
                    min_anticipacion_minutos: newConfig.min_anticipacion_minutos,
                    ventana_reserva_dias: newConfig.ventana_reserva_dias
                })
                .eq('id', barberoId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['perfil', barberoId] });
            queryClient.invalidateQueries({ queryKey: ['proximo-turno'] });
            toast.success("Configuración de reserva actualizada");
        },
        onError: (err: any) => toast.error("Error al guardar: " + err.message)
    });

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 overflow-hidden relative group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                        <Calendar size={18} />
                    </div>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Parámetros de Reserva</h2>
                </div>
                <button
                    onClick={() => updateMutation.mutate(config)}
                    disabled={updateMutation.isPending}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 text-[10px] uppercase tracking-widest"
                >
                    {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Min Anticipación */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Clock size={14} className="text-blue-500" /> Tiempo de Anticipación
                    </label>
                    <div className="relative">
                        <select
                            value={config.min_anticipacion_minutos}
                            onChange={(e) => setConfig({ ...config, min_anticipacion_minutos: parseInt(e.target.value) })}
                            className="w-full bg-slate-950 border border-white/5 focus:border-blue-500 p-4 rounded-2xl outline-none transition-all font-black text-white text-xs appearance-none cursor-pointer"
                        >
                            <option value={0}>Sin anticipación (Inmediato)</option>
                            <option value={30}>30 minutos antes</option>
                            <option value={60}>1 hora antes</option>
                            <option value={120}>2 horas antes</option>
                            <option value={180}>3 horas antes</option>
                            <option value={1440}>24 horas antes</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <Clock size={14} />
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase px-1">
                        Evita que te saquen turnos "de sorpresa" con poco margen de aviso.
                    </p>
                </div>

                {/* Ventana de reserva */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500" /> Ventana de Disponibilidad
                    </label>
                    <div className="relative">
                        <select
                            value={config.ventana_reserva_dias}
                            onChange={(e) => setConfig({ ...config, ventana_reserva_dias: parseInt(e.target.value) })}
                            className="w-full bg-slate-950 border border-white/5 focus:border-blue-500 p-4 rounded-2xl outline-none transition-all font-black text-white text-xs appearance-none cursor-pointer"
                        >
                            <option value={7}>1 semana a futuro</option>
                            <option value={14}>2 semanas a futuro</option>
                            <option value={21}>3 semanas a futuro</option>
                            <option value={30}>1 mes a futuro</option>
                            <option value={60}>2 meses a futuro</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <Calendar size={14} />
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase px-1">
                        Controla qué tan lejos en el futuro pueden agendar tus clientes.
                    </p>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-start gap-4">
                <AlertCircle className="text-amber-500 shrink-0" size={16} />
                <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                    Importante: Estos ajustes son individuales. Cada barbero de Imperio Studio gestiona su propia flexibilidad de agenda.
                </p>
            </div>
        </div>
    );
};
