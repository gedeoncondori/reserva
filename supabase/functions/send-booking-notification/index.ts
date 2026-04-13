import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore: Deno is a global in Supabase Edge Functions
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// @ts-ignore
Deno.serve(async (req: Request) => {
    const { record, old_record, type } = await req.json();

    // Si no hay API KEY, fallamos silenciosamente (para desarrollo local)
    if (!RESEND_API_KEY) {
        console.error("Falta RESEND_API_KEY en variables de entorno");
        return new Response(JSON.stringify({ error: "No API Key" }), { status: 500 });
    }

    // Identificar el cambio de estado
    const statusChanged = record.estado !== old_record?.estado;
    const isNew = type === 'INSERT' && record.estado === 'pendiente';

    let subject = "";
    let html = "";

    if (isNew) {
        subject = "¡Hemos recibido tu reserva! 💈";
        html = `
      <h1>Hola ${record.cliente_nombre},</h1>
      <p>Gracias por elegir Imperio Barber Studio. Hemos recibido tu solicitud de reserva y comprobante.</p>
      <p>Nuestro equipo revisará el pago en breve y recibirás otro correo confirmando tu cita.</p>
      <hr />
      <p><b>Detalles:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}</p>
    `;
    } else if (statusChanged && record.estado === 'confirmada') {
        subject = "¡Cita Confirmada! Te esperamos ✂️";
        html = `
      <h1>¡Todo listo, ${record.cliente_nombre}!</h1>
      <p>Tu pago ha sido validado correctamente. Tu cita está <b>confirmada</b>.</p>
      <p>¡Nos vemos en el estudio!</p>
      <hr />
      <p><b>Resumen:</b><br/>Fecha: ${record.fecha}<br/>Hora: ${record.hora_inicio}<br/>Barbero: ${record.barbero_id}</p>
    `;
    } else if (statusChanged && record.estado === 'rechazada') {
        subject = "Actualización sobre tu reserva ⚠️";
        html = `
      <h1>Hola ${record.cliente_nombre},</h1>
      <p>Lo sentimos, no hemos podido validar tu reserva. Esto puede deberse a un error en el comprobante o en los datos.</p>
      <p>Por favor, contacta con nosotros vía WhatsApp para resolverlo.</p>
    `;
    } else {
        return new Response(JSON.stringify({ message: "No action required" }), { status: 200 });
    }

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: "Imperio Barber Studio <onboarding@resend.dev>", // Cambiar por dominio verificado en Resend
            to: [record.cliente_email],
            subject: subject,
            html: html,
        }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
    });
});
