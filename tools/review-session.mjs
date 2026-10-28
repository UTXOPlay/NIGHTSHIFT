// Browser QA can use a fresh, unfunded wallet identity without consuming guest quotas.
// Private key and session remain in memory; no transaction is sent.
import {randomBytes} from 'node:crypto';
import {ccc} from '@ckb-ccc/shell';

export async function reviewSession(context,origin){
 const client=ccc.ClientPublicMainnet.open();
 try{const signer=new ccc.SignerCkbPrivateKey(client.value,'0x'+randomBytes(32).toString('hex')),address=await signer.getRecommendedAddress();
  const challenge=await context.request.post(origin+'/api/auth/challenge',{headers:{Origin:origin},data:{address}});if(!challenge.ok())throw Error('QA authentication challenge failed: '+challenge.status());
  const data=await challenge.json(),verified=await context.request.post(origin+'/api/auth/verify',{headers:{Origin:origin},data:{id:data.id,proof:await signer.signMessage(data.message)}});if(!verified.ok())throw Error('QA authentication failed: '+verified.status());
  return async()=>{await context.request.post(origin+'/api/auth/logout',{headers:{Origin:origin},data:{}});};
 }finally{await client.dispose();}
}
