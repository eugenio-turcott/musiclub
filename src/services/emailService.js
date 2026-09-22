import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

/**
 * MUSICLUB EMAIL SERVICE V.9.2
 * Paleta Oficial:
 * - #FFDBE6 (Rosa pastel suave / texto de realce / badges suaves)
 * - #F57FA2 (Rosa vibrante / botón primario CTA / acento y bordes luminosos)
 * - #56408B (Lavanda real / violeta medio / bordes secundarios de tarjetas)
 * - #5A2D7C (Púrpura imperial profundo / fondos de cabecera / sombras)
 * - #171433 (Azul noche profundo / fondo de contenedor principal / tarjetas)
 * - #000000 (Negro azabache / fondo exterior de página / contraste total)
 */

export const MUSICLUB_COLORS = {
  softBlush: '#FFDBE6',
  vibrantRose: '#F57FA2',
  mutedViolet: '#56408B',
  deepPurple: '#5A2D7C',
  nightNavy: '#171433',
  pitchBlack: '#000000',
  white: '#FFFFFF',
};

export const MUSICLUB_ASSETS = {
  logoCorchea: 'https://www.musiclub.org/musiclub_logo_corchea.png',
  logoFull: 'https://www.musiclub.org/musiclub_logo.png',
  siteUrl: 'https://www.musiclub.org',
};

/**
 * Diccionario Multilingüe I18N para plantillas de correo
 */
