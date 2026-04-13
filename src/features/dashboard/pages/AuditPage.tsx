import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { History, User, Activity, Clock, ShieldCheck } from 'lucide-react';

export const AuditPage = () => {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('log_auditoria')
                .select(`
          *,
          perfiles (nombre_completo, rol)
        `)
                .order('creado_en', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <ShieldCheck className="text-blue-500" size={32} />
                    Log de Auditoría
                </h1>
                <p className="text-slate-500">Registro histórico de acciones y cambios en el sistema.</p>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-slate-900/50 rounded-2xl animate-pulse" />)}
                </div>
            ) : logs && logs.length > 0 ? (
                <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/50">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Fecha / Hora</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Usuario</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Acción</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {logs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">
                                                    {format(new Date(log.creado_en), "d 'de' MMM", { locale: es })}
                                                </span>
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Clock size={10} /> {format(new Date(log.creado_en), "HH:mm:ss")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                                    <User size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-200">{log.perfiles?.nombre_completo || 'Sistema'}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{log.perfiles?.rol || 'Auto'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                <Activity size={10} className="text-blue-500" />
                                                {log.accion.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-slate-400 max-w-xs truncate lg:max-w-md">
                                                {log.detalles?.estado_nuevo && (
                                                    <p>
                                                        Cambio el estado a <span className="text-blue-400 font-bold">{log.detalles.estado_nuevo}</span> de la cita de <span className="text-white">{log.detalles.cliente}</span>
                                                    </p>
                                                )}
                                                {!log.detalles?.estado_nuevo && JSON.stringify(log.detalles)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                    <History size={48} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-500">No hay registros de auditoría todavía.</p>
                </div>
            )}
        </div>
    );
};
