import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
    Plus, Trash2, Clock, Save, Loader2, X, AlertCircle,
    Scissors, User, Image as ImageIcon, QrCode
} from 'lucide-react';
import { toast } from 'sonner';

interface TimeBlock {
    id?: string;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    margen_minutos: number;
    activo: boolean;
}

export const AdvancedScheduleManager = ({ barberoId }: { barberoId: string }) => {
    const queryClient = useQueryClient();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const { data: horarios, isLoading } = useQuery({
        queryKey: ['horarios-avanzados', barberoId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('horarios_barbero')
                .select('*')
                .eq('barbero_id', barberoId)
                .order('dia_semana', { ascending: true })
                .order('hora_inicio', { ascending: true });
            if (error) throw error;
            return data as TimeBlock[];
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (blocks: TimeBlock[]) => {
            // 1. Borramos los anteriores (para este barbero)
            await (supabase.from('horarios_barbero') as any).delete().eq('barbero_id', barberoId);
            // 2. Insertamos los nuevos
            const payload = blocks.map(({ id, ...rest }) => ({ ...rest, barbero_id: barberoId }));
            const { error } = await (supabase.from('horarios_barbero') as any).insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['horarios-avanzados', barberoId] });
            toast.success("Jornada actualizada con éxito");
        },
        onError: (err: any) => toast.error("Error al guardar: " + err.message)
    });

    const [localBlocks, setLocalBlocks] = useState<TimeBlock[]>([]);

    // Sincronizar con datos de la DB al cargar
    React.useEffect(() => {
        if (horarios) setLocalBlocks(horarios);
    }, [horarios]);

    const addBlock = (diaIndex: number) => {
        const newBlock: TimeBlock = {
            dia_semana: diaIndex,
            hora_inicio: '09:00',
            hora_fin: '13:00',
            margen_minutos: 15,
            activo: true
        };
        setLocalBlocks([...localBlocks, newBlock]);
    };

    const removeBlock = (index: number) => {
        const newBlocks = [...localBlocks];
        newBlocks.splice(index, 1);
        setLocalBlocks(newBlocks);
    };

    const updateBlock = (index: number, field: keyof TimeBlock, value: any) => {
        const newBlocks = [...localBlocks];
        newBlocks[index] = { ...newBlocks[index], [field]: value };
        setLocalBlocks(newBlocks);
    };

    if (isLoading) return <Loader2 className="animate-spin text-blue-500 mx-auto py-20" />;

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Clock className="text-blue-500" />
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Mi Jornada Laboral</h2>
                    </div>
                    <button
                        onClick={() => saveMutation.mutate(localBlocks)}
                        disabled={saveMutation.isPending}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 text-xs uppercase"
                    >
                        {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Todo
                    </button>
                </div>

                <div className="space-y-4">
                    {dias.map((dia, diaIdx) => {
                        const blocksByDay = localBlocks.filter(b => b.dia_semana === diaIdx);
                        return (
                            <div key={diaIdx} className="p-6 bg-slate-950/60 rounded-[2rem] border border-slate-800/50 flex flex-col md:flex-row gap-6 md:items-center">
                                <div className="w-24 shrink-0">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{dia}</p>
                                    {blocksByDay.length === 0 && <span className="text-[9px] font-black text-red-500/50 uppercase">No laborable</span>}
                                </div>

                                <div className="flex-1 flex flex-wrap gap-3">
                                    {blocksByDay.map((block, realIdx) => {
                                        const globalIdx = localBlocks.indexOf(block);
                                        return (
                                            <div key={globalIdx} className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-2xl animate-in zoom-in-95">
                                                <input
                                                    type="time"
                                                    value={block.hora_inicio}
                                                    onChange={(e) => updateBlock(globalIdx, 'hora_inicio', e.target.value)}
                                                    className="bg-transparent text-white font-bold text-[10px] outline-none"
                                                />
                                                <span className="text-slate-700">-</span>
                                                <input
                                                    type="time"
                                                    value={block.hora_fin}
                                                    onChange={(e) => updateBlock(globalIdx, 'hora_fin', e.target.value)}
                                                    className="bg-transparent text-white font-bold text-[10px] outline-none"
                                                />
                                                <button onClick={() => removeBlock(globalIdx)} className="ml-2 p-1 text-slate-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                                            </div>
                                        );
                                    })}
                                    <button
                                        onClick={() => addBlock(diaIdx)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-[9px] font-black text-slate-500 hover:text-white hover:border-slate-700 transition-all"
                                    >
                                        <Plus size={14} /> Añadir Bloque
                                    </button>
                                </div>

                                <div className="md:border-l border-slate-800 md:pl-6 flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-600 uppercase">Margen</span>
                                        <input
                                            type="number"
                                            defaultValue={blocksByDay[0]?.margen_minutos || 15}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                blocksByDay.forEach(b => updateBlock(localBlocks.indexOf(b), 'margen_minutos', val));
                                            }}
                                            className="w-12 bg-transparent text-white font-black text-xs outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-[2rem] flex items-start gap-4 italic font-medium">
                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                <p className="text-[10px] text-slate-500 leading-relaxed uppercase">
                    Nota: El sistema bloqueará automáticamente los turnos entre bloques (siesta/almuerzo). Ejemplo: Si tu mañana termina a las 12:00 y tu tarde empieza a las 14:00, no habrá turnos disponibles en ese intervalo.
                </p>
            </div>
        </div>
    );
};
