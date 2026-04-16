import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBookingStore } from '../../../store/useBookingStore';
import { checkoutSchema, CheckoutForm } from '../schemas/checkoutSchema';
import { uploadProof } from '../services/uploadProof';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { User, Mail, Phone, Upload, CheckCircle2, QrCode, ArrowLeft, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

export const BookingCheckout = () => {
    const { servicio, barbero, fecha, hora, appointmentId, setAppointmentId, prevStep, reset } = useBookingStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment'>(appointmentId ? 'payment' : 'details');
    const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds

    const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
        resolver: zodResolver(checkoutSchema)
    });

    // Timer logic for the temporal block
    useEffect(() => {
        if (checkoutStep === 'payment' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            toast.error("El tiempo de reserva ha expirado. Por favor, selecciona el horario nuevamente.");
            reset();
        }
    }, [checkoutStep, timeLeft, reset]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLockSlot = async (values: CheckoutForm) => {
        if (!barbero || !servicio || !fecha || !hora) return;

        setIsSubmitting(true);
        try {
            // Fin estimado
            const [h, m] = hora.split(':').map(Number);
            const endMins = h * 60 + m + servicio.duracion_minutos;
            const horaFin = `${Math.floor(endMins / 60).toString().padStart(2, '0')}:${(endMins % 60).toString().padStart(2, '0')}`;

            const expiresAt = addMinutes(new Date(), 10).toISOString();

            // EXPLICACIÓN DE RESERVA SIN REGISTRO:
            // Para evitar la fricción de que los clientes tengan que crear un usuario e iniciar sesión,
            // permitimos que envíen sus datos (nombre, email, celular) como parte directa del formulario de checkout (values).
            // La base de datos guarda esta información directamente en la tabla de 'citas' en vez de vincularla a un 'user_id' de Auth.
            // Para prevenir reservas falsas, el estado inicial es 'temporal' y tiene un tiempo de expiración (expires_at).
            const { data, error } = await (supabase.from('citas') as any).insert({
                barbero_id: barbero.id,
                servicio_id: servicio.id,
                fecha: format(fecha, 'yyyy-MM-dd'),
                hora_inicio: hora,
                hora_fin: horaFin,
                estado: 'temporal', // Se bloquea el turno por 10 minutos
                // Guardamos los datos del cliente anónimo de forma cruda en vez de requerir uuid
                cliente_nombre: values.nombre,
                cliente_email: values.email,
                cliente_celular: values.celular,
                expires_at: expiresAt
            }).select().single();

            if (error) throw error;

            setAppointmentId(data.id);
            setCheckoutStep('payment');
            toast.success("¡Horario bloqueado! Tienes 10 minutos para completar el pago.");
        } catch (err: any) {
            console.error(err);
            toast.error("Este horario ya no está disponible. Por favor elige otro.");
            prevStep();
        } finally {
            setIsSubmitting(false);
        }
    };

    const onFinalSubmit = async () => {
        if (!file) {
            toast.error("Por favor, sube el comprobante de tu pago QR");
            return;
        }
        if (!appointmentId) return;

        setIsSubmitting(true);
        try {
            // 1. Subir imagen al Storage
            const publicUrl = await uploadProof(file, appointmentId);

            // 2. Actualizar la cita a pendiente (para revisión de barbero)
            const { error } = await (supabase.from('citas') as any)
                .update({
                    comprobante_url: publicUrl,
                    estado: 'pendiente',
                    expires_at: null // Quitar expiración ya que se completó
                })
                .eq('id', appointmentId);

            if (error) throw error;

            setIsSuccess(true);
            toast.success("¡Reserva confirmada! En breve recibirás un email.");
        } catch (err: any) {
            console.error(err);
            toast.error("Error al procesar la reserva. Intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-md mx-auto text-center py-12 space-y-6 animate-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">¡Reserva Enviada!</h2>
                <p className="text-slate-400 text-sm">
                    Hemos recibido tu comprobante. Nuestro equipo validará el pago en unos minutos y recibirás una notificación de confirmación.
                </p>
                <button
                    onClick={reset}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20"
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={prevStep}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Finalizar Reserva</h2>
                    <p className="text-slate-400 text-sm">
                        {checkoutStep === 'details'
                            ? "Introduce tus datos para bloquear tu horario."
                            : "Tu horario está reservado. Adjunta el comprobante para finalizar."}
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Formulario / Pago */}
                <div className="lg:col-span-3 space-y-6">
                    {checkoutStep === 'details' ? (
                        <form onSubmit={handleSubmit(handleLockSlot)} className="space-y-6 bg-[#0b0f1a]/50 p-6 sm:p-10 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <User size={14} className="text-blue-500" /> Nombre Completo
                                    </label>
                                    <input
                                        {...register('nombre')}
                                        placeholder="Ej. Juan Pérez"
                                        className={`w-full bg-slate-950 border ${errors.nombre ? 'border-red-500/50' : 'border-white/5'} focus:border-blue-500 p-4 rounded-2xl outline-none transition-all font-bold text-white text-sm`}
                                    />
                                    {errors.nombre && <p className="text-red-500 text-[10px] font-bold ml-1 uppercase">{errors.nombre.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Phone size={14} className="text-blue-500" /> Celular / WhatsApp
                                    </label>
                                    <input
                                        {...register('celular')}
                                        placeholder="Ej. 70012345"
                                        className={`w-full bg-slate-950 border ${errors.celular ? 'border-red-500/50' : 'border-white/5'} focus:border-blue-500 p-4 rounded-2xl outline-none transition-all font-bold text-white text-sm`}
                                    />
                                    {errors.celular && <p className="text-red-500 text-[10px] font-bold ml-1 uppercase">{errors.celular.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Mail size={14} className="text-blue-500" /> Correo Electrónico
                                </label>
                                <input
                                    {...register('email')}
                                    placeholder="juan@ejemplo.com"
                                    className={`w-full bg-slate-950 border ${errors.email ? 'border-red-500/50' : 'border-white/5'} focus:border-blue-500 p-4 rounded-2xl outline-none transition-all font-bold text-white text-sm`}
                                />
                                {errors.email && <p className="text-red-500 text-[10px] font-bold ml-1 uppercase">{errors.email.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Proceder al Pago"}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Pago Stage */}
                            <div className="bg-[#0b0f1a]/80 p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8">
                                <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                                            <Clock size={24} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Tiempo Restante</span>
                                            <span className="text-2xl font-black text-white tabular-nums">{formatTime(timeLeft)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</span>
                                        <span className="text-xs font-black text-amber-500 uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                            Bloqueado
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                        <Upload size={16} className="text-blue-500" /> Adjunta Comprobante de Pago
                                    </label>
                                    <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/5 rounded-[2.5rem] hover:bg-slate-950/50 transition-all cursor-pointer group bg-slate-950/20 overflow-hidden">
                                        <div className="flex flex-col items-center justify-center text-center p-6">
                                            <div className="p-4 bg-slate-900 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
                                                <Upload className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                                {file ? <span className="text-blue-500 underline">{file.name}</span> : "Haz clic o arrastra tu captura"}
                                            </p>
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>

                                <button
                                    onClick={onFinalSubmit}
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 text-white font-black rounded-2xl shadow-2xl shadow-green-600/30 transition-all flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Finalizar Reserva"}
                                </button>

                                <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
                                    Al hacer clic, nuestro equipo recibirá los datos para validarlos.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Resumen y QR */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0b0f1a]/60 p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-inner overflow-hidden relative">
                        {/* Blur effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] -mr-16 -mt-16" />

                        <div className="text-center space-y-2 relative">
                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">Monto Adelanto (50%)</p>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-xl font-bold text-blue-500 mb-2">$</span>
                                <h3 className="text-5xl font-black text-white tracking-tighter italic">{Math.floor(Number(servicio?.precio || 0) * 0.5)}</h3>
                            </div>
                        </div>

                        <div className="relative group bg-white rounded-[2.5rem] shadow-2xl shadow-blue-600/10 overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                            <img
                                src={barbero?.qr_pago_url || 'https://via.placeholder.com/200?text=QR+No+Disponible'}
                                alt="QR de Pago"
                                className="w-full aspect-square object-cover"
                            />
                        </div>

                        <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-[10px] tracking-widest uppercase">
                                <span className="text-slate-500 font-black">Barbero</span>
                                <span className="text-white font-black">{barbero?.nombre_completo}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] tracking-widest uppercase">
                                <span className="text-slate-500 font-black">Servicio</span>
                                <span className="text-white font-black">{servicio?.nombre}</span>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase">Horario</span>
                                <span className="text-white font-black italic">{hora} HS</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                            <p className="text-[9px] text-amber-500/80 font-bold uppercase leading-tight">
                                Transfiere el monto exacto para una validación inmediata.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
