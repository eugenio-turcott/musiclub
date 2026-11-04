import {connect} from 'node:tls';

// Let Workers resolve the hostname and open TLS directly, rather than passing
// Nodemailer's custom DNS/address-family lookup to its TCP proxy.
export function secureSmtpSocket(options,callback,open=connect) {
  let socket,completed=false,timer;
  const finish=(error)=>{
    if(completed)return;
    completed=true;clearTimeout(timer);
    if(error){socket?.destroy();callback(error);}
    else callback(null,{connection:socket,secured:true});
  };
  try {
    socket=open({host:options.host,port:options.port,servername:options.host,rejectUnauthorized:true,minVersion:'TLSv1.2'});
    socket.once('error',finish);
    socket.once('secureConnect',()=>{
      if(!socket.authorized){const error=new Error('SMTP certificate verification failed');error.code='ETLS';finish(error);return;}
      finish();
    });
    timer=setTimeout(()=>{const error=new Error('SMTP TLS connection timed out');error.code='ETIMEDOUT';finish(error);},15000);
  } catch(error){finish(error);}
}