const I18N = {
  es: {
    upcomingConfirm: {
      badge: '🔔 RECORDATORIO DE ESTRENO',
      title: '¡Te avisaremos en cuanto se estrene!',
      subtitle:
        'Has activado la notificación para este esperado lanzamiento musical:',
      dateLabel: 'Fecha Oficial de Estreno',
      note: 'Apenas den las 12:00 AM del día del estreno, recibirás un correo especial para que seas de los primeros en escucharlo y calificarlo en Musiclub.',
      cta: 'Ver Ficha en Musiclub',
    },
    upcomingReleaseDay: {
      badge: '🎉 ¡HOY ES EL ESTRENO OFICIAL!',
      title: '¡Ya está disponible para escuchar y calificar!',
      subtitle:
        'Son las 12:00 AM y el álbum que estabas esperando acaba de ver la luz:',
      dateLabel: 'Estreno Oficial Hoy',
      note: 'Sé de los primeros en puntuar cada canción, dejar tu opinión y registrar tu reseña con las 6 notas de producción.',
      cta: 'Escuchar y Calificar Álbum Ahora',
    },
    poolWinner: {
      badge: '🏆 NUEVO GANADOR DEL POOL DE LA SEMANA',
      title: '¡El Club tiene un nuevo disco oficial para escuchar!',
      subtitle:
        'La ruleta de la comunidad ha decidido el álbum estelar de esta semana:',
      nominatedBy: 'Nominado por',
      description:
        'Durante esta semana, todos los miembros del club escucharemos este álbum, comentaremos sus mejores canciones y dejaremos nuestra reseña con las 6 notas maestras de producción.',
      listenOn: 'Disponible para escuchar en:',
      cta: 'Ir al Pool y Dejar mi Reseña',
    },
    poolGraduated: {
      badge: '🎓 RESULTADOS Y GRADUACIÓN DEL POOL',
      title: '¡El álbum se gradúa con honores en Musiclub!',
      subtitle:
        'Ha finalizado la semana oficial de escucha del Pool. Aquí tienes los resultados finales de la comunidad:',
      nominatedBy: 'Nominado por',
      finalScore: 'Calificación Final del Club',
      totalReviews: 'Reseñas registradas',
      breakdownTitle: 'Desglose por Pilares de Producción',
      prod: 'Producción',
      comp: 'Composición',
      lyrics: 'Letras',
      orig: 'Originalidad',
      cohesion: 'Cohesión',
      replay: 'Replay Value',
      topTracks: 'Canciones Favoritas de la Comunidad',
      quotes: 'Opiniones Destacadas de los Miembros',
      cta: 'Ver Todos los Resultados en Musiclub',
    },
    songRec: {
      badge: '💌 CARTITA MUSICAL DEL BUZÓN',
      title: '¡Te han recomendado una canción especial!',
      from: 'De parte de',
      subtitle:
        'Un compañero de Musiclub ha pensado en ti y te dedicó esta joyita musical:',
      dedication: 'Dedicatoria personal',
      listenOn: 'Escuchar en tu plataforma preferida:',
      cta: 'Abrir mi Buzón Musical en Musiclub',
    },
    patchNotes: {
      badge: '✨ NOVEDADES Y MEJORAS DE MUSICLUB',
      subtitle:
        'Preparamos nuevas funciones, mejoras y sorpresas para disfrutar al máximo del club:',
      whatsNew: 'Lo más destacado de esta versión:',
      cta: 'Ver Notas de Versión en la Web',
    },
    footer: {
      tagline: 'Comunidad de Melómanos, Reseñas y Álbumes de Música',
      rights: 'Todos los derechos reservados.',
      preferences: 'Gestionar notificaciones',
    },
  },
  en: {
    upcomingConfirm: {
      badge: '🔔 RELEASE REMINDER',
      title: "We'll notify you as soon as it drops!",
      subtitle:
        'You have activated a notification for this upcoming music release:',
      dateLabel: 'Official Release Date',
      note: 'At 12:00 AM on the day of release, you will receive a special email so you can be among the first to listen and review it on Musiclub.',
      cta: 'View Album on Musiclub',
    },
    upcomingReleaseDay: {
      badge: '🎉 OFFICIAL RELEASE DAY!',
      title: 'It is finally here! Listen & review now!',
      subtitle:
        'It is 12:00 AM and the album you have been waiting for has just arrived:',
      dateLabel: 'Official Release Today',
      note: 'Be among the first to score every track, share your thoughts, and submit your 6 production pillar ratings.',
      cta: 'Listen & Review Album Now',
    },
    poolWinner: {
      badge: '🏆 NEW WEEKLY POOL WINNER',
      title: 'The Club has chosen its new official album of the week!',
      subtitle:
        'The community roulette has selected this week’s featured album:',
      nominatedBy: 'Nominated by',
      description:
        'During this week, all club members will listen to this record, discuss its best tracks, and submit their reviews across the 6 production criteria.',
      listenOn: 'Listen now on:',
      cta: 'Go to Pool & Submit Review',
    },
    poolGraduated: {
      badge: '🎓 POOL RESULTS & GRADUATION',
      title: 'The album graduates with honors on Musiclub!',
      subtitle:
        'The official listening week has ended. Here are the final community results and scores:',
      nominatedBy: 'Nominated by',
      finalScore: 'Final Club Community Score',
      totalReviews: 'Total Member Reviews',
      breakdownTitle: 'Production Pillars Breakdown',
      prod: 'Production',
      comp: 'Composition',
      lyrics: 'Lyrics',
      orig: 'Originality',
      cohesion: 'Cohesion',
      replay: 'Replay Value',
      topTracks: 'Community Favorite Tracks',
      quotes: 'Member Highlight Quotes',
      cta: 'View Full Results on Musiclub',
    },
    songRec: {
      badge: '💌 MUSICAL MAILBOX POSTCARD',
      title: 'Someone recommended a special track for you!',
      from: 'From',
      subtitle: 'A fellow Musiclub member dedicated this musical gem to you:',
      dedication: 'Personal dedication',
      listenOn: 'Listen on your preferred platform:',
      cta: 'Open My Musical Mailbox',
    },
    patchNotes: {
      badge: "✨ MUSICLUB WHAT'S NEW",
      subtitle:
        'Check out the new features, performance upgrades, and community improvements:',
      whatsNew: 'Highlights of this version:',
      cta: 'View Release Notes on the Web',
    },
    footer: {
      tagline: 'Music Enthusiasts, In-Depth Reviews & Album Community',
      rights: 'All rights reserved.',
      preferences: 'Manage notifications',
    },
  },
  pt: {
    upcomingConfirm: {
      badge: '🔔 LEMBRETE DE LANÇAMENTO',
      title: 'Avisaremos você assim que for lançado!',
      subtitle: 'Você ativou a notificação para este lançamento aguardado:',
      dateLabel: 'Data Oficial de Lançamento',
      note: 'Assim que der meia-noite (12:00 AM) no dia do lançamento, você receberá um e-mail especial para ser um dos primeiros a ouvir e avaliar no Musiclub.',
      cta: 'Ver no Musiclub',
    },
    upcomingReleaseDay: {
      badge: '🎉 HOJE É O LANÇAMENTO OFICIAL!',
      title: 'Já está disponível para ouvir e avaliar!',
      subtitle: 'É meia-noite e o álbum que você esperava acaba de chegar:',
      dateLabel: 'Lançamento Oficial Hoje',
      note: 'Seja um dos primeiros a pontuar cada faixa, opinar e enviar sua resenha com os 6 pilares de produção.',
      cta: 'Ouvir e Avaliar Álbum Agora',
    },
    poolWinner: {
      badge: '🏆 NOVO VENCEDOR DO POOL DA SEMANA',
      title: 'O Clube tem um novo álbum oficial para ouvir!',
      subtitle: 'A roleta da comunidade escolheu o álbum da semana:',
      nominatedBy: 'Indicado por',
      description:
        'Durante esta semana, todos os membros do clube ouvirão este álbum e enviarão suas resenhas com os 6 pilares de produção.',
      listenOn: 'Disponível para ouvir em:',
      cta: 'Ir ao Pool e Enviar Resenha',
    },
    poolGraduated: {
      badge: '🎓 RESULTADOS E GRADUAÇÃO DO POOL',
      title: 'O álbum se gradua com honras no Musiclub!',
      subtitle:
        'A semana de audição terminou. Confira os resultados finais da comunidade:',
      nominatedBy: 'Indicado por',
      finalScore: 'Nota Final do Clube',
      totalReviews: 'Resenhas de membros',
      breakdownTitle: 'Desglose por Pilares de Produção',
      prod: 'Produção',
      comp: 'Composição',
      lyrics: 'Letras',
      orig: 'Originalidade',
      cohesion: 'Coesão',
      replay: 'Replay Value',
      topTracks: 'Faixas Favoritas da Comunidade',
      quotes: 'Citações em Destaque',
      cta: 'Ver Resultados Completos no Musiclub',
    },
    songRec: {
      badge: '💌 CARTÃO MUSICAL DO CORREIO',
      title: 'Recomendaram uma faixa especial para você!',
      from: 'De',
      subtitle:
        'Um colega do Musiclub dedicou esta preciosidade musical para você:',
      dedication: 'Dedicatória pessoal',
      listenOn: 'Ouça na sua plataforma preferida:',
      cta: 'Abrir Meu Correio Musical',
    },
    patchNotes: {
      badge: '✨ NOVIDADES DO MUSICLUB',
      subtitle: 'Novos recursos, melhorias e surpresas preparadas para você:',
      whatsNew: 'Destaques desta versão:',
      cta: 'Ver Notas de Lançamento na Web',
    },
    footer: {
      tagline: 'Comunidade de Melômanos, Resenhas e Álbuns',
      rights: 'Todos os direitos reservados.',
      preferences: 'Gerenciar notificações',
    },
  },
  fr: {
    upcomingConfirm: {
      badge: '🔔 RAPPEL DE SORTIE',
      title: 'Nous vous préviendrons dès sa sortie !',
      subtitle:
        'Vous avez activé une notification pour cette sortie musicale :',
      dateLabel: 'Date de Sortie Officielle',
      note: "Dès minuit (12h00 AM) le jour de la sortie, vous recevrez un e-mail pour faire partie des premiers à l'écouter et le noter sur Musiclub.",
      cta: 'Voir sur Musiclub',
    },
    upcomingReleaseDay: {
      badge: "🎉 AUJOURD'HUI SORTIE OFFICIELLE !",
      title: 'Il est enfin disponible à l’écoute et à la notation !',
      subtitle:
        "Il est minuit et l'album que vous attendiez vient de paraître :",
      dateLabel: "Sortie Officielle Aujourd'hui",
      note: 'Soyez parmi les premiers à noter chaque titre et partager votre critique avec les 6 critères de production.',
      cta: "Écouter et Noter l'Album",
    },
    poolWinner: {
      badge: '🏆 NOUVEAU GAGNANT DU POOL DE LA SEMAINE',
      title: 'Le Club a son nouvel album officiel de la semaine !',
      subtitle:
        'La roulette communautaire a désigné l’album de cette semaine :',
      nominatedBy: 'Proposé par',
      description:
        'Cette semaine, tous les membres du club écouteront cet album et laisseront leur critique avec les 6 piliers de production.',
      listenOn: 'Disponible à l’écoute sur :',
      cta: 'Aller au Pool et Noter',
    },
    poolGraduated: {
      badge: '🎓 RÉSULTATS ET GRADUATION DU POOL',
      title: 'L’album est diplômé avec mention sur Musiclub !',
      subtitle:
        'La semaine d’écoute est terminée. Voici les résultats finaux de la communauté :',
      nominatedBy: 'Proposé par',
      finalScore: 'Note Finale du Club',
      totalReviews: 'Critiques des membres',
      breakdownTitle: 'Détail des Critères de Production',
      prod: 'Production',
      comp: 'Composition',
      lyrics: 'Paroles',
      orig: 'Originalité',
      cohesion: 'Cohésion',
      replay: 'Replay Value',
      topTracks: 'Morceaux Favoris de la Communauté',
      quotes: 'Citations Marquantes',
      cta: 'Voir les Résultats Complets',
    },
    songRec: {
      badge: '💌 CARTE POSTALE MUSICALE',
      title: 'On vous a recommandé un morceau spécial !',
      from: 'De la part de',
      subtitle:
        'Un membre de Musiclub a pensé à vous et vous a dédié ce joyau musical :',
      dedication: 'Dédicace personnelle',
      listenOn: 'Écoutez sur votre plateforme préférée :',
      cta: 'Ouvrir Ma Boîte Musicale',
    },
    patchNotes: {
      badge: '✨ NOUVEAUTÉS MUSICLUB',
      subtitle:
        'Découvrez les nouvelles fonctionnalités et améliorations du club :',
      whatsNew: 'Points forts de cette version :',
      cta: 'Voir les Notes de Version sur le Web',
    },
    footer: {
      tagline: 'Communauté de Mélomanes, Critiques et Albums',
      rights: 'Tous droits réservés.',
      preferences: 'Gérer les notifications',
    },
  },
};

