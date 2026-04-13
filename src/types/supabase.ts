export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            perfiles: {
                Row: {
                    id: string
                    nombre_completo: string
                    rol: 'admin' | 'barbero'
                    foto_url: string | null
                    qr_pago_url: string | null
                    sillon_asignado: string | null
                    estado: boolean
                    min_anticipacion_minutos: number
                    ventana_reserva_dias: number
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['perfiles']['Row'], 'id' | 'created_at'> & { id?: string }
                Update: Partial<Database['public']['Tables']['perfiles']['Insert']>
            }
            servicios: {
                Row: {
                    id: string
                    nombre: string
                    duracion_minutos: number
                    precio: number
                    monto_adelanto_fijo: number
                    estado: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['servicios']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['servicios']['Insert']>
            }
            horarios_barbero: {
                Row: {
                    id: string
                    barbero_id: string
                    dia_semana: number
                    hora_inicio: string
                    hora_fin: string
                    margen_minutos: number
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['horarios_barbero']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['horarios_barbero']['Insert']>
            }
            citas: {
                Row: {
                    id: string
                    barbero_id: string
                    servicio_id: string
                    fecha: string
                    hora_inicio: string
                    hora_fin: string
                    cliente_nombre: string
                    cliente_email: string
                    cliente_celular: string
                    comprobante_url: string | null
                    estado: 'temporal' | 'pendiente' | 'confirmada' | 'rechazada' | 'cancelada' | 'cancelada_expirada'
                    token_seguimiento: string
                    expires_at: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['citas']['Row'], 'id' | 'created_at' | 'token_seguimiento'> & { token_seguimiento?: string }
                Update: Partial<Database['public']['Tables']['citas']['Insert']>
            }
        }
    }
}
