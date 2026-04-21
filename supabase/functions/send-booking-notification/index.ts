import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// @ts-ignore
Deno.serve(async (req: Request) => {
    try {
        const body = await req.json();
        const { record, old_record, type } = body;

        if (!RESEND_API_KEY) {
            console.error("Falta RESEND_API_KEY");
            return new Response(JSON.stringify({ error: "No API Key" }), { status: 500 });
        }

        const emailsToSend: any[] = [];

        // ============================================================
        // CASO 1: RECORDATORIO 30 MIN ANTES (type = 'REMINDER')
        // Disparado por pg_cron via enviar_recordatorios_30min()
        // ============================================================
        if (type === 'REMINDER') {
            emailsToSend.push({
                to: [record.cliente_email],
                subject: "⏰ Recordatorio: Tu cita es en 30 minutos",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0e17; color: #f1f5f9; border-radius: 16px;">
                    <h1 style="color: #fff; margin-bottom: 8px;">¡Hola ${record.cliente_nombre}!</h1>
                    <p style="color: #94a3b8;">Este es un recordatorio amigable de que tu cita en <b style="color: #3b82f6;">Imperio Barber Studio</b> es en aproximadamente <b style="color: #f59e0b;">30 minutos</b>.</p>
                    <p style="color: #94a3b8;">¡Te esperamos puntual!</p>
                    <hr style="border-color: #1e293b;" />
                    <p style="color: #64748b; font-size: 12px;"><b>Detalles:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}</p>
                  </div>
                `
            });
        }

        // ============================================================
        // CASOS 2-4: CAMBIOS DE ESTADO (type = 'UPDATE')
        // Disparado por el trigger tr_send_notification
        // ============================================================
        if (type === 'UPDATE') {
            const statusChanged = record.estado !== old_record?.estado;

            // CASO 2: temporal -> pendiente (Cliente subió comprobante)
            if (statusChanged && record.estado === 'pendiente') {
                // Email al Cliente
                emailsToSend.push({
                    to: [record.cliente_email],
                    subject: "¡Hemos recibido tu reserva! 💈",
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0e17; color: #f1f5f9; border-radius: 16px;">
                        <h1 style="color: #fff;">Hola ${record.cliente_nombre},</h1>
                        <p style="color: #94a3b8;">Gracias por elegir <b style="color: #3b82f6;">Imperio Barber Studio</b>. Hemos recibido tu solicitud de reserva y el comprobante de pago.</p>
                        <p style="color: #94a3b8;">Nuestro equipo lo revisará a la brevedad y recibirás otro correo confirmando tu cita.</p>
                        <hr style="border-color: #1e293b;" />
                        <p style="color: #64748b; font-size: 12px;"><b>Detalles:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}</p>
                      </div>
                    `
                });

                // Email al Barbero asignado
                if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
                    try {
                        const barberoRes = await fetch(
                            `${SUPABASE_URL}/rest/v1/perfiles?id=eq.${record.barbero_id}&select=email,nombre_completo`,
                            {
                                headers: {
                                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        const barberos = await barberoRes.json();
                        const barbero = barberos?.[0];

                        if (barbero?.email) {
                            emailsToSend.push({
                                to: [barbero.email],
                                subject: "¡Nueva reserva entrante! 💈",
                                html: `
                                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0e17; color: #f1f5f9; border-radius: 16px;">
                                    <h1 style="color: #fff;">Hola ${barbero.nombre_completo},</h1>
                                    <p style="color: #94a3b8;">El cliente <b style="color: #3b82f6;">${record.cliente_nombre}</b> ha reservado un horario y enviado su comprobante.</p>
                                    <p style="color: #94a3b8;">Ingresa al panel de <b style="color: #3b82f6;">Imperio</b> para validar el pago y confirmar la cita.</p>
                                    <hr style="border-color: #1e293b;" />
                                    <p style="color: #64748b; font-size: 12px;"><b>Turno:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}<br/>Cliente: ${record.cliente_nombre}<br/>Tel: ${record.cliente_celular}</p>
                                  </div>
                                `
                            });
                        }
                    } catch (err) {
                        console.error("Error al consultar barbero:", err);
                    }
                }
            }

            // CASO 3: pendiente -> confirmada (Admin aprobó pago)
            if (statusChanged && record.estado === 'confirmada') {
                emailsToSend.push({
                    to: [record.cliente_email],
                    subject: "¡Cita Confirmada! Te esperamos ✂️",
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0e17; color: #f1f5f9; border-radius: 16px;">
                        <h1 style="color: #fff;">¡Todo listo, ${record.cliente_nombre}!</h1>
                        <p style="color: #94a3b8;">Tu pago ha sido validado. Tu cita está <b style="color: #22c55e;">CONFIRMADA</b>.</p>
                        <p style="color: #94a3b8;">¡Nos vemos en el estudio!</p>
                        <hr style="border-color: #1e293b;" />
                        <p style="color: #64748b; font-size: 12px;"><b>Resumen:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}</p>
                      </div>
                    `
                });
            }

            // CASO 4: pendiente -> rechazada (Admin rechazó)
            if (statusChanged && record.estado === 'rechazada') {
                emailsToSend.push({
                    to: [record.cliente_email],
                    subject: "Actualización sobre tu reserva ⚠️",
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0e17; color: #f1f5f9; border-radius: 16px;">
                        <h1 style="color: #fff;">Hola ${record.cliente_nombre},</h1>
                        <p style="color: #94a3b8;">Lo sentimos, no hemos podido validar tu reserva. Esto puede deberse a un error en el comprobante o en los montos.</p>
                        <p style="color: #94a3b8;">Contacta con nosotros vía WhatsApp para resolverlo.</p>
                      </div>
                    `
                });
            }
        }

        // Sin emails que enviar
        if (emailsToSend.length === 0) {
            return new Response(JSON.stringify({ message: "No action required" }), { status: 200 });
        }

        // Enviar todos los correos en paralelo
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

        const results = await Promise.allSettled(sendPromises);
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        console.log(`Emails enviados: ${successCount}/${emailsToSend.length}`);

        return new Response(JSON.stringify({ success: true, sent: successCount, total: emailsToSend.length }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Edge Function global error:", error);
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
});
