import {randomUUID,createHash} from 'node:crypto';
import {sealData,unsealData} from 'iron-session';
import {generateRegistrationOptions,generateAuthenticationOptions,verifyRegistrationResponse,verifyAuthenticationResponse} from '@simplewebauthn/server';
import {get,put} from '@vercel/blob';

const RP='notes-on-becoming.vercel.app';
const TTL=300;
export const cookie=(name,value,age)=>'__Host-'+name+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+age;
export function archivePath(session){
 if(session?.legacy===true)return 'archive.json';
 if(typeof session?.uid==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(session.uid))return 'users/'+session.uid+'/archive.json';
 return null;
}
const hash=value=>createHash('sha256').update(value).digest('hex');
const create=(path,data,options={})=>put(path,JSON.stringify(data),{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json',...options});
export async function signedCookie(key,name,value,age){return cookie(name,await sealData(value,{password:key,ttl:age}),age)}
export async function readCookie(req,key,name){const t=req.cookies?.['__Host-'+name];if(!t)return {};try{return await unsealData(t,{password:key})}catch{return {}}}
export async function accounts(req,res,route,key){
 if(req.method!=='POST'||req.headers.origin!=='https://'+RP)return res.status(403).json({error:'Open the journal on its main address.'});
 const body=req.body||{};
 if(route==='options'){
  const kind=body.kind,uid=randomUUID(),name=String(body.name||'').trim().slice(0,60);
  if(!['register','signin'].includes(kind)||(kind==='register'&&!name))return res.status(400).json({error:'Enter a name for this passkey.'});
  const opts=kind==='register'?await generateRegistrationOptions({rpName:'Notes on Becoming',rpID:RP,userID:Buffer.from(uid),userName:name+' · '+uid.slice(0,8),userDisplayName:name,attestationType:'none',authenticatorSelection:{residentKey:'required',userVerification:'required'}}):await generateAuthenticationOptions({rpID:RP,userVerification:'required'});
  res.setHeader('Set-Cookie',await signedCookie(key,'ceremony',{kind,uid,challenge:opts.challenge,expires:Date.now()+TTL*1000},TTL));return res.json(opts);
 }
 const pending=await readCookie(req,key,'ceremony'),response=body.response;
 if(!(pending.expires>Date.now())||!pending.challenge||typeof response?.id!=='string'||response.id.length>2048)return res.status(400).json({error:'Restart sign-in to get a new passkey prompt.'});
 const parameters={response,expectedChallenge:pending.challenge,expectedOrigin:'https://'+RP,expectedRPID:RP,requireUserVerification:true};
 const path='credentials/'+hash(response.id)+'.json';
 const consume=()=>create('used/'+hash(pending.challenge)+'.json',true,{ttlDays:1});
 let uid;
 try{
  if(pending.kind==='register'){
   const result=await verifyRegistrationResponse(parameters);
   if(!result.verified||!result.registrationInfo)throw Error();
   const c=result.registrationInfo.credential;uid=pending.uid;
   await consume();await create(path,{uid,id:c.id,publicKey:Buffer.from(c.publicKey).toString('base64url'),counter:c.counter});
  }else{
   const blob=await get(path,{access:'private',useCache:false});if(!blob)throw Error();
   const record=await new Response(blob.stream).json();
   const result=await verifyAuthenticationResponse({...parameters,credential:{id:record.id,publicKey:Buffer.from(record.publicKey,'base64url'),counter:record.counter}});
   if(!result.verified)throw Error();await consume();uid=record.uid;
   if(result.authenticationInfo.newCounter!==record.counter)await create(path,{...record,counter:result.authenticationInfo.newCounter},{allowOverwrite:true,ifMatch:blob.blob.etag});
  }
 }catch{return res.status(401).json({error:'Could not finish the passkey check. Start again.'})}
 res.setHeader('Set-Cookie',[await signedCookie(key,'account',{uid},86400),cookie('ceremony','',0)]);return res.json({ok:true});
}
