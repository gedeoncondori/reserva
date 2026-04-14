import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { X, Save, Clock, Calendar as CalendarIcon, Trash2, Plus, AlertTriangle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Database } from '../../../types/supabase';

type ConfigLocal = Database['public']['Tables']['configuracion_local']['Row'];
type DiaEspecial = Database['public']['Tables']['dias_especiales']['Row'];
type DiaEspecialInsert = Database['public']['Tables']['dias_especiales']['Insert'];

export const GlobalConfigModal = ({ onClose }: { onClose: () => void }) => {
    const queryClient = useQueryClient();
    const [newSpecialDate, setNewSpecialDate] = useState<DiaEspecialInsert>({ fecha: '', tipo: 'feriado' });

    // 1. Fetch Config General
    const { data: config } = useQuery<ConfigLocal>({
        queryKey: ['config-local'],
        queryFn: async () => {
            const { data, error } = await supabase.from('configuracion_local').select('*').eq('id', 1).single();
            if (error) throw error;
            return data;
        }
    });

    // 2. Fetch Días Especiales
    const { data: diasEspeciales } = useQuery<DiaEspecial[]>({
        queryKey: ['dias-especiales'],
        queryFn: async () => {
            const { data, error } = await supabase.from('dias_especiales').select('*').order('fecha', { ascending: true });
            if (error) throw error;
            return data || [];
        }
    });

    const updateConfig = useMutation({
        mutationFn: async (payload: any) => {
            const { error } = await (supabase.from('configuracion_local') as any).update(payload).eq('id', 1);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['config-local'] });
            toast.success("Configuración global actualizada");
        }
    });

    const addSpecialDay = useMutation({
        mutationFn: async () => {
            const { error } = await (supabase.from('dias_especiales') as any).insert([newSpecialDate]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dias-especiales'] });
            toast.success("Día especial añadido");
            setNewSpecialDate({ fecha: '', tipo: 'feriado' });
        },
        onError: (err: any) => toast.error("Error: " + err.message)
    });

    const deleteSpecialDay = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('dias_especiales').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dias-especiales'] })
    });

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">

                {/* Lado Izquierdo: Horario Base */}
                <div className="md:w-1/3 p-8 border-r border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-blue-600 rounded-2xl"><Clock className="text-white" size={24} /></div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Horario Base</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Apertura</label>
                            <input
                                type="time"
                                defaultValue={config?.hora_apertura}
                                onBlur={(e) => updateConfig.mutate({ hora_apertura: e.target.value })}
                                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Cierre</label>
                            <input
                                type="time"
                                defaultValue={config?.hora_cierre}
                                onBlur={(e) => updateConfig.mutate({ hora_cierre: e.target.value })}
                                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <button onClick={onClose} className="mt-auto w-full py-4 text-slate-500 font-bold hover:text-white transition-all text-sm uppercase tracking-widest">Cerrar Ajustes</button>
                </div>

                {/* Lado Derecho: Días Especiales */}
                <div className="flex-1 p-8 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight italic">CALENDARIO DE EXCEPCIONES</h2>
                            <p className="text-slate-500 text-sm font-medium">Gestiona feriados y días de alta demanda.</p>
                        </div>
                    </div>

                    {/* Agregar Nueva Fecha */}
                    <div className="p-4 bg-slate-950 rounded-3xl border border-slate-800 mb-6 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Fecha</label>
                            <input type="date" value={newSpecialDate.fecha} onChange={e => setNewSpecialDate({ ...newSpecialDate, fecha: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-sm" />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Tipo de Día</label>
                            <select
                                value={newSpecialDate.tipo}
                                onChange={e => setNewSpecialDate({ ...newSpecialDate, tipo: e.target.value as any })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-sm"
                            >
                                <option value="feriado">Feriado (Cerrado)</option>
                                <option value="alta_demanda">Alta Demanda (Abierto)</option>
                            </select>
                        </div>
                        <button
                            onClick={() => addSpecialDay.mutate()}
                            disabled={!newSpecialDate.fecha}
                            className="p-3 bg-blue-600 rounded-xl text-white disabled:opacity-50"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Lista de Excepciones */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                        {diasEspeciales?.map((dia: any) => (
                            <div key={dia.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${dia.tipo === 'feriado' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-amber-500/5 border-amber-500/20 text-amber-500'}`}>
                                <div className="flex items-center gap-3">
                                    {dia.tipo === 'feriado' ? <AlertTriangle size={18} /> : <Star size={18} />}
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-tighter">{format(new Date(dia.fecha + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: es })}</p>
                                        <p className="text-[10px] font-bold opacity-60 uppercase">{dia.tipo}</p>
                                    </div>
                                </div>
                                <button onClick={() => deleteSpecialDay.mutate(dia.id)} className="p-2 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-red-500 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {!diasEspeciales?.length && <div className="text-center py-10 text-slate-700 italic text-sm">No hay fechas especiales configuradas.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
