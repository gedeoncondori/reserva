import { supabase } from '../../../lib/supabase';
import { optimizeImage, getOptimizationOptions } from '../../../utils/imageOptimizer';

export const uploadProof = async (file: File, appointmentId: string) => {
    // Optimizar imagen antes de subir
    const optimizedBlob = await optimizeImage(file, getOptimizationOptions('proof'));

    // WebP es el formato por defecto en nuestra optimización
    const fileName = `${appointmentId}-${Math.random().toString(36).substring(2)}.webp`;
    const filePath = `${fileName}`; // Subimos al raíz del bucket 'comprobantes'

    const { error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(filePath, optimizedBlob, {
            contentType: 'image/webp'
        });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath);
    return data.publicUrl;
};
