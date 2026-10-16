// A durable claim prevents concurrent instances and repeated clicks from sending the same notice twice.
// An uncertain/failed SMTP delivery is retained for manual review, never automatically resent.
export async function deliverNotificationOnce(db, key, send) {
  const claim = await db.rpc('musiclub_claim_notification', { p_key: key });
  if (claim.error) throw new Error('No se pudo reservar el aviso; no se ha intentado el envío.');
  if (!claim.data) return { skipped: true, reason: 'already_claimed' };
  try {
    const result = await send();
    if (result?.isTest || result?.provider === 'ethereal' || result?.success === false) {
      throw new Error('El proveedor no confirmó un envío real.');
    }
    const done = await db.rpc('musiclub_complete_notification', { p_key: key, p_sent: true });
    if (done.error) throw new Error('El proveedor aceptó el aviso, pero su registro requiere revisión. No lo reenvíes.');
    return result;
  } catch (error) {
    await db.rpc('musiclub_complete_notification', { p_key: key, p_sent: false });
    throw error;
  }
}
