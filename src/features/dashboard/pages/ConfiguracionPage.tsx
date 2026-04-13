import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { AdvancedScheduleManager } from '../components/AdvancedScheduleManager';
import { BarberBookingConfig } from '../components/BarberBookingConfig';
import { GlobalAdminConfig } from '../components/GlobalAdminConfig';
import { User, Mail, Save, Loader2, ShieldCheck, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export const ConfiguracionPage = () => {
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                supabase.from('perfiles').select('*').eq('id', user.id).single()
                    .then(({ data }) => setCurrentUser(data));
            }
        });
    }, []);

    if (!currentUser) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest leading-none">Sincronizando...</p>
        </div>
    );

    return (
        <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header unificado */}
            <div className="space-y-1 border-b border-white/5 pb-8">
                <h1 className="text-4xl font-black text-white italic truncate uppercase tracking-tighter leading-none">Mi Perfil</h1>
                <p className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.4em]">Configuración de disponibilidad y jornada</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Lateral: Info Profile */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="w-full bg-[#0b0f1a]/40 border border-white/5 rounded-[2.5rem] p-10 text-center relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]" />

                        <div className="relative inline-block mb-8">
                            <div className="w-32 h-32 bg-slate-950 rounded-[2rem] border-2 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                {currentUser.foto_url ? (
                                    <img src={currentUser.foto_url} className="w-full h-full object-cover" alt="Perfil" />
                                ) : (
                                    <User size={50} className="text-slate-900" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2.5 rounded-2xl border-4 border-[#070a13] text-white shadow-xl">
                                <ShieldCheck size={18} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{currentUser.nombre_completo}</h2>
                        <div className="flex items-center justify-center gap-2 mt-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">
                            <Mail size={12} className="text-blue-500" /> {currentUser.email}
                        </div>

                        <div className="mt-10 pt-10 border-t border-white/5 space-y-5">
                            <div className="flex items-center justify-between px-2 text-[10px]">
                                <span className="font-black text-slate-500 uppercase tracking-widest">Sillón</span>
                                <span className="bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-xl font-black border border-blue-500/20 shadow-lg shadow-blue-500/5">#{currentUser.sillon_asignado || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between px-2 text-[10px]">
                                <span className="font-black text-slate-500 uppercase tracking-widest">Estado</span>
                                <span className="text-green-500 font-black uppercase flex items-center gap-2.5 tracking-widest italic">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.3)]" /> En Línea
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0b0f1a]/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center gap-4 group hover:bg-[#0b0f1a]/60 transition-all">
                        <div className="p-5 bg-slate-950/80 rounded-[2rem] border border-white/5 shadow-inner transform group-hover:rotate-6 transition-transform">
                            <QrCode size={48} className={currentUser.qr_pago_url ? "text-blue-500" : "text-slate-900"} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">QR de Pago</p>
                            <p className="text-[8px] font-bold text-slate-600 uppercase">
                                {currentUser.qr_pago_url ? "Viculado" : "Pendiente"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Section: Configs */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    {currentUser.rol === 'admin' && <GlobalAdminConfig />}

                    <BarberBookingConfig
                        barberoId={currentUser.id}
                        initialConfig={{
                            min_anticipacion_minutos: currentUser.min_anticipacion_minutos || 60,
                            ventana_reserva_dias: currentUser.ventana_reserva_dias || 14
                        }}
                    />
                    <div className="bg-[#0b0f1a]/20 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                        <AdvancedScheduleManager barberoId={currentUser.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};
