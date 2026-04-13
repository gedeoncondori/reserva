import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Globe, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

export const GlobalAdminConfig = () => {
    const queryClient = useQueryClient();

    const { data: config, isLoading } = useQuery({
        queryKey: ['global-config'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('configuracion_local')
                .select('*')
                .single();
            if (error) throw error;
            return data;
        }
    });

    const [timezone, setTimezone] = useState('America/La_Paz');

    useEffect(() => {
        if (config) setTimezone((config as any).zona_horaria);
    }, [config]);

    const updateMutation = useMutation({
        mutationFn: async (newTz: string) => {
            const { error } = await (supabase.from('configuracion_local') as any)
                .update({ zona_horaria: newTz })
                .eq('id', 1);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['global-config'] });
            queryClient.invalidateQueries({ queryKey: ['disponibilidad'] });
            toast.success("Zona horaria global actualizada");
        },
        onError: (err: any) => toast.error("Error: " + err.message)
    });

    if (isLoading) return null;

    return (
        <div className="bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Globe size={120} className="text-blue-500" />
            </div>

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                        <Globe size={18} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Configuración Global</h2>
                        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">Panel de Administrador</p>
                    </div>
                </div>

                <button
                    onClick={() => updateMutation.mutate(timezone)}
                    disabled={updateMutation.isPending}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 text-[10px] uppercase tracking-widest"
                >
                    {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Actualizar Zona
                </button>
            </div>

            <div className="max-w-md relative z-10">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                    Zona Horaria del Proyecto
                </label>
                <div className="relative">
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 focus:border-blue-500 p-4 rounded-2xl outline-none transition-all font-black text-white text-xs appearance-none cursor-pointer"
                    >
                        <option value="America/La_Paz">Bolivia (La Paz) - GMT-4</option>
                        <option value="America/Argentina/Buenos_Aires">Argentina (B. Aires) - GMT-3</option>
                        <option value="America/Santiago">Chile (Santiago) - GMT-4/3</option>
                        <option value="America/Bogota">Colombia (Bogotá) - GMT-5</option>
                        <option value="America/Mexico_City">México (CDMX) - GMT-6</option>
                        <option value="Europe/Madrid">España (Madrid) - GMT+1/2</option>
                        <option value="America/New_York">USA (New York) - GMT-5</option>
                    </select>
                </div>
                <div className="mt-4 flex items-start gap-3">
                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                        Esta zona horaria rige los cálculos de disponibilidad y el tiempo de anticipación para todos los barberos y clientes.
                    </p>
                </div>
            </div>
        </div>
    );
};
