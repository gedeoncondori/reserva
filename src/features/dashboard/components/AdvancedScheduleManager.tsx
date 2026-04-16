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

const DIAS_SEMANA = [
    { label: 'Lunes', id: 1 },
    { label: 'Martes', id: 2 },
    { label: 'Miércoles', id: 3 },
    { label: 'Jueves', id: 4 },
    { label: 'Viernes', id: 5 },
    { label: 'Sábado', id: 6 },
    { label: 'Domingo', id: 0 },
];

export const AdvancedScheduleManager = ({ barberoId }: { barberoId: string }) => {
    const queryClient = useQueryClient();
    const [localBlocks, setLocalBlocks] = useState<TimeBlock[]>([]);
    const [globalMargin, setGlobalMargin] = useState(15);
    const [copyModal, setCopyModal] = useState<{ isOpen: boolean; fromDayIdx: number | null }>({
        isOpen: false,
        fromDayIdx: null
    });
    const [targetDays, setTargetDays] = useState<number[]>([]);

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

    React.useEffect(() => {
        if (horarios && horarios.length > 0) {
            setLocalBlocks(horarios);
            setGlobalMargin(horarios[0].margen_minutos || 15);
        }
    }, [horarios]);

    const saveMutation = useMutation({
        mutationFn: async (blocks: TimeBlock[]) => {
            await (supabase.from('horarios_barbero') as any).delete().eq('barbero_id', barberoId);
            const payload = blocks.map(({ id, ...rest }) => ({
                ...rest,
                barbero_id: barberoId,
                margen_minutos: globalMargin
            }));
            const { error } = await (supabase.from('horarios_barbero') as any).insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['horarios-avanzados', barberoId] });
            toast.success("Jornada actualizada");
        },
        onError: (err: any) => toast.error("Error al guardar: " + err.message)
    });

    const addBlock = (diaIndex: number) => {
        const newBlock: TimeBlock = {
            dia_semana: diaIndex,
            hora_inicio: '09:00',
            hora_fin: '13:00',
            margen_minutos: globalMargin,
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

    const toggleDay = (diaIdx: number, currentlyActive: boolean) => {
        if (currentlyActive) {
            // Desactivar: eliminamos bloques de ese día o los marcamos
            setLocalBlocks(localBlocks.filter(b => b.dia_semana !== diaIdx));
        } else {
            // Activar: añadimos bloque por defecto
            addBlock(diaIdx);
        }
    };

    const applyCopy = () => {
        if (copyModal.fromDayIdx === null) return;
        const sourceBlocks = localBlocks.filter(b => b.dia_semana === copyModal.fromDayIdx);

        let newBlocks = localBlocks.filter(b => !targetDays.includes(b.dia_semana));
        targetDays.forEach(dayId => {
            sourceBlocks.forEach(sb => {
                newBlocks.push({ ...sb, id: undefined, dia_semana: dayId });
            });
        });

        setLocalBlocks(newBlocks);
        setCopyModal({ isOpen: false, fromDayIdx: null });
        setTargetDays([]);
        toast.success("Horarios copiados");
    };

    if (isLoading) return <Loader2 className="animate-spin text-blue-500 mx-auto py-20" />;

    return (
        <div className="space-y-4">
            {/* CABECERA GLOBAL & MARGEN */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-[1.5rem] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/10 rounded-lg">
                            <Clock className="text-blue-500" size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-tight">Jornada Laboral</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Configura tus horarios y descansos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase mb-1">Margen (min)</span>
                            <input
                                type="number"
                                value={globalMargin}
                                onChange={(e) => setGlobalMargin(parseInt(e.target.value) || 0)}
                                className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-xs font-black text-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => saveMutation.mutate(localBlocks)}
                            disabled={saveMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* FILAS DE DÍAS (CAL.COM STYLE) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-[1.5rem] divide-y divide-slate-800/50 overflow-hidden">
                {DIAS_SEMANA.map((dia) => {
                    const blocksByDay = localBlocks.filter(b => b.dia_semana === dia.id);
                    const isActive = blocksByDay.length > 0;

                    return (
                        <div key={dia.id} className="group p-3 sm:p-4 hover:bg-slate-800/20 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* DÍA Y SWITCH */}
                                <div className="flex items-center gap-3 w-32 shrink-0">
                                    <button
                                        onClick={() => toggleDay(dia.id, isActive)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-blue-600' : 'bg-slate-700'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                    <span className={`text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                        {dia.label}
                                    </span>
                                </div>

                                {/* BLOQUES DE HORA */}
                                <div className="flex-1">
                                    {!isActive ? (
                                        <span className="text-[10px] font-bold text-slate-700 uppercase italic">No laborable</span>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {blocksByDay.map((block, idx) => {
                                                const globalIdx = localBlocks.indexOf(block);
                                                return (
                                                    <div key={idx} className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg animate-in fade-in slide-in-from-left-2 duration-200">
                                                        <input
                                                            type="time"
                                                            value={block.hora_inicio}
                                                            onChange={(e) => updateBlock(globalIdx, 'hora_inicio', e.target.value)}
                                                            className="bg-transparent text-white font-bold text-[10px] outline-none px-1"
                                                        />
                                                        <span className="text-slate-800 text-xs">-</span>
                                                        <input
                                                            type="time"
                                                            value={block.hora_fin}
                                                            onChange={(e) => updateBlock(globalIdx, 'hora_fin', e.target.value)}
                                                            className="bg-transparent text-white font-bold text-[10px] outline-none px-1"
                                                        />
                                                        <button
                                                            onClick={() => removeBlock(globalIdx)}
                                                            className="p-1 text-slate-700 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            <button
                                                onClick={() => addBlock(dia.id)}
                                                className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-400 transition-all"
                                                title="Añadir bloque"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <button
                                                onClick={() => setCopyModal({ isOpen: true, fromDayIdx: dia.id })}
                                                className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-400 transition-all"
                                                title="Copiar a otros días"
                                            >
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL DE CAL COM STYLE) */}
            {copyModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Copiar Horarios</h3>
                            <button onClick={() => setCopyModal({ isOpen: false, fromDayIdx: null })} className="text-slate-500 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Días a copiar:</p>
                            <button
                                onClick={() => {
                                    const availableDays = DIAS_SEMANA.filter(d => d.id !== copyModal.fromDayIdx).map(d => d.id);
                                    if (targetDays.length === availableDays.length) setTargetDays([]);
                                    else setTargetDays(availableDays);
                                }}
                                className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                            >
                                {targetDays.length === DIAS_SEMANA.filter(d => d.id !== copyModal.fromDayIdx).length
                                    ? 'Deseleccionar'
                                    : 'Seleccionar Todos'}
                            </button>
                        </div>

                        <div className="space-y-2 mb-6">
                            {DIAS_SEMANA.filter(d => d.id !== copyModal.fromDayIdx).map(dia => (
                                <label key={dia.id} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-blue-500/50 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={targetDays.includes(dia.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setTargetDays([...targetDays, dia.id]);
                                            else setTargetDays(targetDays.filter(id => id !== dia.id));
                                        }}
                                        className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-[10px] font-black text-white uppercase">{dia.label}</span>
                                </label>
                            ))}
                        </div>

                        <button
                            onClick={applyCopy}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
                        >
                            Aplicar a {targetDays.length} días
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl flex items-start gap-4">
                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={14} />
                <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                    Nota: Al guardar, el margen global de {globalMargin} minutos se aplicará a todos tus bloques de atención.
                </p>
            </div>
        </div>
    );
};
