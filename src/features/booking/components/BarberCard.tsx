import { Database } from '../../../types/supabase';
import { User } from 'lucide-react';

type Barbero = Database['public']['Tables']['perfiles']['Row'];

interface Props {
    barbero: Barbero;
    onSelect: (b: Barbero) => void;
    isSelected?: boolean;
}

export const BarberCard = ({ barbero, onSelect, isSelected }: Props) => {
    return (
        <div
            onClick={() => onSelect(barbero)}
            className={`
        relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-4
        ${isSelected
                    ? 'border-blue-500 bg-blue-500/5 shadow-lg scale-[1.02]'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}
      `}
        >
            <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {barbero.foto_url ? (
                    <img src={barbero.foto_url} alt={barbero.nombre_completo} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-8 h-8 text-slate-500" />
                )}
            </div>

            <div className="flex-1">
                <h3 className="font-bold text-white">{barbero.nombre_completo}</h3>
                <p className="text-sm text-slate-500">Sillón: {barbero.sillon_asignado || 'N/A'}</p>
            </div>

            {isSelected && (
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            )}
        </div>
    );
};
