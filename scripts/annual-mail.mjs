import 'dotenv/config';
import fs from 'node:fs/promises';
import {annualEmailDesign,ANNUAL_MAIL_PHASES} from '../src/services/annualEmailTemplate.mjs';
const phase=process.argv.find(a=>a.startsWith('--phase='))?.slice(8)||'announcement';
if(!ANNUAL_MAIL_PHASES.includes(phase))throw Error('Fase no válida');
if(!process.argv.includes('--send')){await fs.mkdir('outputs/annual-mail',{recursive:true});await fs.writeFile(`outputs/annual-mail/${phase}.html`,annualEmailDesign(phase).html);console.log('Vista previa guardada. No se han consultado destinatarios ni enviado correos.');}
else{const {annualAdminDb}=await import('../src/server/annualNotifications.mjs'),{processAnnualNotices}=await import('../src/services/annualMail.mjs');console.log(await processAnnualNotices(annualAdminDb(),phase));}
