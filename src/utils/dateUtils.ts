/**
 * Utilidades de fecha optimizadas con soporte para Zona Horaria nativa.
 * Evitamos librerías pesadas usando la API Intl de JavaScript.
 */

// Obtenemos la fecha y hora actual en una zona horaria específica
export const getNowInTimezone = (timezone: string = 'America/La_Paz'): Date => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const dateMap: { [key: string]: string } = {};
    parts.forEach(part => {
        dateMap[part.type] = part.value;
    });

    return new Date(
        parseInt(dateMap.year),
        parseInt(dateMap.month) - 1,
        parseInt(dateMap.day),
        parseInt(dateMap.hour),
        parseInt(dateMap.minute),
        parseInt(dateMap.second)
    );
};

// Formatea una fecha a YYYY-MM-DD en la zona horaria del proyecto
export const formatDateInTimezone = (date: Date, timezone: string = 'America/La_Paz'): string => {
    const formatter = new Intl.DateTimeFormat('en-CA', { // format yyyy-mm-dd
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(date);
};

// Convierte una hora "HH:mm" a minutos totales
export const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};
