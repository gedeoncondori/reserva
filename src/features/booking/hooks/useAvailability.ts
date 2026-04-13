import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { getNowInTimezone, formatDateInTimezone, timeToMinutes } from '../../../utils/dateUtils';

type Cita = Database['public']['Tables']['citas']['Row'];
type Horario = Database['public']['Tables']['horarios_barbero']['Row'];

interface UseAvailabilityProps {
    barberoId: string | null;
    fecha: Date | null;
    duracionServicio: number | null;
}

const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const useAvailability = ({ barberoId, fecha, duracionServicio }: UseAvailabilityProps) => {
    return useQuery({
        queryKey: ['disponibilidad', barberoId, fecha?.toISOString().split('T')[0], duracionServicio],
        enabled: !!barberoId && !!fecha && !!duracionServicio,
        queryFn: async () => {
            // 0. Obtener zona horaria del proyecto
            const { data: configGlobal } = await supabase
                .from('configuracion_local')
                .select('zona_horaria')
                .single();

            const timezone = (configGlobal as any)?.zona_horaria || 'America/La_Paz';
            const now = getNowInTimezone(timezone);

            // La fecha seleccionada en react-day-picker SIEMPRE representa el día local. 
            // Si la pasamos por DateTimeFormat, puede sufrir desplazamientos horarios. Aseguramos el YYYY-MM-DD extraído nativamente:
            const dateStr = `${fecha!.getFullYear()}-${(fecha!.getMonth() + 1).toString().padStart(2, '0')}-${fecha!.getDate().toString().padStart(2, '0')}`;
            const diaSemana = fecha!.getDay();

            // Obtenemos YYYY-MM-DD de "hoy" según la zona horaria del local (La Paz)
            const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // 0.5 Verificar Días Especiales (Feriados / Cierres)
            const { data: diaEspecial } = await supabase
                .from('dias_especiales')
                .select('esta_abierto')
                .eq('fecha', dateStr)
                .maybeSingle();

            // Si el administrador marcó este día como "Día Especial" y "No Abierto", bloqueamos todo
            if (diaEspecial && !(diaEspecial as any).esta_abierto) {
                return [];
            }

            // 1. Obtener todos los bloques de horario del barbero para ese día (Soporte Turno Partido)
            const { data: bloquesHorario, error: hError } = await supabase
                .from('horarios_barbero')
                .select('*')
                .eq('barbero_id', barberoId as string)
                .eq('dia_semana', diaSemana)
                .eq('activo', true);

            if (hError || !bloquesHorario || bloquesHorario.length === 0) return [];

            // 2. Obtener citas existentes
            const { data: citas } = await supabase
                .from('citas')
                .select('hora_inicio, hora_fin, estado, expires_at')
                .eq('barbero_id', barberoId as string)
                .eq('fecha', dateStr)
                .neq('estado', 'rechazada')
                .neq('estado', 'cancelada')
                .neq('estado', 'cancelada_expirada');

            const existingSlots = (citas || [])
                .filter((c: any) => {
                    // Filtrado manual estricto por si la BD ignora el .not
                    if (['rechazada', 'cancelada', 'cancelada_expirada'].includes(c.estado)) {
                        return false;
                    }
                    // Si es temporal y ya expiró, liberamos el slot
                    if (c.estado === 'temporal' && c.expires_at) {
                        return new Date(c.expires_at) > now;
                    }
                    return true;
                })
                .map((c: any) => ({
                    start: timeToMinutes(c.hora_inicio),
                    end: timeToMinutes(c.hora_fin)
                }));

            const availableSlots: string[] = [];
            const step = duracionServicio!; // El salto es igual a la duración del servicio según solicitó el Arquitecto

            // 3. Obtener configuración del barbero (anticipación)
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('min_anticipacion_minutos')
                .eq('id', barberoId as string)
                .single();

            const minAnticipacion = (perfil as any)?.min_anticipacion_minutos || 0;

            // 4. Generar slots recorriendo cada bloque de horario
            (bloquesHorario as Horario[]).forEach(horario => {
                const totalDurationWithMargin = duracionServicio! + (horario.margen_minutos || 0);
                let t = timeToMinutes(horario.hora_inicio);
                const dayEnd = timeToMinutes(horario.hora_fin);

                // Algoritmo de "Empaquetado Fluido" (Greedy Gap Packing)
                while (t + totalDurationWithMargin <= dayEnd) {
                    const slotStart = t;
                    const slotEnd = t + totalDurationWithMargin;

                    // Verificamos todos los obstaculos en este posible turno
                    const colliders = existingSlots.filter((cita: any) =>
                        Math.max(slotStart, cita.start) < Math.min(slotEnd, cita.end)
                    );

                    if (colliders.length > 0) {
                        // Si choca, NO avanzamos un bloque irreal. Avanzamos exactamente
                        // a la hora en que termina la última cita que esté estorbando en este trayecto.
                        const maxEnd = Math.max(...colliders.map(c => c.end));
                        t = maxEnd;
                    } else {
                        // Si encontramos un buen hueco libre, validamos por último que
                        // cumpla con las horas de anticipación requeridas.
                        if (!isToday || slotStart >= currentMinutes + minAnticipacion) {
                            availableSlots.push(minutesToTime(slotStart));
                        }
                        // Saltamos un bloque entero para ofrecer un turno empaquetado continuo.
                        // (Ej: Si reservan a las 9:20, la siguiente opción fluida será 10:20)
                        // Para permitir máxima densidad, este paso podría reducirse (ej: t+=30), 
                        // pero avanzar por totalDuration asegura que ofrezcamos llenado de cero gaps.
                        t += totalDurationWithMargin;
                    }
                }
            });

            // Ordenar slots por si acaso hay solapamientos en los bloques
            return Array.from(new Set(availableSlots)).sort();
        }
    });
};
