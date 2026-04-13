import { Database } from '../../../types/supabase';
import { Clock, DollarSign } from 'lucide-react';

type Servicio = Database['public']['Tables']['servicios']['Row'];

interface Props {
    servicio: Servicio;
    onSelect: (s: Servicio) => void;
    isSelected?: boolean;
}

export const ServiceCard = ({ servicio, onSelect, isSelected }: Props) => {
    return (
        <div
            onClick={() => onSelect(servicio)}
            className={`
        relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300
        ${isSelected
                    ? 'border-blue-500 bg-blue-500/5 shadow-lg scale-[1.02]'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}
      `}
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{servicio.nombre}</h3>
                <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-sm font-semibold">
                    ${servicio.precio}
                </span>
            </div>

            <p className="text-zinc-400 text-sm mb-6 line-clamp-2">
                {servicio.descripcion || 'Servicio profesional de alta calidad en Imperio Barber Studio.'}
            </p>

            <div className="flex items-center text-zinc-500 text-sm gap-4">
                <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{servicio.duracion_minutos} min</span>
                </div>
                <div className="flex items-center gap-1">
                    <DollarSign size={16} />
                    <span>Anticipo: ${Math.floor(Number(servicio.precio) * 0.5)}</span>
                </div>
            </div>
        </div>
    );
};
