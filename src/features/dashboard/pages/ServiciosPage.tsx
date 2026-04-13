import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../../lib/supabase';
import { Scissors, Clock, DollarSign, Plus, Settings2, Eye, EyeOff, X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { serviceSchema, type ServiceFormData } from '../schemas/serviceSchema';

export const ServiciosPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any | null>(null);
    const queryClient = useQueryClient();

    const { data: servicios, isLoading } = useQuery({
        queryKey: ['servicios-admin'],
        queryFn: async () => {
            const { data, error } = await (supabase.from('servicios') as any).select('*').order('precio', { ascending: true });
            if (error) throw error;
            return data;
        }
    });

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: { activo: true, precio: 0, duracion_minutos: 30 }
    });

    // Mutación: Guardar (Crear o Editar)
    const upsertMutation = useMutation({
        mutationFn: async (data: ServiceFormData) => {
            let error;
            if (editingService) {
                ({ error } = await (supabase.from('servicios') as any).update(data).eq('id', editingService.id));
            } else {
                ({ error } = await (supabase.from('servicios') as any).insert([data]));
            }
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicios-admin'] });
            toast.success(editingService ? "Servicio actualizado" : "Servicio creado");
            closeModal();
        },
        onError: (err: any) => toast.error("Error al guardar: " + err.message)
    });

    // Mutación: Toggle Activo
    const toggleMutation = useMutation({
        mutationFn: async ({ id, activo }: { id: string, activo: boolean }) => {
            const { error } = await (supabase.from('servicios') as any).update({ activo }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicios-admin'] });
            toast.success("Disponibilidad actualizada");
        }
    });

    const openModal = (service?: any) => {
        if (service) {
            setEditingService(service);
            reset({
                nombre: service.nombre,
                descripcion: service.descripcion || '',
                precio: service.precio,
                duracion_minutos: service.duracion_minutos,
                activo: service.activo
            });
        } else {
            setEditingService(null);
            reset({ nombre: '', descripcion: '', precio: 0, duracion_minutos: 30, activo: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Catálogo de Servicios</h1>
                    <p className="text-slate-500">Configura precios, duraciones y disponibilidad.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-slate-950 font-bold rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                    <Plus size={20} />
                    <span>Nuevo Servicio</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-900/50 rounded-3xl animate-pulse" />)
                ) : servicios?.map((servicio: any) => (
                    <div
                        key={servicio.id}
                        className={`
              group p-6 bg-slate-900/40 border rounded-3xl backdrop-blur-sm transition-all flex items-center gap-6
              ${servicio.activo ? 'border-slate-800 hover:border-blue-500/30' : 'border-red-500/10 opacity-60'}
            `}
                    >
                        <div className={`p-4 rounded-2xl border ${servicio.activo ? 'bg-slate-950 border-slate-800 text-blue-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                            <Scissors size={28} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white truncate">{servicio.nombre}</h3>
                                {!servicio.activo && <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full font-bold uppercase">Oculto</span>}
                            </div>
                            <div className="flex gap-4 text-xs font-medium text-slate-500 mt-1">
                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /> {servicio.duracion_minutos} min</span>
                                <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-green-500" /> ${servicio.precio}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleMutation.mutate({ id: servicio.id, activo: !servicio.activo })}
                                className="p-3 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-2xl transition-all"
                            >
                                {servicio.activo ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            <button
                                onClick={() => openModal(servicio)}
                                className="p-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-2xl transition-all border border-blue-500/10"
                            >
                                <Settings2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white">{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                                <p className="text-slate-500 text-sm">Define los detalles del servicio.</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit((data) => upsertMutation.mutate(data))} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
                                    <input {...register('nombre')} className="w-full mt-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" />
                                    {errors.nombre && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.nombre.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Precio ($)</label>
                                        <input type="number" {...register('precio')} className="w-full mt-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Duración (min)</label>
                                        <input type="number" {...register('duracion_minutos')} className="w-full mt-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción</label>
                                    <textarea {...register('descripcion')} className="w-full mt-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500 transition-all resize-none" rows={3} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
