const required = ['SUPABASE_SERVICE_ROLE_KEY', 'REACT_APP_SUPABASE_URL', 'REACT_APP_SPOTIFY_CLIENT_ID', 'REACT_APP_SPOTIFY_CLIENT_SECRET', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missing = required.filter(name => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Configura estos secretos de GitHub Actions antes de ejecutar el mantenimiento: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('Configuración de mantenimiento presente. No se muestran valores de credenciales.');
