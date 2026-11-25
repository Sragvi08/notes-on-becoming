import {get,put,BlobPreconditionFailedError} from '@vercel/blob';
import {accounts,archivePath,signedCookie,readCookie,cookie} from '../src/accounts.mjs';
import {createHash,timingSafeEqual} from 'node:crypto';
import {defaults,valid} from '../src/model.mjs';
import {readFileSync} from 'node:fs';
const ownerLogin='<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notes on Becoming</title><style>body{background:#f7f1e5;color:#34585a;font:19px Georgia;max-width:28rem;margin:18vh auto;padding:1rem}input,button{font:inherit;padding:.65rem;margin-top:.55rem;width:100%;box-sizing:border-box}button{background:#45696b;color:white;border:0}</style><h1>Notes on Becoming</h1><p><i>Kindling Curiosity</i></p><form method="post" action="/owner"><label>Journal password<input name="password" type="password" required autocomplete="current-password"></label><button>Open journal</button></form>';
const digest=x=>createHash('sha256').update(x).digest();

export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const secret=process.env.JOURNAL_SESSION_SECRET;
 if(!secret||secret.length<32)return res.status(503).end('Account sessions are not configured.');
 const route=String(req.query?.route||'home');
 const path=({archive:'/api/archive',owner:'/owner',logout:'/logout'})[route]||'/';
 const html=(v,code=200)=>res.status(code).setHeader('Content-Type','text/html; charset=utf-8').send(v);
 if(['PUT','POST'].includes(req.method)&&req.headers.origin!=='https://'+req.headers.host)return res.status(403).end();
 if(route==='options'||route==='verify')return accounts(req,res,route,secret);
 if(path==='/owner'){
  if(req.method==='GET')return html(ownerLogin);
  const pass=req.body?.password,old=process.env.JOURNAL_OWNER_PASSWORD;
  if(req.method!=='POST'||typeof pass!=='string'||!old||!timingSafeEqual(digest(pass),digest(old)))return html(ownerLogin+'<p>Incorrect password.</p>',401);
  res.setHeader('Set-Cookie',await signedCookie(secret,'account',{legacy:true},86400));return res.redirect(303,'/');
 }
 if(path==='/logout'){res.setHeader('Set-Cookie',[cookie('account','',0),cookie('ceremony','',0)]);return res.redirect(303,'/')}
 const blob=archivePath(await readCookie(req,secret,'account'));
 if(!blob){
  if(path==='/api/archive')return res.status(401).json({error:'Sign in to open your journal.'});
  if(req.headers.host!=='notes-on-becoming.vercel.app')return res.redirect(302,'https://notes-on-becoming.vercel.app/');
  return html(readFileSync(new URL('../src/signin.html',import.meta.url),'utf8'));
 }
 if(path!=='/api/archive')return html(readFileSync(new URL('../src/journal.html',import.meta.url),'utf8'));
 try{
  const saved=await get(blob,{access:'private',useCache:false});
  const current=saved?await new Response(saved.stream).json():{revision:0,data:defaults()};
  if(req.method==='GET')return res.json(current);
  if(req.method!=='PUT')return res.status(405).end();
  let payload=req.body;
  try{if(typeof payload==='string')payload=JSON.parse(payload);if(!valid(payload.data))throw Error()}catch{return res.status(400).json({error:'Invalid journal archive.'})}
  if(current.revision!==payload.revision)return res.status(409).json({error:'Your journal changed in another tab. Copy your draft and reload.'});
  const next={revision:current.revision+1,data:payload.data},bytes=JSON.stringify(next);
  if(Buffer.byteLength(bytes)>1800000)return res.status(413).json({error:'Archive size limit reached.'});
  await put(blob,bytes,{access:'private',addRandomSuffix:false,allowOverwrite:!!saved,...(saved?{ifMatch:saved.blob.etag}:{}),contentType:'application/json'});
  return res.json({revision:next.revision});
 }catch(e){return res.status(e instanceof BlobPreconditionFailedError?409:503).json({error:'Save or read could not complete. Keep your draft and retry.'})}
}
