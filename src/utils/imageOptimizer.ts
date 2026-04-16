/**
 * Utility to optimize images before uploading to Supabase Storage.
 * Resizes images and converts them to WebP (if supported) or JPEG with compression.
 */

interface OptimizeOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export const optimizeImage = async (
    file: File,
    options: OptimizeOptions = {}
): Promise<Blob> => {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        format = 'image/webp'
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // 1. DIBUJO Y ESCALADO (Canvas API):
                // Usamos el lienzo virtual (canvas) del navegador web, no requerimos de un servidor
                // ni de Node.js para achicar la imagen. El navegador es súper rápido redimensionando píxeles.
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Aquí "dibujamos" la foto original pero comprimida contra los límites width/height
                ctx.drawImage(img, 0, 0, width, height);

                // 2. CONVERSIÓN Y CALIDAD (toBlob):
                // Agarramos el lienzo ya dibujado al nuevo tamaño y le pedimos al explorador
                // que lo comprima a un archivo binario final (Blob). 
                // - format: image/webp o image/jpeg.
                // - quality: 0.7 o 0.8 destrozan el peso final del archivo, bajando de MegaBytes a simples Kilobytes sin que el ojo humano note caídas graves.
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas toBlob failed'));
                        }
                    },
                    format,
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * Helper to determine the best options based on the target usage
 */
export const getOptimizationOptions = (type: 'avatar' | 'proof' | 'qr'): OptimizeOptions => {
    switch (type) {
        case 'avatar':
            return { maxWidth: 500, maxHeight: 500, quality: 0.8, format: 'image/webp' };
        case 'proof':
            return { maxWidth: 1200, maxHeight: 1600, quality: 0.7, format: 'image/webp' };
        case 'qr':
            return { maxWidth: 1000, maxHeight: 1000, quality: 0.95, format: 'image/webp' };
        default:
            return { maxWidth: 1200, maxHeight: 1200, quality: 0.8, format: 'image/webp' };
    }
};
