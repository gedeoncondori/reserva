import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, User,
    Phone, ImageIcon, Scissors, X, Eye, Settings2, Mail,
    TrendingUp, Users, Clock, DollarSign, Wallet, Activity, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { GlobalConfigModal } from '../components/GlobalConfigModal';

type Perfil = Database['public']['Tables']['perfiles']['Row'];
type Cita = Database['public']['Tables']['citas']['Row'] & {
    barbero?: Partial<Perfil>;
    servicio?: Database['public']['Tables']['servicios']['Row'];
};

// --- MODAL DE DETALLES ---
const AppointmentDetailModal = ({ cita, onClose, onAction, readOnly }: { cita: any, onClose: () => void, onAction?: any, readOnly?: boolean }) => {
    const [notaRechazo, setNotaRechazo] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const fechaFormat = new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#0b0f1a] border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Detalles de Reserva</h2>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${cita.estado === 'confirmada' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                            {cita.estado}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-900 rounded-xl text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Comprobante</span>
                            <div className="aspect-[3/4] bg-black rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl">
                                {cita.comprobante_url ? (
                                    <img src={cita.comprobante_url} className="w-full h-full object-contain" alt="Comprobante" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-800 opacity-20 text-center p-4">
                                        <ImageIcon size={60} />
                                        <p className="text-[11px] mt-4 font-black uppercase">Sin imagen</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-slate-950/50 border border-white/5 rounded-[2rem] space-y-4 shadow-inner">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">Cita Programada</span>
                                    <p className="text-white font-black text-lg uppercase italic tracking-tighter">{fechaFormat}</p>
                                    <div className="text-blue-500 font-black text-4xl tracking-tighter flex items-end gap-2">
                                        {cita.hora_inicio.slice(0, 5)} <span className="text-sm font-bold opacity-50 mb-1.5 uppercase tracking-widest">HS</span>
                                    </div>
                                </div>
                                <hr className="border-white/5" />
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-500 tracking-widest">
                                        <span>Barbero</span>
                                        <span className="text-white font-black italic">{cita.barbero?.nombre_completo}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</span>
                                        <div className="flex flex-col items-end text-right">
                                            <span className="text-white font-black text-xs uppercase tracking-tight">{cita.cliente_nombre}</span>
                                            <a href={`tel:${cita.cliente_celular}`} className="text-slate-500 hover:text-blue-400 text-[9px] font-bold flex items-center gap-1 transition-colors">
                                                <Phone size={8} className="text-blue-500" /> {cita.cliente_celular}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Servicio</span>
                                        <span className="text-white font-black text-xs uppercase tracking-tight">{cita.servicio?.nombre}</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto</span>
                                        <span className="text-green-500 font-black text-3xl tracking-tighter">${cita.servicio?.precio}</span>
                                    </div>
                                </div>
                            </div>

                            {!readOnly && cita.estado === 'pendiente' && !isRejecting && (
                                <div className="grid gap-3">
                                    <button onClick={() => onAction.mutate({ id: cita.id, estado: 'confirmada' })} className="w-full py-5 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-600/20 uppercase text-[11px] tracking-widest">Aprobar Pago</button>
                                    <button onClick={() => setIsRejecting(true)} className="w-full py-4 text-slate-500 hover:text-red-500 font-black rounded-2xl uppercase text-[10px] tracking-widest">Rechazar Pago</button>
                                </div>
                            )}

                            {isRejecting && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                    <textarea value={notaRechazo} onChange={(e) => setNotaRechazo(e.target.value)} placeholder="Motivo del rechazo..." className="w-full p-5 bg-slate-950 border border-red-500/30 rounded-2xl text-white text-xs outline-none focus:border-red-500 transition-all" rows={3} />
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsRejecting(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase">Volver</button>
                                        <button onClick={() => onAction.mutate({ id: cita.id, estado: 'rechazada', nota: notaRechazo })} disabled={!notaRechazo} className="flex-1 py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase">Rechazar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export const AgendaPage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewingCita, setViewingCita] = useState<any>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const queryClient = useQueryClient();
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                supabase.from('perfiles').select('*').eq('id', user.id).single().then(({ data }) => setCurrentUser(data));
            }
        });
    }, []);

    // 1. Obtener Barberos
    const { data: barberos } = useQuery<Perfil[]>({
        queryKey: ['barberos-agenda'],
        queryFn: async () => {
            const { data, error } = await supabase.from('perfiles').select('*').eq('rol', 'barbero');
            if (error) throw error;
            return data as Perfil[];
        }
    });

    // 2. Obtener Citas del día seleccionado
    const { data: citas, isLoading } = useQuery<Cita[]>({
        queryKey: ['citas-admin', format(selectedDate, 'yyyy-MM-dd'), currentUser?.id],
        queryFn: async () => {
            let query = supabase.from('citas')
                .select('*, barbero:perfiles!citas_barbero_id_fkey(nombre_completo, sillon_asignado), servicio:servicios!citas_servicio_id_fkey(*)')
                .eq('fecha', format(selectedDate, 'yyyy-MM-dd'))
                .neq('estado', 'temporal')
                .neq('estado', 'cancelada_expirada')
                .neq('estado', 'rechazada');

            if (currentUser && currentUser.rol !== 'admin') query = query.eq('barbero_id', currentUser.id);

            const { data, error } = await query.order('hora_inicio', { ascending: true });
            if (error) throw error;
            return data as Cita[];
        },
        enabled: !!currentUser
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, estado, nota }: { id: string, estado: string, nota?: string }) => {
            const { error } = await (supabase.from('citas') as any).update({
                estado, nota_rechazo: nota, pago_validado_por: currentUser?.id, pago_verificado_en: new Date().toISOString()
            }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['citas-admin'] });
            toast.success("Agenda actualizada");
            setViewingCita(null);
        }
    });

    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest leading-none">Cargando Agenda...</p>
            </div>
        );
    }

    // --- CÁLCULOS DE DASHBOARD ---
    const totalCitas = citas?.length || 0;
    const ingresosEstimados = citas?.filter(c => c.estado === 'confirmada').reduce((acc, curr) => acc + Number(curr.servicio?.precio || 0), 0) || 0;
    const numPendientes = citas?.filter(c => c.estado === 'pendiente').length || 0;

    return (
        <div className="w-full space-y-10 animate-in fade-in duration-700 pb-20">
            {/* 1. Header & Selector */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {currentUser?.rol === 'admin' ? 'Master Agenda' : 'Mi Agenda'}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.4em]">{currentUser?.nombre_completo}</span>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {currentUser?.rol === 'admin' && (
                        <button onClick={() => setIsConfigOpen(true)} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl hover:shadow-blue-600/10"><Settings2 size={24} /></button>
                    )}
                    <div className="flex items-center bg-[#0b0f1a] p-2 rounded-[1.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                        <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-3 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><ChevronLeft size={20} /></button>
                        <div onClick={() => dateInputRef.current?.showPicker()} className="flex items-center gap-4 px-8 cursor-pointer select-none">
                            <CalendarIcon size={18} className="text-blue-500" />
                            <span className="font-black text-white text-xs uppercase tracking-[0.2em]">{format(selectedDate, "d MMMM, yyyy", { locale: es })}</span>
                            <input ref={dateInputRef} type="date" className="absolute opacity-0 w-0 h-0" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value + 'T12:00:00'))} />
                        </div>
                        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-3 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>

            {/* 2. Dashboard de Resumen (Cards rápidas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#0b0f1a]/60 border border-white/5 p-6 rounded-[2rem] flex items-center gap-5 group hover:border-blue-500/30 transition-all">
                    <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg"><Clock size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Citas</p>
                        <p className="text-3xl font-black text-white tracking-tighter italic leading-none">{totalCitas}</p>
                    </div>
                </div>
                <div className="bg-[#0b0f1a]/60 border border-white/5 p-6 rounded-[2rem] flex items-center gap-5 group hover:border-amber-500/30 transition-all">
                    <div className="p-4 bg-amber-600/10 rounded-2xl text-amber-500 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-lg"><Activity size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Pendientes</p>
                        <p className="text-3xl font-black text-white tracking-tighter italic leading-none">{numPendientes}</p>
                    </div>
                </div>
                <div className="bg-[#0b0f1a]/60 border border-white/5 p-6 rounded-[2rem] flex items-center gap-5 group hover:border-green-500/30 transition-all">
                    <div className="p-4 bg-green-600/10 rounded-2xl text-green-500 group-hover:bg-green-600 group-hover:text-white transition-all shadow-lg"><Wallet size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Recaudado</p>
                        <p className="text-3xl font-black text-white tracking-tighter italic leading-none">${ingresosEstimados}</p>
                    </div>
                </div>
                <div className="bg-[#0b0f1a]/60 border border-white/5 p-6 rounded-[2rem] flex items-center gap-5 group hover:border-blue-500/30 transition-all">
                    <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg"><Users size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Personal Hoy</p>
                        <p className="text-3xl font-black text-white tracking-tighter italic leading-none">{barberos?.length || 0}</p>
                    </div>
                </div>
            </div>

            {/* 3. El Tablero Visual de Columnas (Kanban) */}
            <div className="w-full">
                <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar scroll-smooth">
                    {/* Renderizamos una columna por barbero (o solo la de él si no es admin) */}
                    {(currentUser?.rol === 'admin' ? (barberos || []) : (barberos || []).filter(b => b.id === currentUser?.id)).map(barbero => {
                        const citasBarbero = citas?.filter(c => c.barbero_id === barbero.id) || [];

                        return (
                            <div key={barbero.id} className="min-w-[320px] w-80 space-y-6 animate-in slide-in-from-right-8 duration-500">
                                {/* Cabecera de Columna */}
                                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-[2rem] text-center space-y-2 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
                                    <div className="w-16 h-16 bg-slate-950 rounded-2xl mx-auto border border-white/5 flex items-center justify-center mb-2 shadow-2xl group-hover:scale-110 transition-transform">
                                        <User size={30} className="text-blue-500" />
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">{barbero.nombre_completo}</h3>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Sillón #{barbero.sillon_asignado}</span>
                                    <div className="pt-3 flex items-center justify-center gap-2">
                                        <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full text-[8px] font-black uppercase">{citasBarbero.length} Citas</span>
                                    </div>
                                </div>

                                {/* Listado de Citas en columna */}
                                <div className="space-y-4">
                                    {citasBarbero.length > 0 ? citasBarbero.map(cita => (
                                        <div
                                            key={cita.id}
                                            onClick={() => setViewingCita(cita)}
                                            className={`p-5 bg-[#0b0f1a]/40 border rounded-[2rem] space-y-4 hover:bg-[#0b0f1a]/80 transition-all cursor-pointer group animate-in zoom-in-95 ${cita.estado === 'pendiente' ? 'border-amber-500/20 shadow-lg shadow-amber-500/5' : 'border-white/5'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{cita.hora_inicio?.slice(0, 5)} HS</span>
                                                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${cita.estado === 'confirmada' ? 'text-green-500' : 'text-amber-500'}`}>{cita.estado}</span>
                                                </div>
                                                <div className="p-2 bg-slate-950/80 rounded-xl text-slate-600 group-hover:text-blue-500 transition-colors"><Eye size={16} /></div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-white italic truncate uppercase tracking-tighter">{cita.cliente_nombre}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{cita.servicio?.nombre}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5"><Phone size={10} /> WhatsApp</span>
                                                <span className="text-xs font-black text-white">${cita.servicio?.precio}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center rounded-[2rem] border-2 border-dashed border-white/5 opacity-20">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sin turnos</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {viewingCita && <AppointmentDetailModal cita={viewingCita} onClose={() => setViewingCita(null)} onAction={updateStatusMutation} readOnly={viewingCita.estado !== 'pendiente'} />}
            {isConfigOpen && <GlobalConfigModal onClose={() => setIsConfigOpen(false)} />}
        </div>
    );
};
