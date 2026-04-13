import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { BarberCard } from './BarberCard';
import { useBookingStore } from '../../../store/useBookingStore';
import { ArrowLeft } from 'lucide-react';

export const BarberList = () => {
    const { setBarbero, barbero: selected, prevStep } = useBookingStore();

    const { data: barberos, isLoading } = useQuery({
        queryKey: ['barberos'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .eq('rol', 'barbero')
                .eq('estado', true);
            if (error) throw error;
            return data;
        },
    });

    if (isLoading) return (
        <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-zinc-800 rounded-2xl" />
            ))}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={prevStep}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white">Elige tu barbero</h2>
                    <p className="text-slate-400">Cada profesional tiene su propio estilo y disponibilidad.</p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {barberos?.map((b) => (
                    <BarberCard
                        key={b.id}
                        barbero={b}
                        onSelect={setBarbero}
                        isSelected={selected?.id === b.id}
                    />
                ))}
            </div>
        </div>
    );
};