/**
 * Obtiene el paquete de cadenas en el idioma solicitado con fallback a español
 */
function getI18n(lang = 'es') {
  const clean = (lang || 'es').toLowerCase().slice(0, 2);
  return I18N[clean] || I18N.es;
}

/**
 * Transportador SMTP con Brevo, Gmail o Ethereal fallback
 */
export async function getTransporter() {
  const defaultSender =
    process.env.EMAIL_FROM || '"Musiclub" <notificaciones@musiclub.org>';
  const defaultReplyTo = process.env.REPLY_TO || 'eugenioturcott@gmail.com';

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER || process.env.SMTOP_USER;
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
      from: defaultSender,
      replyTo: defaultReplyTo,
      isTest: false,
      provider: 'smtp',
    };
  }

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
      from: process.env.EMAIL_FROM || `"Musiclub" <${gmailUser}>`,
      replyTo: defaultReplyTo,
      isTest: false,
      provider: 'gmail',
    };
  }

  // Fallback para pruebas locales (Ethereal)
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
    from: defaultSender,
    replyTo: defaultReplyTo,
    isTest: true,
    provider: 'ethereal',
  };
}

/**
 * Prepara los recursos gráficos como archivos incrustados (CID Attachments).
 * Esto evita que proxies de correo o demoras en la emisión de certificados SSL
 * de subdominios rompan la carga de imágenes.
 */
export async function prepareAttachmentsAndImages({ imageUrl } = {}) {
  const attachments = [];
  let logoUrl = MUSICLUB_ASSETS.logoCorchea;
  let coverUrl = imageUrl || null;

  try {
    const localLogoPath = path.resolve(
      process.cwd(),
      'public',
      'musiclub_logo_corchea.png'
    );
    if (fs.existsSync(localLogoPath)) {
      attachments.push({
        filename: 'musiclub_logo_corchea.png',
        path: localLogoPath,
        cid: 'musiclub_logo',
      });
      logoUrl = 'cid:musiclub_logo';
    }
  } catch (err) {
    console.warn(
      'Aviso: no se pudo adjuntar logo local como CID:',
      err.message
    );
  }

  if (
    imageUrl &&
    (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))
  ) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length > 0 && buffer.length < 5 * 1024 * 1024) {
          attachments.push({
            filename: 'cover.jpg',
            content: buffer,
            cid: 'album_cover',
          });
          coverUrl = 'cid:album_cover';
        }
      }
    } catch (err) {
      console.warn(
        'Aviso: no se pudo precargar portada externa para CID:',
        err.message
      );
    }
  }

  return { attachments, logoUrl, coverUrl };
}

/**
 * Formatea fechas según el locale
 */
