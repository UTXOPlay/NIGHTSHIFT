// Browser QA can use a fresh, unfunded wallet identity without consuming guest quotas.
// Private key and session remain in memory; no transaction is sent.
import {randomBytes} from 'node:crypto';
import {ccc} from '@ckb-ccc/shell';

export async function reviewSession(context,origin){
 const client=ccc.ClientPublicMainnet.open();
 try{const signer=new ccc.SignerCkbPrivateKey(client.value,'0x'+randomBytes(32).toString('hex')),address=await signer.getRecommendedAddress();
  const challenge=await context.request.post(origin+'/api/auth/challenge',{headers:{Origin:origin},data:{address}});if(!challenge.ok())throw Error('QA authentication challenge failed: '+challenge.status());
  // APIRequestContext's cookie jar does not compensate for this host's clock skew.
  // Honor Max-Age for the fresh server-issued challenge; proof verification is unchanged.
  const cookie=challenge.headers()['set-cookie']?.match(/(?:^|,\s*)utxoplay_login=([^;]+)/),age=challenge.headers()['set-cookie']?.match(/Max-Age=(\d+)/i);
  if(cookie&&age)await context.addCookies([{name:'utxoplay_login',value:cookie[1],url:origin,httpOnly:true,secure:origin.startsWith('https:'),sameSite:'Lax',expires:Math.floor(Date.now()/1000)+Number(age[1])}]);
  const data=await challenge.json(),verified=await context.request.post(origin+'/api/auth/verify',{headers:{Origin:origin},data:{id:data.id,proof:await signer.signMessage(data.message)}});if(!verified.ok())throw Error('QA authentication failed: '+verified.status()+' '+(await verified.text()).slice(0,250));
  return async()=>{await context.request.post(origin+'/api/auth/logout',{headers:{Origin:origin},data:{}});};
 }finally{await client.dispose();}
}
