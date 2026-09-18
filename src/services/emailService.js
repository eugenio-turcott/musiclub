import nodemailer from 'nodemailer';

/**
 * Obtiene o inicializa el transportador de correo electrónico adecuado:
 * 1. Resend / SMTP configurado en variables de entorno (GMAIL_USER/GMAIL_APP_PASSWORD o SMTP_HOST/SMTP_USER/SMTP_PASS)
 * 2. Si no hay variables de correo configuradas, genera automáticamente una cuenta de prueba
 *    con Ethereal Email que genera una URL pública para previsualizar el correo enviado en tiempo real.
 */
async function getTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

  if (gmailUser && gmailPass) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      }),
      from: `"Musiclub Estrenos" <${gmailUser}>`,
      isTest: false,
      provider: 'gmail',
    };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  if (smtpHost && smtpUser && smtpPass) {
    return {
      transporter: nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }),
      from: process.env.EMAIL_FROM || `"Musiclub" <${smtpUser}>`,
      isTest: false,
      provider: 'smtp',
    };
  }

  // Fallback transparente: Cuenta de prueba en Ethereal para tests instantáneos
  const testAccount = await nodemailer.createTestAccount();
  const testTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return {
    transporter: testTransporter,
    from: '"Musiclub Estrenos" <notificaciones@musiclub.org>',
    isTest: true,
    provider: 'ethereal',
  };
}

/**
 * Formatea una fecha ISO o string (ej. "2026-10-02") a texto en español ("2 de octubre de 2026")
 */