export function formatReleaseDate(dateStr, lang = 'es') {
  if (!dateStr) return lang === 'en' ? 'Coming Soon' : 'Próximamente';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const locale = lang.startsWith('en')
        ? 'en-US'
        : lang.startsWith('pt')
          ? 'pt-BR'
          : lang.startsWith('fr')
            ? 'fr-FR'
            : 'es-ES';
      return d.toLocaleDateString(locale, {
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
 * Genera el elemento visual de Disco de Vinilo Audiófilo + Portada del Álbum
 */
function renderVinylCoverComponent({ imageUrl, albumName, size = 140 }) {
  const fallbackCover =
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80';
  const coverSrc = imageUrl || fallbackCover;
  const vinylSize = Math.round(size * 0.92);
  const grooveRingSize = Math.round(vinylSize * 0.68);
  const labelSize = Math.round(vinylSize * 0.36);
  const holeSize = Math.round(labelSize * 0.22);

  return `
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; text-align: center;">
      <tr>
        <td valign="middle" align="center" style="padding: 10px 0;">
          <table cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <!-- Portada del Álbum (Funda / Sleeve) -->
              <td valign="middle" align="center" style="padding: 0; line-height: 0;">
                <img 
                  src="${coverSrc}" 
                  alt="${albumName || 'Álbum'}" 
                  width="${size}" 
                  height="${size}" 
                  style="width: ${size}px; height: ${size}px; border-radius: 14px; display: block; border: 2px solid ${MUSICLUB_COLORS.vibrantRose}; box-shadow: 0 16px 36px rgba(0,0,0,0.85); object-fit: cover;" 
                />
              </td>
              <!-- Disco de Vinilo Audiófilo deslizándose elegantemente -->
              <td valign="middle" align="center" style="padding-left: 6px; line-height: 0;">
                <div style="width: ${vinylSize}px; height: ${vinylSize}px; border-radius: 50%; background-color: #000000; background: radial-gradient(circle, #000000 0%, #171433 32%, #000000 48%, #56408B 52%, #000000 64%, #171433 76%, #000000 100%); border: 3px solid ${MUSICLUB_COLORS.mutedViolet}; box-shadow: 0 14px 30px rgba(0,0,0,0.9), inset 0 0 8px rgba(245,127,162,0.3); text-align: center; margin: 0 auto; position: relative;">
                  <!-- Surcos del Vinilo -->
                  <div style="width: ${grooveRingSize}px; height: ${grooveRingSize}px; border-radius: 50%; border: 1px solid rgba(255,219,230,0.18); margin: ${Math.round((vinylSize - grooveRingSize) / 2) - 3}px auto 0 auto; text-align: center;">
                    <!-- Galleta Central (Center Label) en Púrpura y Rosa -->
                    <div style="width: ${labelSize}px; height: ${labelSize}px; border-radius: 50%; background-color: ${MUSICLUB_COLORS.deepPurple}; background: linear-gradient(135deg, ${MUSICLUB_COLORS.vibrantRose} 0%, ${MUSICLUB_COLORS.deepPurple} 100%); border: 1px solid ${MUSICLUB_COLORS.softBlush}; margin: ${Math.round((grooveRingSize - labelSize) / 2) - 1}px auto 0 auto; text-align: center;">
                      <!-- Orificio Central del Tocadiscos -->
                      <div style="width: ${holeSize}px; height: ${holeSize}px; border-radius: 50%; background-color: #000000; border: 1px solid ${MUSICLUB_COLORS.softBlush}; margin: ${Math.round((labelSize - holeSize) / 2) - 1}px auto 0 auto;"></div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Plantilla Base HTML con la Paleta Oficial #FFDBE6, #F57FA2, #56408B, #5A2D7C, #171433, #000000
 */
function wrapEmailHtml({
  badgeText,
  titleText,
  subtitleText,
  contentHtml,
  ctaText,
  ctaUrl,
  lang = 'es',
  logoUrl,
}) {
  const i18n = getI18n(lang);
  const activeLogo = logoUrl || MUSICLUB_ASSETS.logoCorchea;

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleText}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${MUSICLUB_COLORS.pitchBlack};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #FFFFFF;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    a { text-decoration: none; }
    .btn-cta:hover {
      background-color: #f796b2 !important;
      transform: scale(1.02);
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${MUSICLUB_COLORS.pitchBlack};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${MUSICLUB_COLORS.pitchBlack}; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Contenedor Maestro -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: ${MUSICLUB_COLORS.nightNavy}; border: 1px solid ${MUSICLUB_COLORS.mutedViolet}; border-radius: 26px; overflow: hidden; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.85);">
          
          <!-- CABECERA CON LOGO Y PALETA OFICIAL -->
          <tr>
            <td style="padding: 30px 32px 24px 32px; background: linear-gradient(135deg, ${MUSICLUB_COLORS.deepPurple} 0%, ${MUSICLUB_COLORS.nightNavy} 100%); border-bottom: 1px solid rgba(245, 127, 162, 0.25); text-align: center;">
              
              <!-- Logo Oficial y Nombre de la Plataforma -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td valign="middle">
                    <img 
                      src="${activeLogo}" 
                      alt="Musiclub Logo" 
                      width="38" 
                      height="38" 
                      style="display: block;" 
                    />
                  </td>
                  <td valign="middle" style="padding-left: 10px;">
                    <span style="font-size: 20px; font-weight: 900; letter-spacing: 2px; color: ${MUSICLUB_COLORS.softBlush}; text-transform: uppercase;">
                      MUSICLUB
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Badge Temático -->
              ${
                badgeText
                  ? `
                <div style="display: inline-block; padding: 6px 16px; border-radius: 9999px; background-color: ${MUSICLUB_COLORS.pitchBlack}; border: 1px solid ${MUSICLUB_COLORS.vibrantRose}; color: ${MUSICLUB_COLORS.softBlush}; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 14px; box-shadow: 0 4px 14px rgba(245, 127, 162, 0.2);">
                  ${badgeText}
                </div>
              `
                  : ''
              }

              <!-- Título Principal -->
              <h1 style="margin: 0 0 8px 0; font-size: 23px; font-weight: 900; color: #FFFFFF; line-height: 1.3; letter-spacing: -0.3px;">
                ${titleText}
              </h1>

              <!-- Subtítulo Aclaratorio -->
              ${
                subtitleText
                  ? `
                <p style="margin: 0; font-size: 13px; color: ${MUSICLUB_COLORS.softBlush}; opacity: 0.9; line-height: 1.5;">
                  ${subtitleText}
                </p>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="padding: 28px 32px; background-color: ${MUSICLUB_COLORS.nightNavy};">
              ${contentHtml}

              <!-- Botón Primario CTA con Rosa Vibrante #F57FA2 -->
              ${
                ctaText && ctaUrl
                  ? `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 26px;">
                  <tr>
                    <td align="center">
                      <a 
                        href="${ctaUrl}" 
                        target="_blank" 
                        class="btn-cta" 
                        style="display: inline-block; background-color: ${MUSICLUB_COLORS.vibrantRose}; background: linear-gradient(135deg, ${MUSICLUB_COLORS.vibrantRose} 0%, #fa6d95 100%); color: #FFFFFF; font-weight: 900; font-size: 14px; letter-spacing: 0.5px; padding: 15px 34px; border-radius: 14px; text-decoration: none; box-shadow: 0 10px 24px rgba(245, 127, 162, 0.4); border: 1px solid rgba(255, 219, 230, 0.4);"
                      >
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- PIE DE PÁGINA OFICIAL -->
          <tr>
            <td style="padding: 22px 32px; background-color: ${MUSICLUB_COLORS.pitchBlack}; border-top: 1px solid ${MUSICLUB_COLORS.mutedViolet}; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: ${MUSICLUB_COLORS.softBlush};">
                Musiclub • ${i18n.footer.tagline}
              </p>
              <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.45);">
                © ${new Date().getFullYear()} Musiclub. ${i18n.footer.rights}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 1. NOTIFICARME AL ESTRENAR - CORREO 1: CONFIRMACIÓN INMEDIATA
 */
export function generateUpcomingConfirmationHtml({
  albumName,
  artistName,
  releaseDate,
  imageUrl,
  albumUrl,
  lang = 'es',
  logoUrl,
}) {
  const i18n = getI18n(lang).upcomingConfirm;
  const formattedDate = formatReleaseDate(releaseDate, lang);
  const vinylComponent = renderVinylCoverComponent({
    imageUrl,
    albumName,
    size: 140,
  });

  const contentHtml = `
    <!-- Disco y Portada -->
    ${vinylComponent}

    <!-- Tarjeta de Metadatos del Álbum -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${MUSICLUB_COLORS.deepPurple}; border: 1px solid ${MUSICLUB_COLORS.mutedViolet}; border-radius: 18px; margin: 22px 0 16px 0;">
      <tr>
        <td style="padding: 18px 22px; text-align: center;">
          <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 900; color: #FFFFFF;">
            ${albumName}
          </h2>
          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: ${MUSICLUB_COLORS.vibrantRose};">
            ${artistName}
          </p>
          <div style="display: inline-block; padding: 6px 14px; border-radius: 10px; background-color: ${MUSICLUB_COLORS.nightNavy}; border: 1px solid ${MUSICLUB_COLORS.vibrantRose}; color: ${MUSICLUB_COLORS.softBlush}; font-size: 12px; font-weight: 800;">
            📅 ${i18n.dateLabel}: <strong>${formattedDate}</strong>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.85); line-height: 1.6; text-align: center;">
      ${i18n.note}
    </p>
  `;

  return wrapEmailHtml({
    badgeText: i18n.badge,
    titleText: i18n.title,
    subtitleText: i18n.subtitle,
    contentHtml,
    ctaText: i18n.cta,
    ctaUrl: albumUrl || MUSICLUB_ASSETS.siteUrl,
    lang,
    logoUrl,
  });
}

/**
 * 2. NOTIFICARME AL ESTRENAR - CORREO 2: DÍA DEL ESTRENO A LAS 12:00 AM
 */
export function generateUpcomingReleaseDayHtml({
  albumName,
  artistName,
  imageUrl,
  albumUrl,
  lang = 'es',
  logoUrl,
}) {
  const i18n = getI18n(lang).upcomingReleaseDay;
  const vinylComponent = renderVinylCoverComponent({
    imageUrl,
    albumName,
    size: 150,
  });

  const contentHtml = `
    <!-- Disco y Portada -->
    ${vinylComponent}

    <!-- Ficha del Lanzamiento Estrenado -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${MUSICLUB_COLORS.deepPurple}; border: 1px solid ${MUSICLUB_COLORS.vibrantRose}; border-radius: 18px; margin: 22px 0 16px 0; box-shadow: 0 8px 25px rgba(245, 127, 162, 0.25);">
      <tr>
        <td style="padding: 20px 22px; text-align: center;">
          <div style="display: inline-block; padding: 4px 12px; border-radius: 8px; background-color: ${MUSICLUB_COLORS.pitchBlack}; color: ${MUSICLUB_COLORS.vibrantRose}; font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 8px;">
            ${i18n.dateLabel}
          </div>
          <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 900; color: #FFFFFF;">
            ${albumName}
          </h2>
          <p style="margin: 0; font-size: 15px; font-weight: 700; color: ${MUSICLUB_COLORS.softBlush};">
            ${artistName}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13.5px; color: rgba(255, 255, 255, 0.9); line-height: 1.6; text-align: center;">
      ${i18n.note}
    </p>
  `;

  return wrapEmailHtml({
    badgeText: i18n.badge,
    titleText: i18n.title,
    subtitleText: i18n.subtitle,
    contentHtml,
    ctaText: i18n.cta,
    ctaUrl: albumUrl || `${MUSICLUB_ASSETS.siteUrl}/catalogo`,
    lang,
    logoUrl,
  });
}

/**
 * 3. POOL - NUEVO GANADOR DE LA SEMANA
 */
export function generatePoolWinnerHtml({
  albumName,
  artistName,
  imageUrl,
  nominatedBy,
  seasonName,
  spotifyLink,
  youtubeLink,
  appleMusicLink,
  deezerLink,
  poolUrl,
  lang = 'es',
  logoUrl,
}) {
  const i18n = getI18n(lang).poolWinner;
  const vinylComponent = renderVinylCoverComponent({
    imageUrl,
    albumName,
    size: 145,
  });

  const streamingLinksHtml = `
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 14px auto 0 auto;">
      <tr>
        ${
          spotifyLink
            ? `
          <td style="padding: 0 4px;">
            <a href="${spotifyLink}" target="_blank" style="display: inline-block; padding: 7px 12px; border-radius: 8px; background-color: #1DB954; color: #FFFFFF; font-size: 11px; font-weight: 800;">
              Spotify
            </a>
          </td>
        `
            : ''
        }
        ${
          youtubeLink
            ? `
          <td style="padding: 0 4px;">
            <a href="${youtubeLink}" target="_blank" style="display: inline-block; padding: 7px 12px; border-radius: 8px; background-color: #FF0000; color: #FFFFFF; font-size: 11px; font-weight: 800;">
              YouTube Music
            </a>
          </td>
        `
            : ''
        }
        ${
          appleMusicLink
            ? `
          <td style="padding: 0 4px;">
            <a href="${appleMusicLink}" target="_blank" style="display: inline-block; padding: 7px 12px; border-radius: 8px; background-color: #FC3C44; color: #FFFFFF; font-size: 11px; font-weight: 800;">
              Apple Music
            </a>
          </td>
        `
            : ''
        }
        ${
          deezerLink
            ? `
          <td style="padding: 0 4px;">
            <a href="${deezerLink}" target="_blank" style="display: inline-block; padding: 7px 12px; border-radius: 8px; background-color: #A238FF; color: #FFFFFF; font-size: 11px; font-weight: 800;">
              Deezer
            </a>
          </td>
        `
            : ''
        }
      </tr>
    </table>
  `;

  const contentHtml = `
    ${vinylComponent}

    <!-- Ficha del Ganador -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${MUSICLUB_COLORS.deepPurple}; border: 1px solid ${MUSICLUB_COLORS.mutedViolet}; border-radius: 18px; margin: 20px 0 16px 0;">
      <tr>
        <td style="padding: 18px 22px; text-align: center;">
          <h2 style="margin: 0 0 4px 0; font-size: 19px; font-weight: 900; color: #FFFFFF;">
            ${albumName}
          </h2>
          <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: ${MUSICLUB_COLORS.softBlush};">
            ${artistName}
          </p>
          <div style="font-size: 12px; color: rgba(255,255,255,0.75);">
            <span>${i18n.nominatedBy}:</span> <strong style="color: ${MUSICLUB_COLORS.vibrantRose};">${nominatedBy || 'Miembro del Club'}</strong>
            ${seasonName ? ` • <span style="color: ${MUSICLUB_COLORS.softBlush};">${seasonName}</span>` : ''}
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 13.5px; color: rgba(255, 255, 255, 0.85); line-height: 1.6; text-align: center;">
      ${i18n.description}
    </p>

    <div style="text-align: center; margin-bottom: 8px;">
      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${MUSICLUB_COLORS.softBlush}; letter-spacing: 1px;">
        ${i18n.listenOn}
      </span>
      ${streamingLinksHtml}
    </div>
  `;

  return wrapEmailHtml({
    badgeText: i18n.badge,
    titleText: i18n.title,
    subtitleText: i18n.subtitle,
    contentHtml,
    ctaText: i18n.cta,
    ctaUrl: poolUrl || `${MUSICLUB_ASSETS.siteUrl}/pool`,
    lang,
    logoUrl,
  });
}

/**
 * 4. POOL - GRADUACIÓN DEL GANADOR CON RESUMEN DE RESEÑAS
 */
export function generatePoolGraduatedHtml({
  albumName,
  artistName,
  imageUrl,
  nominatedBy,
  avgScore,
  totalReviews = 0,
  breakdown = {},
  topTracks = [],
  highlightQuotes = [],
  poolUrl,
  lang = 'es',
  logoUrl,
}) {
  const i18n = getI18n(lang).poolGraduated;
  const vinylComponent = renderVinylCoverComponent({
    imageUrl,
    albumName,
    size: 140,
  });

  const breakdownRows = `
    <table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 12px; margin-top: 6px;">
      <tr>
        <td style="color: ${MUSICLUB_COLORS.softBlush}; font-weight: 600;">${i18n.prod}:</td>
        <td align="right" style="color: #FFFFFF; font-weight: 800;">${breakdown.produccion || '—'} / 10</td>
        <td style="color: ${MUSICLUB_COLORS.softBlush}; font-weight: 600; padding-left: 12px;">${i18n.comp}:</td>
        <td align="right" style="color: #FFFFFF; font-weight: 800;">${breakdown.composicion || '—'} / 10</td>
      </tr>
      <tr>
        <td style="color: ${MUSICLUB_COLORS.softBlush}; font-weight: 600;">${i18n.lyrics}:</td>
        <td align="right" style="color: #FFFFFF; font-weight: 800;">${breakdown.letras || '—'} / 10</td>
        <td style="color: ${MUSICLUB_COLORS.softBlush}; font-weight: 600; padding-left: 12px;">${i18n.orig}:</td>
        <td align="right" style="color: #FFFFFF; font-weight: 800;">${breakdown.originalidad || '—'} / 10</td>
      </tr>
      <tr>
        <td style="color: ${MUSICLUB_COLORS.softBlush}; font-weight: 600;">${i18n.cohesion}:</td>
        <td align="right" style="color: #FFFFFF; font-weight: 800;">${breakdown.cohesion || '—'} / 10</td>
        <td style="color: ${MUSICLUB_COLORS.softBlush}; font-weight: 600; padding-left: 12px;">${i18n.replay}:</td>
        <td align="right" style="color: #FFFFFF; font-weight: 800;">${breakdown.replay || '—'} / 10</td>
      </tr>
    </table>
  `;

  const topTracksHtml =
    topTracks && topTracks.length > 0
      ? `
    <div style="margin-top: 16px; padding: 12px; border-radius: 12px; background-color: ${MUSICLUB_COLORS.pitchBlack}; border: 1px solid ${MUSICLUB_COLORS.mutedViolet};">
      <div style="font-size: 11px; font-weight: 800; color: ${MUSICLUB_COLORS.vibrantRose}; text-transform: uppercase; margin-bottom: 6px;">
        ⭐ ${i18n.topTracks}:
      </div>
      <div style="font-size: 12.5px; color: #FFFFFF; font-weight: 700;">
        ${topTracks.map((t, idx) => `${idx + 1}. ${t}`).join(' • ')}
      </div>
    </div>
  `
      : '';

  const quotesHtml =
    highlightQuotes && highlightQuotes.length > 0
      ? `
    <div style="margin-top: 16px;">
      <div style="font-size: 11px; font-weight: 800; color: ${MUSICLUB_COLORS.softBlush}; text-transform: uppercase; margin-bottom: 8px;">
        💬 ${i18n.quotes}:
      </div>
      ${highlightQuotes
        .slice(0, 2)
        .map(
          (q) => `
        <div style="padding: 10px 14px; border-radius: 12px; background-color: rgba(90, 45, 124, 0.25); border-left: 3px solid ${MUSICLUB_COLORS.vibrantRose}; margin-bottom: 8px; font-size: 12px; color: rgba(255,255,255,0.9); font-style: italic;">
          "${q.comment}"
          <span style="display: block; font-style: normal; font-weight: 800; color: ${MUSICLUB_COLORS.softBlush}; font-size: 11px; margin-top: 4px;">
            — ${q.reviewer}
          </span>
        </div>
      `
        )
        .join('')}
    </div>
  `
      : '';

  const contentHtml = `
    ${vinylComponent}

    <!-- Puntuación Promedio de la Comunidad -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${MUSICLUB_COLORS.deepPurple}; border: 2px solid ${MUSICLUB_COLORS.vibrantRose}; border-radius: 18px; margin: 20px 0 16px 0; box-shadow: 0 10px 30px rgba(245, 127, 162, 0.3);">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <h2 style="margin: 0 0 2px 0; font-size: 19px; font-weight: 900; color: #FFFFFF;">
            ${albumName}
          </h2>
          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: ${MUSICLUB_COLORS.softBlush};">
            ${artistName}
          </p>

          <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="padding: 8px 18px; border-radius: 14px; background-color: ${MUSICLUB_COLORS.pitchBlack}; border: 1px solid ${MUSICLUB_COLORS.vibrantRose}; text-align: center;">
                <span style="font-size: 26px; font-weight: 900; color: ${MUSICLUB_COLORS.vibrantRose};">
                  ★ ${avgScore || '8.5'}
                </span>
                <span style="font-size: 12px; color: ${MUSICLUB_COLORS.softBlush}; display: block; font-weight: 700;">
                  ${i18n.finalScore} (${totalReviews} ${i18n.totalReviews})
                </span>
              </td>
            </tr>
          </table>

          <!-- Desglose de 6 notas maestras -->
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 11px; font-weight: 800; color: ${MUSICLUB_COLORS.softBlush}; text-transform: uppercase;">
              ${i18n.breakdownTitle}
            </div>
            ${breakdownRows}
          </div>
        </td>
      </tr>
    </table>

    ${topTracksHtml}
    ${quotesHtml}
  `;

  return wrapEmailHtml({
    badgeText: i18n.badge,
    titleText: i18n.title,
    subtitleText: i18n.subtitle,
    contentHtml,
    ctaText: i18n.cta,
    ctaUrl: poolUrl || `${MUSICLUB_ASSETS.siteUrl}/pool`,
    lang,
  });
}

/**
 * 5. BUZÓN MUSICAL - RECOMENDACIÓN DE CANCIÓN (CARTITA POSTAL)
 */
export function generateSongRecommendationHtml({
  recipientName,
  senderName,
  songTitle,
  artistName,
  albumName,
  imageUrl,
  spotifyLink,
  youtubeLink,
  appleMusicLink,
  deezerLink,
  message,
  mailboxUrl,
  lang = 'es',
  logoUrl,
}) {
  const i18n = getI18n(lang).songRec;
  const vinylComponent = renderVinylCoverComponent({
    imageUrl,
    albumName: songTitle,
    size: 135,
  });

  const streamingLinksHtml = `
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 12px auto 0 auto;">
      <tr>
        ${
          spotifyLink
            ? `
          <td style="padding: 0 4px;">
            <a href="${spotifyLink}" target="_blank" style="display: inline-block; padding: 7px 12px; border-radius: 8px; background-color: #1DB954; color: #FFFFFF; font-size: 11px; font-weight: 800;">
              Spotify
            </a>
          </td>
        `
            : ''
        }
        ${
          youtubeLink
            ? `
          <td style="padding: 0 4px;">
            <a href="${youtubeLink}" target="_blank" style="display: inline-block; padding: 7px 12px; border-radius: 8px; background-color: #FF0000; color: #FFFFFF; font-size: 11px; font-weight: 800;">
              YouTube Music
            </a>
          </td>
        `
            : ''
        }
        ${
          appleMusicLink
            ? `
          <td style="padding: 0 4px;">
            <a href="${appleMusicLink}" target="_blank" style="display: inline-block; padding: 7px 12px; border-radius: 8px; background-color: #FC3C44; color: #FFFFFF; font-size: 11px; font-weight: 800;">
              Apple Music
            </a>
          </td>
        `
            : ''
        }
        ${
          deezerLink
            ? `
          <td style="padding: 0 4px;">
            <a href="${deezerLink}" target="_blank" style="display: inline-block; padding: 7px 12px; border-radius: 8px; background-color: #A238FF; color: #FFFFFF; font-size: 11px; font-weight: 800;">
              Deezer
            </a>
          </td>
        `
            : ''
        }
      </tr>
    </table>
  `;

  const contentHtml = `
    ${vinylComponent}

    <!-- Tarjeta Postal Estilizada con Borde Rosa Vibrante -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${MUSICLUB_COLORS.deepPurple}; border: 2px solid ${MUSICLUB_COLORS.vibrantRose}; border-radius: 20px; margin: 20px 0 16px 0; box-shadow: 0 12px 30px rgba(245, 127, 162, 0.28);">
      <tr>
        <td style="padding: 22px;">
          <!-- Sello Postal Audiófilo -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
            <tr>
              <td>
                <span style="font-size: 11px; font-weight: 800; color: ${MUSICLUB_COLORS.softBlush}; text-transform: uppercase; letter-spacing: 1px;">
                  ${i18n.from}: <strong style="color: #FFFFFF;">${senderName || 'Un Miembro del Club'}</strong>
                </span>
              </td>
              <td align="right">
                <div style="display: inline-block; padding: 3px 8px; border-radius: 6px; background-color: ${MUSICLUB_COLORS.pitchBlack}; border: 1px solid ${MUSICLUB_COLORS.softBlush}; color: ${MUSICLUB_COLORS.softBlush}; font-size: 9px; font-weight: 900; letter-spacing: 1px;">
                  POSTAL CLUB 💌
                </div>
              </td>
            </tr>
          </table>

          <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 900; color: #FFFFFF;">
            🎵 ${songTitle}
          </h2>
          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: ${MUSICLUB_COLORS.softBlush};">
            ${artistName} ${albumName ? `• Álbum: ${albumName}` : ''}
          </p>

          <!-- Dedicatoria personal -->
          ${
            message
              ? `
            <div style="padding: 14px; border-radius: 12px; background-color: ${MUSICLUB_COLORS.nightNavy}; border: 1px solid ${MUSICLUB_COLORS.mutedViolet}; margin-top: 10px;">
              <div style="font-size: 10px; font-weight: 800; color: ${MUSICLUB_COLORS.vibrantRose}; text-transform: uppercase; margin-bottom: 4px;">
                ✍️ ${i18n.dedication}:
              </div>
              <p style="margin: 0; font-size: 13px; color: #FFFFFF; font-style: italic; line-height: 1.5;">
                "${message}"
              </p>
            </div>
          `
              : ''
          }
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin-bottom: 8px;">
      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${MUSICLUB_COLORS.softBlush}; letter-spacing: 1px;">
        ${i18n.listenOn}
      </span>
      ${streamingLinksHtml}
    </div>
  `;

  return wrapEmailHtml({
    badgeText: i18n.badge,
    titleText: i18n.title,
    subtitleText: `${i18n.from} ${senderName || 'un miembro'}, para ${recipientName || 'ti'}:`,
    contentHtml,
    ctaText: i18n.cta,
    ctaUrl: mailboxUrl || `${MUSICLUB_ASSETS.siteUrl}/profile`,
    lang,
    logoUrl,
  });
}

/**
 * Humanizador de Patch Notes para boletines
 */
export function humanizePatchNotes(patchNote, lang = 'es') {
  if (!patchNote) return null;

  const dictionary = {
    canonical: 'oficial y verificado',
    'enriquecimiento canónico': 'portadas e información musical verificada y detallada',
    'sincronización bidireccional': 'sincronización instantánea de tus reseñas y estadísticas',
    '21 columnas': 'ficha musical ultra detallada',
    'ingesta automática': 'actualización continua de música nueva',
    'ingesta canónica': 'actualización con datos oficiales',
    'rate-limit': 'mayor velocidad de carga en la página',
    'rate limit': 'pantallas de espera',
    '12 tracks falsos': 'conteos precisos de canciones reales',
    'fallback artificial': 'información musical exacta y comprobada',
    supabase: 'la biblioteca de Musiclub',
    postgresql: 'la base de datos de música',
    postgres: 'la base de datos',
    postgrest: 'el catálogo musical',
    api: 'fuente musical',
    endpoint: 'nueva función',
    'next.js app router': 'nueva navegación instantánea',
    'next.js': 'el motor de Musiclub',
    ssr: 'carga rápida',
    'schema.org': 'ficha técnica para buscadores',
    'json-ld': 'datos de búsqueda',
    sitemaps: 'guías de búsqueda',
    sitemap: 'guía de búsqueda',
    'github actions': 'actualizaciones automáticas continuas',
    github: 'la plataforma',
    commits: 'mejoras',
    commit: 'mejora',
    'node.js': 'servidores modernos',
    dkim: 'sellos de autenticidad',
    spf: 'validación oficial',
    dmarc: 'protección de entrega segura',
    smtp: 'servidor de correos',
    brevo: 'el servicio de mensajería',
    'cid multipart': 'imágenes integradas en alta calidad',
    cid: 'imagen oficial',
    'useauth': 'tu cuenta de usuario',
    'localstorage': 'la memoria de tu navegador',
    'sql': 'el catálogo de música',
    'canvas 9:16': 'formato para historias de celular',
  };

  const sanitize = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    let result = text;
    Object.entries(dictionary).forEach(([tech, friendly]) => {
      const pattern = tech.length <= 4 ? `\\b${tech}\\b` : tech;
      const regex = new RegExp(pattern, 'gi');
      result = result.replace(regex, friendly);
    });
    return result;
  };

  const friendlyTitle = sanitize(patchNote.title) || `Versión ${patchNote.version}: Novedades de Musiclub`;
  const friendlySummary = sanitize(patchNote.summary);

  const friendlyChanges = (patchNote.changes || []).map((ch) => ({
    type: ch.type || 'feature',
    title: sanitize(ch.title),
    description: sanitize(ch.description),
  }));

  return {
    version: patchNote.version,
    date: patchNote.date,
    title: friendlyTitle,
    summary: friendlySummary,
    changes: friendlyChanges,
  };
}

/**
 * 6. NOVEDADES DEL CLUB (PATCH NOTES BOLETÍN)
 */
export function generatePatchNotesHtml({
  patchNote,
  patchNotesUrl,
  lang = 'es',
  logoUrl,
}) {
  const i18n = getI18n(lang).patchNotes;
  const humanized = humanizePatchNotes(patchNote, lang);

  const changesListHtml = (humanized.changes || [])
    .slice(0, 6)
    .map((c) => {
      const icon = c.type === 'fix' ? '🔧' : c.type === 'design' ? '🎨' : '✨';
      return `
      <div style="padding: 12px 14px; border-radius: 12px; background-color: ${MUSICLUB_COLORS.deepPurple}; border: 1px solid ${MUSICLUB_COLORS.mutedViolet}; margin-bottom: 10px;">
        <div style="font-size: 13px; font-weight: 800; color: ${MUSICLUB_COLORS.softBlush}; margin-bottom: 3px;">
          ${icon} ${c.title}
        </div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.85); line-height: 1.5;">
          ${c.description}
        </div>
      </div>
    `;
    })
    .join('');

  const contentHtml = `
    <!-- Resumen Destacado con Gradiente Oficial -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${MUSICLUB_COLORS.deepPurple}; border: 2px solid ${MUSICLUB_COLORS.vibrantRose}; border-radius: 18px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(245, 127, 162, 0.25);">
      <tr>
        <td style="padding: 18px 22px;">
          <div style="font-size: 11px; font-weight: 800; color: ${MUSICLUB_COLORS.vibrantRose}; text-transform: uppercase; margin-bottom: 4px;">
            Lanzamiento Oficial Musiclub ${humanized.version}
          </div>
          <p style="margin: 0; font-size: 13.5px; color: #FFFFFF; line-height: 1.6;">
            ${humanized.summary}
          </p>
        </td>
      </tr>
    </table>

    <div style="font-size: 12px; font-weight: 800; color: ${MUSICLUB_COLORS.softBlush}; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">
      ${i18n.whatsNew}
    </div>
    ${changesListHtml}
  `;

  return wrapEmailHtml({
    badgeText: i18n.badge,
    titleText: humanized.title,
    subtitleText: i18n.subtitle,
    contentHtml,
    ctaText: i18n.cta,
    ctaUrl: patchNotesUrl || `${MUSICLUB_ASSETS.siteUrl}/patch-notes`,
    lang,
    logoUrl,
  });
}

// ==========================================
// MÉTODOS DE ENVÍO DE CORREO (DISPATCHERS)
// ==========================================

export async function sendUpcomingConfirmationEmail({
  to,
  albumName,
  artistName,
  releaseDate,
  imageUrl,
  albumUrl,
  lang = 'es',
}) {
  const { transporter, from, replyTo, isTest, provider } =
    await getTransporter();
  const { attachments, logoUrl, coverUrl } = await prepareAttachmentsAndImages({
    imageUrl,
  });

  const html = generateUpcomingConfirmationHtml({
    albumName,
    artistName,
    releaseDate,
    imageUrl: coverUrl,
    logoUrl,
    albumUrl,
    lang,
  });

  const subject =
    lang === 'en'
      ? `🔔 Reminder set for "${albumName}" by ${artistName} - Musiclub`
      : `🔔 Recordatorio programado para "${albumName}" de ${artistName} - Musiclub`;

  const info = await transporter.sendMail({
    from,
    replyTo,
    to,
    subject,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: isTest ? nodemailer.getTestMessageUrl(info) : null,
    provider,
    recipient: to,
  };
}

export async function sendUpcomingReleaseDayEmail({
  to,
  albumName,
  artistName,
  imageUrl,
  albumUrl,
  lang = 'es',
}) {
  const { transporter, from, replyTo, isTest, provider } =
    await getTransporter();
  const { attachments, logoUrl, coverUrl } = await prepareAttachmentsAndImages({
    imageUrl,
  });

  const html = generateUpcomingReleaseDayHtml({
    albumName,
    artistName,
    imageUrl: coverUrl,
    logoUrl,
    albumUrl,
    lang,
  });

  const subject =
    lang === 'en'
      ? `🎉 "${albumName}" by ${artistName} is out today! - Musiclub`
      : `🎉 ¡"${albumName}" de ${artistName} se estrenó hoy! - Musiclub`;

  const info = await transporter.sendMail({
    from,
    replyTo,
    to,
    subject,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: isTest ? nodemailer.getTestMessageUrl(info) : null,
    provider,
    recipient: to,
  };
}

export async function sendPoolWinnerEmail({
  recipients = [],
  albumName,
  artistName,
  imageUrl,
  nominatedBy,
  seasonName,
  spotifyLink,
  youtubeLink,
  appleMusicLink,
  deezerLink,
  poolUrl,
  lang = 'es',
}) {
  if (!recipients || recipients.length === 0) {
    throw new Error(
      'No se proporcionaron destinatarios para el correo de ganador del pool.'
    );
  }

  const { transporter, from, replyTo, isTest, provider } =
    await getTransporter();
  const { attachments, logoUrl, coverUrl } = await prepareAttachmentsAndImages({
    imageUrl,
  });

  const html = generatePoolWinnerHtml({
    albumName,
    artistName,
    imageUrl: coverUrl,
    logoUrl,
    nominatedBy,
    seasonName,
    spotifyLink,
    youtubeLink,
    appleMusicLink,
    deezerLink,
    poolUrl,
    lang,
  });

  const subject =
    lang === 'en'
      ? `🏆 New Pool Winner: "${albumName}" by ${artistName} - Musiclub`
      : `🏆 Nuevo Ganador del Pool: "${albumName}" de ${artistName} - Musiclub`;

  const validRecipients = recipients.filter((e) => e && e.includes('@'));

  const info = await transporter.sendMail({
    from,
    replyTo,
    to: validRecipients[0],
    bcc: validRecipients.length > 1 ? validRecipients.slice(1) : undefined,
    subject,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: isTest ? nodemailer.getTestMessageUrl(info) : null,
    provider,
    recipientCount: validRecipients.length,
  };
}

export async function sendPoolGraduatedEmail({
  recipients = [],
  albumName,
  artistName,
  imageUrl,
  nominatedBy,
  avgScore,
  totalReviews,
  breakdown,
  topTracks,
  highlightQuotes,
  poolUrl,
  lang = 'es',
}) {
  if (!recipients || recipients.length === 0) {
    throw new Error(
      'No se proporcionaron destinatarios para el correo de graduación del pool.'
    );
  }

  const { transporter, from, replyTo, isTest, provider } =
    await getTransporter();
  const { attachments, logoUrl, coverUrl } = await prepareAttachmentsAndImages({
    imageUrl,
  });

  const html = generatePoolGraduatedHtml({
    albumName,
    artistName,
    imageUrl: coverUrl,
    logoUrl,
    nominatedBy,
    avgScore,
    totalReviews,
    breakdown,
    topTracks,
    highlightQuotes,
    poolUrl,
    lang,
  });

  const subject =
    lang === 'en'
      ? `🎓 Pool Graduation: "${albumName}" finishes with a ${avgScore || '8.5'}/10! - Musiclub`
      : `🎓 Graduación del Pool: ¡"${albumName}" cierra con nota de ${avgScore || '8.5'}/10! - Musiclub`;

  const validRecipients = recipients.filter((e) => e && e.includes('@'));

  const info = await transporter.sendMail({
    from,
    replyTo,
    to: validRecipients[0],
    bcc: validRecipients.length > 1 ? validRecipients.slice(1) : undefined,
    subject,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: isTest ? nodemailer.getTestMessageUrl(info) : null,
    provider,
    recipientCount: validRecipients.length,
  };
}

export async function sendSongRecommendationEmail({
  recipientEmail,
  recipientName,
  senderName,
  songTitle,
  artistName,
  albumName,
  imageUrl,
  spotifyLink,
  youtubeLink,
  appleMusicLink,
  deezerLink,
  message,
  mailboxUrl,
  lang = 'es',
}) {
  if (!recipientEmail || !recipientEmail.includes('@')) {
    throw new Error('Correo del destinatario no válido.');
  }

  const { transporter, from, replyTo, isTest, provider } =
    await getTransporter();
  const { attachments, logoUrl, coverUrl } = await prepareAttachmentsAndImages({
    imageUrl,
  });

  const html = generateSongRecommendationHtml({
    recipientName,
    senderName,
    songTitle,
    artistName,
    albumName,
    imageUrl: coverUrl,
    logoUrl,
    spotifyLink,
    youtubeLink,
    appleMusicLink,
    deezerLink,
    message,
    mailboxUrl,
    lang,
  });

  const subject =
    lang === 'en'
      ? `💌 ${senderName || 'A friend'} recommended "${songTitle}" for you - Musiclub Mailbox`
      : `💌 ${senderName || 'Un compañero'} te recomendó "${songTitle}" - Buzón Musiclub`;

  const info = await transporter.sendMail({
    from,
    replyTo,
    to: recipientEmail,
    subject,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: isTest ? nodemailer.getTestMessageUrl(info) : null,
    provider,
    recipient: recipientEmail,
  };
}

export async function sendPatchNotesEmail({
  recipients = [],
  patchNote,
  patchNotesUrl,
  lang = 'es',
}) {
  if (!recipients || recipients.length === 0) {
    throw new Error(
      'No se proporcionaron destinatarios para el correo de novedades.'
    );
  }

  const { transporter, from, replyTo, isTest, provider } =
    await getTransporter();
  const { attachments, logoUrl } = await prepareAttachmentsAndImages();

  const html = generatePatchNotesHtml({
    patchNote,
    patchNotesUrl,
    lang,
    logoUrl,
  });

  const subject =
    lang === 'en'
      ? `✨ Musiclub ${patchNote.version}: What's New & Updates`
      : `✨ Novedades de Musiclub ${patchNote.version}: ¡Conoce lo nuevo!`;

  const validRecipients = recipients.filter((e) => e && e.includes('@'));

  const info = await transporter.sendMail({
    from,
    replyTo,
    to: validRecipients[0],
    bcc: validRecipients.length > 1 ? validRecipients.slice(1) : undefined,
    subject,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: isTest ? nodemailer.getTestMessageUrl(info) : null,
    provider,
    recipientCount: validRecipients.length,
  };
}

export const emailService = {
  getTransporter,
  formatReleaseDate,
  generateUpcomingConfirmationHtml,
  generateUpcomingReleaseDayHtml,
  generatePoolWinnerHtml,
  generatePoolGraduatedHtml,
  generatePatchNotesHtml,
  generateSongRecommendationHtml,
  sendUpcomingConfirmationEmail,
  sendUpcomingReleaseDayEmail,
  sendPoolWinnerEmail,
  sendPoolGraduatedEmail,
  sendPatchNotesEmail,
  sendSongRecommendationEmail,
  humanizePatchNotes,
};

export default emailService;
