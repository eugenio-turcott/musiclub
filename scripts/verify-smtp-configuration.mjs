import { getTransporter } from '../src/services/emailService.js';

const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
if (required.some(name => !process.env[name]?.trim()) ||
    process.env.SMTP_HOST !== 'smtp-relay.brevo.com' ||
    !['587', '465'].includes(process.env.SMTP_PORT || '587')) {
  console.error('FAIL: configura SMTP_HOST, SMTP_USER y SMTP_PASS de Brevo y el puerto 587 o 465.');
  process.exit(1);
}

let transporter;
try {
  const transport = await getTransporter();
  if (transport.isTest || transport.provider !== 'smtp') throw new Error('Unexpected transport');
  transporter = transport.transporter;
  await transporter.verify();
  console.log('PASS: conexión cifrada y autenticación SMTP verificadas. No se enviaron correos.');
} catch (error) {
  const code = ['EAUTH', 'ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'EDNS', 'ETLS'].includes(error?.code)
    ? error.code : 'SMTP_VERIFY_FAILED';
  console.error(`FAIL: ${code}. No se muestran credenciales ni respuestas del servidor.`);
  process.exitCode = 1;
} finally {
  transporter?.close();
}
