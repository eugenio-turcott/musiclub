import {NextResponse} from 'next/server';
import {authorize} from '../../../../server/authorize';
import {getTransporter} from '../../../../services/emailService';

export const dynamic='force-dynamic';
export const runtime='nodejs';

// Authentication only. This endpoint never sends a message or returns credentials.
export async function POST(request) {
  const auth=await authorize(request,{admin:true});
  if(auth.error)return auth.error;
  let transport;
  try {
    const {transporter,isTest,provider}=await getTransporter();
    transport=transporter;
    if(isTest || provider!=='smtp')throw new Error('SMTP_NOT_CONFIGURED');
    await transport.verify();
    return NextResponse.json({success:true,message:'La conexión de correo está lista. No se envió ningún mensaje.'});
  } catch(error) {
    const code=error.code || 'SMTP_UNAVAILABLE';
    let detail=String(error.message || error.name || '');
    for(const value of [process.env.SMTP_PASS,process.env.SMTP_USER].filter(Boolean))detail=detail.replaceAll(value,'[redacted]');
    console.error('Pool SMTP health failed:',code,detail,{brevoHost:transport?.options?.host==='smtp-relay.brevo.com',port:transport?.options?.port,secure:transport?.options?.secure});
    return NextResponse.json({success:false,code,message:code==='EAUTH'?'El proveedor rechazó la credencial de correo. Revisa la configuración SMTP.':'No se pudo establecer la conexión de correo. Revisa la configuración SMTP.'},{status:503});
  } finally {transport?.close();}
}
