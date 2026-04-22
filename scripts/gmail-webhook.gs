// ============================================================
// GOOGLE APPS SCRIPT - Webhook para envío de emails via Gmail
// ============================================================
// INSTRUCCIONES DE DESPLIEGUE:
// 1. Ve a https://script.google.com
// 2. Crea un nuevo proyecto
// 3. Pega este código completo
// 4. Click en "Implementar" > "Nueva implementación"
// 5. Tipo: "Aplicación web"
// 6. Ejecutar como: "Yo" (tu cuenta)
// 7. Acceso: "Cualquier persona"
// 8. Click "Implementar" y copia la URL generada
// 9. Guarda esa URL en Supabase vault (ver migración SQL)
// ============================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var emails = data.emails; // Array de { to, subject, html }
    
    var sentCount = 0;
    
    for (var i = 0; i < emails.length; i++) {
      var email = emails[i];
      try {
        GmailApp.sendEmail(email.to, email.subject, '', {
          htmlBody: email.html,
          name: 'Imperio Barber Studio'
        });
        sentCount++;
      } catch (err) {
        console.log('Error enviando a ' + email.to + ': ' + err.message);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, sent: sentCount }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function (ejecutar manualmente para verificar permisos)
function testSend() {
  var result = doPost({
    postData: {
      contents: JSON.stringify({
        emails: [{
          to: 'jcct51066@gmail.com',
          subject: '✅ Test - Imperio Barber Studio',
          html: '<h1>¡Funciona!</h1><p>El sistema de notificaciones está activo.</p>'
        }]
      })
    }
  });
  Logger.log(result.getContent());
}
