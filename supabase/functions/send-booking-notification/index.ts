import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// @ts-ignore
Deno.serve(async (req: Request) => {
    const { record, old_record, type } = await req.json();

    if (!RESEND_API_KEY) {
        console.error("Falta RESEND_API_KEY en variables de entorno");
        return new Response(JSON.stringify({ error: "No API Key" }), { status: 500 });
    }

    const statusChanged = record.estado !== old_record?.estado;

    // IMPORTANTE: La reserva nace como "temporal" (INSERT) y pasa a "pendiente" (UPDATE)
    // cuando el cliente sube su comprobante. El trigger de "Nueva Reserva" es el UPDATE a pendiente.
    const isNewBookingConfirmed = type === 'UPDATE' && statusChanged && record.estado === 'pendiente';
    const isApprovedByAdmin = statusChanged && record.estado === 'confirmada';
    const isRejectedByAdmin = statusChanged && record.estado === 'rechazada';

    const emailsToSend: any[] = [];

    if (isNewBookingConfirmed) {
        // 1. Correo al Cliente
        emailsToSend.push({
            to: [record.cliente_email],
            subject: "¡Hemos recibido tu reserva! 💈",
            html: `
              <h1>Hola ${record.cliente_nombre},</h1>
              <p>Gracias por elegir Imperio Barber Studio. Hemos recibido tu solicitud de reserva y el comprobante de pago.</p>
              <p>Nuestro equipo lo revisará a la brevedad y recibirás otro correo confirmando definitivamente tu cita.</p>
              <hr />
              <p><b>Detalles:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}</p>
            `
        });

        // 2. Alerta al Barbero asignado
        const { data: barbero } = await supabase
            .from('perfiles')
            .select('email, nombre_completo')
            .eq('id', record.barbero_id)
            .single();

        if (barbero && barbero.email) {
            emailsToSend.push({
                to: [barbero.email],
                subject: `¡Nueva reserva entrante! 💈`,
                html: `
                  <h1>Hola ${barbero.nombre_completo},</h1>
                  <p>El cliente <b>${record.cliente_nombre}</b> ha reservado un horario y enviado su comprobante de pago.</p>
                  <p>Por favor, ingresa al panel de Imperio a la sección de tu Agenda para validar el pago y confirmar su cita.</p>
                  <hr />
                  <p><b>Detalles del Turno:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}<br/>Teléfono del cliente: ${record.cliente_celular}</p>
                `
            });
        }
    } else if (isApprovedByAdmin) {
        emailsToSend.push({
            to: [record.cliente_email],
            subject: "¡Cita Confirmada! Te esperamos ✂️",
            html: `
              <h1>¡Todo listo, ${record.cliente_nombre}!</h1>
              <p>Tu pago ha sido validado correctamente. Tu cita está <b>confirmada</b>.</p>
              <p>¡Nos vemos en el estudio!</p>
              <hr />
              <p><b>Resumen:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}</p>
            `
        });
    } else if (isRejectedByAdmin) {
        emailsToSend.push({
            to: [record.cliente_email],
            subject: "Actualización sobre tu reserva ⚠️",
            html: `
              <h1>Hola ${record.cliente_nombre},</h1>
              <p>Lo sentimos, no hemos podido validar tu reserva. Esto puede deberse a un error en el comprobante subido o en los montos.</p>
              <p>Por favor, contacta con nosotros vía WhatsApp directamente para resolverlo de inmediato.</p>
            `
        });
    }

    if (emailsToSend.length === 0) {
        return new Response(JSON.stringify({ message: "No action required" }), { status: 200 });
    }

    try {
        const sendPromises = emailsToSend.map(emailData =>
            fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "Imperio Barber Studio <onboarding@resend.dev>",
                    ...emailData
                }),
            })
        );
        await Promise.all(sendPromises);

        return new Response(JSON.stringify({ success: true, sent: emailsToSend.length }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Resend API error:", error);
        return new Response(JSON.stringify({ error: "Failed to send emails" }), { status: 500 });
    }
});
