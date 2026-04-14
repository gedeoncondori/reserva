import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { ServiceCard } from './ServiceCard';
import { useBookingStore } from '../../../store/useBookingStore';
import { Database } from '../../../types/supabase';

type Servicio = Database['public']['Tables']['servicios']['Row'];

export const ServiceList = () => {
    const { setServicio, servicio: selected } = useBookingStore();

    const { data: servicios, isLoading } = useQuery<Servicio[]>({
        queryKey: ['servicios'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('servicios')
                .select('*')
                .eq('activo', true)
                .order('precio', { ascending: true });
            if (error) throw error;
            return data || [];
        },
    });

    if (isLoading) return (
        <div className="grid gap-4 md:grid-cols-2 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-zinc-800 rounded-2xl" />
            ))}
        </div>
    );

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {servicios?.map((s) => (
                <ServiceCard
                    key={s.id}
                    servicio={s}
                    onSelect={setServicio}
                    isSelected={selected?.id === s.id}
                />
            ))}
        </div>
    );
};
