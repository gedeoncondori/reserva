// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// ... (el resto queda igual)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";



// ----- DEPRECADO (RESEND API) -----
// const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// ----- CONFIGURACIÓN GMAIL SMTP -----
const GMAIL_USER = Deno.env.get("GMAIL_USER"); // Ej: tudireccion@gmail.com
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD"); // App password de Google (16 caracteres, sin espacios)

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// @ts-ignore
Deno.serve(async (req: Request) => {
    const { record, old_record, type } = await req.json();

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        console.error("Faltan GMAIL_USER o GMAIL_APP_PASSWORD en las variables de entorno de Supabase.");
        return new Response(JSON.stringify({ error: "SMTP no configurado" }), { status: 500 });
    }

    const statusChanged = record.estado !== old_record?.estado;

    // IMPORTANTE: Ahora la reserva nace como "temporal" (INSERT) y pasa a "pendiente" (UPDATE)
    const isNewBookingConfirmed = type === 'UPDATE' && statusChanged && record.estado === 'pendiente';

    // Casos manejados por el admin
    const isApprovedByAdmin = statusChanged && record.estado === 'confirmada';
    const isRejectedByAdmin = statusChanged && record.estado === 'rechazada';

    // Caso de recordatorio automático (pg_cron)
    const isReminder = type === 'REMINDER';

    const emailsToSend: any[] = [];

    if (isNewBookingConfirmed) {
        // Enviar alerta SOLAMENTE al barbero (Evitamos correos redundantes al cliente)
        const { data: barbero } = await supabase
            .from('perfiles')
            .select('email, nombre_completo')
            .eq('id', record.barbero_id)
            .single();

        if (barbero && barbero.email) {
            emailsToSend.push({
                to: barbero.email,
                subject: `¡Nueva reserva entrante!💈`,
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
            to: record.cliente_email,
            subject: "¡Cita Confirmada! Te esperamos✂️",
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
            to: record.cliente_email,
            subject: "Actualización sobre tu reserva⚠️",
            html: `
              <h1>Hola ${record.cliente_nombre},</h1>
              <p>Lo sentimos, no hemos podido validar tu reserva. Esto puede deberse a un error en el comprobante subido o en los montos.</p>
              <p>Por favor, contacta con nosotros vía WhatsApp directamente para resolverlo de inmediato.</p>
            `
        });
    } else if (isReminder) {
        emailsToSend.push({
            to: record.cliente_email,
            subject: "⏰ Recordatorio: ¡Tu cita es en Media Hora!",
            html: `
              <h1>¡Hola ${record.cliente_nombre}!</h1>
              <p>Te recordamos que tienes una cita programada con nosotros en aproximadamente 30 minutos.</p>
              <p><b>Por favor, sé puntual para no perder tu turno y garantizar la mejor atención.</b></p>
              <hr />
              <p><b>Detalles:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}</p>
              <p>¡Nos vemos pronto en Imperio Barber Studio!</p>
            `
        });
    }

    if (emailsToSend.length === 0) {
        return new Response(JSON.stringify({ message: "No action required" }), { status: 200 });
    }

    // --- CÓDIGO DE ENVÍO DE EMAIL ---
    try {
        const client = new SmtpClient();

        await client.connectTLS({
            hostname: "smtp.gmail.com",
            port: 465,
            username: GMAIL_USER,
            password: GMAIL_APP_PASSWORD,
        });

        for (const emailData of emailsToSend) {
            await client.send({
                from: `Imperio Barber Studio <${GMAIL_USER}>`,
                to: emailData.to,
                subject: emailData.subject,
                content: "Tu proveedor de e-mail no soporta formato HTML. Contacta a la barbería.",
                html: emailData.html
            });
        }

        await client.close();

        /* 
        // --- DEPRECADO (MÉTODO ANTERIOR CON RESEND API) ---
        const sendPromises = emailsToSend.map(emailData => 
            fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "Imperio Barber Studio <onboarding@resend.dev>", 
                    to: [emailData.to],
                    subject: emailData.subject,
                    html: emailData.html
                }),
            })
        );
        await Promise.all(sendPromises); 
        */

        return new Response(JSON.stringify({ success: true, sent: emailsToSend.length }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error SMTP al enviar email:", error.message || error);
        return new Response(JSON.stringify({ error: "Failed to send emails via Gmail" }), { status: 500 });
    }
});
