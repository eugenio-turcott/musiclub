import {execFileSync} from 'node:child_process';
const base='https://api.github.com/repos/eugenio-turcott/musiclub';
let token;
function authorization(){
 if(token)return token;
 token=process.env.GITHUB_TOKEN;
 if(!token){
  let value;try{value=execFileSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',stdio:['pipe','pipe','pipe'],env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});}catch{throw new Error('GitHub authentication is unavailable.');}
  token=value.split('\n').find(line=>line.startsWith('password='))?.slice(9);
 }
 if(!token)throw new Error('GitHub authentication is unavailable.');
 return token;
}
export async function repositoryRequest(path,{method='GET',body}={}){
 if(!path.startsWith('/')||path.startsWith('//'))throw new Error('Repository-relative path required');
 const response=await fetch(base+path,{method,redirect:'error',headers:{Authorization:`Bearer ${authorization()}`,Accept:'application/vnd.github+json','Content-Type':'application/json','User-Agent':'Musiclub-repository-maintenance'},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok){
  const error=await response.json().catch(()=>({}));
  throw new Error(`GitHub repository request failed (${response.status}): ${String(error.message||'Request rejected').slice(0,300)}`);
 }
 return response.status===204?null:response.json();
}