function formatReleaseDate(dateStr) {
  if (!dateStr) return 'Próximamente';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Genera la plantilla HTML responsive con diseño oscuro y cyberpunk de Musiclub
 */
function generateUpcomingConfirmationHtml({
  albumName,
  artistName,
  releaseDate,
  imageUrl,
  albumUrl,
  recipientEmail,
}) {
  const formattedDate = formatReleaseDate(releaseDate);
  const fallbackCover = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80';
  const coverSrc = imageUrl || fallbackCover;
  const siteUrl = 'https://www.musiclub.org';
  const targetUrl = albumUrl || siteUrl;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Estreno Confirmado - Musiclub</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070810;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #070810;
      padding: 40px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(145deg, #121428 0%, #0d0e1c 100%);
      border-radius: 24px;
      border: 1px solid rgba(245, 87, 108, 0.25);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    }
    .header {
      padding: 32px 32px 24px;
      text-align: center;
      background: linear-gradient(180deg, rgba(245, 87, 108, 0.12) 0%, rgba(0,0,0,0) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      background-color: rgba(245, 87, 108, 0.15);
      border: 1px solid rgba(245, 87, 108, 0.35);
      color: #f093fb;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .title {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    .content {
      padding: 32px;
    }
    .release-card {
      background: rgba(8, 9, 18, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 18px;
      padding: 20px;
      margin: 24px 0;
      display: table;
      width: 100%;
      box-sizing: border-box;
    }
    .cover-cell {
      display: table-cell;
      width: 110px;
      vertical-align: middle;
      text-align: center;
    }
    .cover-img {
      width: 100px;
      height: 100px;
      border-radius: 14px;
      object-fit: cover;
      box-shadow: 0 8px 20px rgba(0,0,0,0.6);
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: block;
    }
    .details-cell {
      display: table-cell;
      vertical-align: middle;
      padding-left: 20px;
    }
    .album-title {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 4px 0;
    }
    .artist-name {
      font-size: 14px;
      font-weight: 600;
      color: #38bdf8;
      margin: 0 0 12px 0;
    }
    .date-pill {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(251, 191, 36, 0.12);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 8px;
      color: #fbbf24;
      font-size: 12px;
      font-weight: 700;
    }
    .message-box {
      background: rgba(14, 16, 34, 0.7);
      border-left: 4px solid #f5576c;
      padding: 16px;
      border-radius: 0 12px 12px 0;
      margin: 20px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .button-wrapper {
      text-align: center;
      margin: 32px 0 16px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(245, 87, 108, 0.35);
      letter-spacing: 0.3px;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background-color: rgba(5, 6, 12, 0.6);
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #94a3b8;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <div class="badge">🔔 Notificación de Estreno Activada</div>
        <h1 class="title">¡Todo listo para el estreno!</h1>
        <p class="subtitle">Te avisaremos por correo en cuanto esté disponible para escuchar y calificar.</p>
      </div>

      <!-- CONTENT -->
      <div class="content">
        <p style="margin-top: 0; font-size: 15px; color: #e2e8f0; line-height: 1.6;">
          Hola, melómano de <strong>Musiclub</strong>:
        </p>

        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Has solicitado una alerta para el siguiente lanzamiento anticipado en nuestra plataforma comunitaria:
        </p>

        <!-- RELEASE CARD -->
        <div class="release-card">
          <div class="cover-cell">
            <img src="${coverSrc}" alt="${albumName}" class="cover-img" />
          </div>
          <div class="details-cell">
            <h2 class="album-title">${albumName}</h2>
            <p class="artist-name">${artistName}</p>
            <div class="date-pill">
              📅 Estreno: ${formattedDate}
            </div>
          </div>
        </div>

        <!-- CONFIRMATION MESSAGE -->
        <div class="message-box">
          <strong style="color: #ffffff; display: block; margin-bottom: 4px;">¿Cómo funciona esta notificación?</strong>
          El día del lanzamiento oficial, nuestro sistema diario de sincronización detectará la publicación del álbum y te enviará un correo automático a <span style="color: #38bdf8;">${recipientEmail}</span> con el acceso directo al disco y a la sección de reseñas para que puedas registrar tu calificación pista por pista y compartir tu veredicto.
        </div>

        <!-- CTA -->
        <div class="button-wrapper">
          <a href="${targetUrl}" class="button" target="_blank">
            Ver Lanzamiento en Musiclub
          </a>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <p style="margin: 0 0 8px 0;">
          <strong>Musiclub</strong> • El club y plataforma comunitaria para melómanos.
        </p>
        <p style="margin: 0;">
          Recibes este correo porque solicitaste una notificación de estreno en <a href="${siteUrl}">musiclub.org</a> para el correo ${recipientEmail}.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envía el correo de confirmación de suscripción al estreno anticipado
 */
export async function sendUpcomingConfirmationEmail({
  to,
  albumName,
  artistName,
  releaseDate,
  imageUrl,
  albumUrl,
}) {
  if (!to || !to.includes('@')) {
    throw new Error('Dirección de correo electrónico inválida.');
  }

  const { transporter, from, isTest, provider } = await getTransporter();

  const formattedDate = formatReleaseDate(releaseDate);
  const subject = `🔔 Confirmación: Te avisaremos cuando salga "${albumName}" de ${artistName}`;

  const html = generateUpcomingConfirmationHtml({
    albumName,
    artistName,
    releaseDate,
    imageUrl,
    albumUrl,
    recipientEmail: to,
  });

  const text = `
¡Notificación de Estreno Activada en Musiclub!

Hola, te confirmamos que hemos registrado tu recordatorio para el estreno de:
- Álbum: ${albumName}
- Artista: ${artistName}
- Fecha Prevista: ${formattedDate}

En cuanto el álbum salga a la luz oficialmente, te enviaremos un correo con el enlace directo para que seas el primero en escucharlo y calificarlo con la comunidad de Musiclub.

Visítanos en: https://www.musiclub.org
  `.trim();

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  let previewUrl = null;
  if (isTest) {
    previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n📬 [TEST EMAIL GENERADO] Correo de prueba para ${to}:`);
    console.log(`🔗 Ver previsualización web real: ${previewUrl}\n`);
  } else {
    console.log(`✅ Correo de confirmación enviado exitosamente a ${to} (MessageId: ${info.messageId}) vía ${provider}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    mode: isTest ? 'test' : 'production',
    provider,
    recipient: to,
  };
}
