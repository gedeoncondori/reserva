import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../../lib/supabase';
import {
    User, CheckCircle, XCircle, Scissors, CreditCard, Plus,
    Settings, Image as ImageIcon, QrCode, Clock, X, Save, Loader2,
    ShieldCheck, Trash2, Mail, Lock, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { barberSchema } from '../schemas/barberSchema';
import { AdvancedScheduleManager } from '../components/AdvancedScheduleManager';
import { optimizeImage, getOptimizationOptions } from '../../../utils/imageOptimizer';

// ESQUEMA PARA ADMIN (Contraseña obligatoria al crear nuevo)
const adminBarberSchema = barberSchema.extend({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

const BarberScheduleModal = ({ barbero, onClose }: { barbero: any, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in-95">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative">
                <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white z-10"><X /></button>
                <div className="p-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Gestionar Jornada</h2>
                        <p className="text-blue-500 font-bold text-[10px] uppercase tracking-widest leading-none mt-1">{barbero.nombre_completo}</p>
                    </div>
                    <AdvancedScheduleManager barberoId={barbero.id} />
                </div>
            </div>
        </div>
    );
};

export const BarberosPage = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBarber, setEditingBarber] = useState<any>(null);
    const [scheduleBarber, setScheduleBarber] = useState<any>(null);

    const { data: barberos, isLoading } = useQuery({
        queryKey: ['barberos-admin'],
        queryFn: async () => {
            const { data, error } = await supabase.from('perfiles').select('*').order('creado_en', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>({
        resolver: zodResolver(editingBarber ? adminBarberSchema.partial() : adminBarberSchema) // Password solo obligatorio al crear
    });

    const upsertMutation = useMutation({
        mutationFn: async (data: any) => {
            const { password, ...profileData } = data;

            if (editingBarber) {
                // ACTUALIZAR PERFIL EXISTENTE
                const { error } = await (supabase.from('perfiles') as any).update(profileData).eq('id', editingBarber.id);
                if (error) throw error;
            } else {
                // 🚀 LLAMADA A LA EDGE FUNCTION PARA CREAR USUARIO + PERFIL
                const { data: fnData, error: fnError } = await supabase.functions.invoke('create-staff-v2', {
                    body: { ...data, rol: 'barbero' }
                });

                if (fnError) throw fnError;

                // El trigger se encarga de crear el perfil, pero actualizamos los datos extra (sillon, anticipo)
                const { error: profileError } = await (supabase.from('perfiles') as any)
                    .update({
                        sillon_asignado: data.sillon_asignado,
                        monto_adelanto_fijo: data.monto_adelanto_fijo
                    })
                    .eq('email', data.email);

                if (profileError) throw profileError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barberos-admin'] });
            toast.success(editingBarber ? "Cambios guardados" : "¡Personal registrado y cuenta activada!");
            closeModal();
        },
        onError: (err: any) => toast.error("Fallo al registrar: " + (err.message || "Email ya registrado"))
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // Borramos primero la cuenta de Auth (Idealmente vía Edge Function)
            const { error } = await (supabase.from('perfiles') as any).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barberos-admin'] });
            toast.success("Barbero eliminado");
        }
    });

    const uploadFile = useMutation({
        mutationFn: async ({ id, file, bucket, col }: { id: string, file: File, bucket: string, col: string }) => {
            // Determinar opciones de optimización según el bucket
            const type = bucket === 'avatars' ? 'avatar' : (bucket === 'payment-qrs' ? 'qr' : 'proof');
            const optimizedBlob = await optimizeImage(file, getOptimizationOptions(type as any));

            const path = `${id}-${Date.now()}.webp`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(path, optimizedBlob, {
                    contentType: 'image/webp',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
            await (supabase.from('perfiles') as any).update({ [col]: publicUrl }).eq('id', id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barberos-admin'] });
            toast.success("Archivo optimizado y subido con éxito");
        }
    });

    const openModal = (barber?: any) => {
        if (barber) {
            setEditingBarber(barber);
            reset({ nombre_completo: barber.nombre_completo, email: barber.email, sillon_asignado: barber.sillon_asignado, monto_adelanto_fijo: barber.monto_adelanto_fijo, estado: barber.estado });
        } else {
            setEditingBarber(null);
            reset({ nombre_completo: '', email: '', password: '', sillon_asignado: 1, monto_adelanto_fijo: 0, estado: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingBarber(null); };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Gestión de Staff</h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">Administración central de barberos</p>
                </div>
                <button onClick={() => openModal()} className="px-6 py-4 bg-blue-600 text-white font-black rounded-3xl shadow-[0_0_30px_rgba(37,99,235,0.2)] hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Plus size={18} />
                    Nuevo Registro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-900 animate-pulse rounded-[3rem] border border-slate-800" />) :
                    barberos?.map((barbero: any) => (
                        <div key={barbero.id} className="group relative bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-6 backdrop-blur-sm hover:border-blue-500/30 transition-all overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-6">
                                    <div className="relative group/avatar">
                                        <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                                            {barbero.foto_url ? <img src={barbero.foto_url} className="w-full h-full object-cover" /> : <User size={30} className="text-slate-800" />}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 rounded-lg cursor-pointer border-2 border-slate-900 opacity-0 group-hover/avatar:opacity-100 transition-all shadow-xl"><ImageIcon size={10} className="text-white" /><input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile.mutate({ id: barbero.id, file: f, bucket: 'avatars', col: 'foto_url' }) }} /></label>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { if (confirm("¿Eliminar barbero definitivamente?")) deleteMutation.mutate(barbero.id) }} className="p-2 text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        <span className={`px-2 py-1 h-fit rounded-lg text-[7px] font-black uppercase tracking-widest ${barbero.estado ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>{barbero.estado ? 'Activo' : 'Inactivo'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-white truncate uppercase tracking-tighter leading-none">{barbero.nombre_completo}</h3>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                                            <Mail size={12} className="text-blue-500/50" /> {barbero.email}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setScheduleBarber(barbero)} className="py-3 bg-slate-950 border border-slate-800/50 rounded-2xl text-[9px] font-black text-slate-400 hover:text-white hover:bg-slate-900 transition-all uppercase tracking-widest">Jornada</button>
                                        <button onClick={() => openModal(barbero)} className="py-3 bg-slate-950 border border-slate-800/50 rounded-2xl text-[9px] font-black text-slate-400 hover:text-white hover:bg-slate-900 transition-all uppercase tracking-widest">Perfil</button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-slate-950/50 rounded-3xl border border-slate-800/50 flex items-center justify-between group/qr hover:border-blue-500/20 transition-all">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-900 rounded-xl">
                                        <QrCode size={16} className={barbero.qr_pago_url ? 'text-blue-500' : 'text-slate-800'} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-600 uppercase">PAGO DIGITAL</span>
                                        <span className={`text-[9px] font-black uppercase ${barbero.qr_pago_url ? 'text-slate-300' : 'text-red-500/50'}`}>{barbero.qr_pago_url ? 'Configurado' : 'Pendiente'}</span>
                                    </div>
                                </div>
                                <label className="cursor-pointer p-2 bg-slate-900 rounded-xl text-slate-400 hover:text-blue-500 transition-all">
                                    <ImageIcon size={14} />
                                    <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile.mutate({ id: barbero.id, file: f, bucket: 'payment-qrs', col: 'qr_pago_url' }) }} />
                                </label>
                            </div>
                        </div>
                    ))
                }
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3.5rem] shadow-2xl p-10 overflow-hidden relative border-t-blue-500/30">
                        <button onClick={closeModal} className="absolute top-8 right-8 text-slate-600 hover:text-white transition-colors"><X size={24} /></button>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-1 bg-blue-600 rounded-full mb-6 opacity-20" />
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingBarber ? 'Actualizar Ficha' : 'Nuevo Barbero'}</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Imperio Barber Studio OS</p>
                        </div>

                        <form onSubmit={handleSubmit(data => upsertMutation.mutate(data))} className="space-y-4">
                            <div className="grid gap-4">
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input {...register('nombre_completo')} className="w-full p-4 pl-12 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all uppercase text-xs placeholder:text-slate-800" placeholder="Nombre Fantasía / Real" />
                                    {errors.nombre_completo && <span className="text-[8px] text-red-500 font-black uppercase ml-1 absolute -bottom-4 animate-bounce">{(errors.nombre_completo as any).message}</span>}
                                </div>

                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input {...register('email')} className="w-full p-4 pl-12 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all text-xs placeholder:text-slate-800" placeholder="Email de Usuario" />
                                </div>

                                {!editingBarber && (
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input type="password" {...register('password')} className="w-full p-4 pl-12 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all text-xs placeholder:text-slate-800" placeholder="Clave Personalizada" />
                                        {errors.password && <span className="text-[8px] text-red-500 font-black uppercase ml-1 absolute -bottom-4 animate-bounce">{(errors.password as any).message}</span>}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-700 uppercase ml-1">Sillón Asignado</label>
                                        <div className="relative">
                                            <input type="number" {...register('sillon_asignado', { valueAsNumber: true })} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500" />
                                            <Scissors size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-700 uppercase ml-1">Adelanto Fijo $</label>
                                        <div className="relative">
                                            <input type="number" {...register('monto_adelanto_fijo', { valueAsNumber: true })} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500" />
                                            <CreditCard size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl shadow-2xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.2em]">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    {editingBarber ? 'Actualizar Ficha' : 'Confirmar y Dar de Alta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {scheduleBarber && <BarberScheduleModal barbero={scheduleBarber} onClose={() => setScheduleBarber(null)} />}
        </div>
    );
};
