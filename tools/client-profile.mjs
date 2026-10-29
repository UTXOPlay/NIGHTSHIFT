import {readFileSync} from 'node:fs';
const profile=JSON.parse(readFileSync(new URL('../docs/release-integrity.json',import.meta.url))).profile;
const installed=new WeakSet();
export function installReviewProfile(context){
 const api=context.request;if(installed.has(api))return;installed.add(api);
 const post=api.post.bind(api);
 api.post=(url,options={})=>{
  if(/\/games\/(?:nightshift|drift-run)\/api\/(?:action|new|replay)(?:[?#]|$)/.test(String(url)))options={...options,data:{...options.data,client_profile:profile}};
  return post(url,options);
 };
}
