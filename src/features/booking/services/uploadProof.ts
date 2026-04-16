import { supabase } from '../../../lib/supabase';
import { optimizeImage, getOptimizationOptions } from '../../../utils/imageOptimizer';

export const uploadProof = async (file: File, appointmentId: string) => {
    // 1. OPTIMIZACIÓN CLIENT-SIDE:
    // Antes de gastar datos del usuario o espacio en Supabase, pasamos la imagen original 
    // por nuestro optimizador 'optimizeImage'. Este reduce las dimensiones máximas (ej. 1200x1600)
    // y comprime al 70% de calidad en formato WebP. Un comprobante de 5MB puede bajar a ~150KB.
    const optimizedBlob = await optimizeImage(file, getOptimizationOptions('proof'));

    // 2. NOMENCLATURA ÚNICA:
    // WebP es el formato por defecto. Generamos un nombre único usando el ID de la cita
    // y un sufijo aleatorio para evitar colisiones si el usuario sube dos veces.
    const fileName = `${appointmentId}-${Math.random().toString(36).substring(2)}.webp`;
    const filePath = `${fileName}`; // Subimos al raíz del bucket 'comprobantes'

    // 3. ENVÍO A SUPABASE STORAGE:
    // Subimos el binario (Blob) optimizado. Declaramos explícitamente el contentType 'image/webp'
    // para que cuando se consulte la imagen, el navegador la entienda y renderice rapidísimo.
    const { error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(filePath, optimizedBlob, {
            contentType: 'image/webp'
        });

    if (uploadError) throw uploadError;

    // 4. RECUPERACIÓN DE URL:
    // Extraemos la variable pública (ya que nuestro bucket debe ser público o gestionado vía RLS)
    // para luego insertarla en nuestra base de datos (tabla citas -> comprobante_url).
    const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath);
    return data.publicUrl;
};
