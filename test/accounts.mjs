import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash,generateKeyPairSync,sign} from 'node:crypto';
import {encodeCBOR} from '@levischuck/tiny-cbor';
const records=new Map();
class Conflict extends Error {}
mock.module('@vercel/blob',{namedExports:{BlobPreconditionFailedError:Conflict,
 async get(path){const r=records.get(path);return r?{stream:r.body,blob:{etag:String(r.version)}}:null},
 async put(path,body,opts){const r=records.get(path);if(r&&(!opts.allowOverwrite||opts.ifMatch!==String(r.version)))throw new Conflict();records.set(path,{body,version:(r?.version||0)+1})}
}});
const {default:handler}=await import('../api/journal.js');
const host='notes-on-becoming.vercel.app',origin='https://'+host;
process.env.JOURNAL_SESSION_SECRET=randomBytes(32).toString('hex');
function browser(){
 const jar={};
 return async (route,body,method=body?'POST':'GET')=>{
 const h={},r={code:200,setHeader(k,v){h[k]=v;return this},status(c){this.code=c;return this},json(v){this.value=v;return this},end(){return this},send(){return this}};
 await handler({method,headers:{host,origin},query:{route},cookies:jar,body},r);
 for(const c of [h['Set-Cookie']].flat().filter(Boolean)){const [k,v]=c.split(';')[0].split('=');jar[k]=v}
 return r;
 };
}
const b64=v=>Buffer.from(v).toString('base64url'),sha=v=>createHash('sha256').update(v).digest();
async function makeAccount(call){
 const opts=(await call('options',{kind:'register',name:'Test reader'})).value;
 const keys=generateKeyPairSync('ec',{namedCurve:'P-256'}),jwk=keys.publicKey.export({format:'jwk'}),id=randomBytes(32);
 const key=new Map([[1,2],[3,-7],[-1,1],[-2,Buffer.from(jwk.x,'base64url')],[-3,Buffer.from(jwk.y,'base64url')]]);
 const auth=Buffer.concat([sha(host),Buffer.from([69,0,0,0,0]),Buffer.alloc(16),Buffer.from([0,32]),id,encodeCBOR(key)]);
 const client=Buffer.from(JSON.stringify({type:'webauthn.create',challenge:opts.challenge,origin}));
 const response={id:b64(id),rawId:b64(id),type:'public-key',clientExtensionResults:{},response:{clientDataJSON:b64(client),attestationObject:b64(encodeCBOR(new Map([['fmt','none'],['authData',auth],['attStmt',new Map()]])))}};
 assert.equal((await call('verify',{response})).code,200);
 return {keys,id:b64(id)};
}
test('two real signature ceremonies isolate journal reads and writes',async()=>{
 const alice=browser(),bob=browser(),guest=browser();
 assert.equal((await guest('archive')).code,401);
 const account=await makeAccount(alice);await makeAccount(bob);
 const original=(await alice('archive')).value;
 original.data.notes.push({id:'example',date:'2026-11-24',body:'Private test',tags:['tag0']});
 assert.equal((await alice('archive',original,'PUT')).code,200);
 assert.equal((await bob('archive')).value.data.notes.length,0);
 const returning=browser(),opts=(await returning('options',{kind:'signin'})).value;
 const client=Buffer.from(JSON.stringify({type:'webauthn.get',challenge:opts.challenge,origin}));
 const auth=Buffer.concat([sha(host),Buffer.from([5,0,0,0,1])]);
 const response={id:account.id,rawId:account.id,type:'public-key',clientExtensionResults:{},response:{clientDataJSON:b64(client),authenticatorData:b64(auth),signature:b64(sign('sha256',Buffer.concat([auth,sha(client)]),account.keys.privateKey))}};
 assert.equal((await returning('verify',{response})).code,200);
 assert.equal((await returning('archive')).value.data.notes[0].body,'Private test');
 assert.equal((await returning('verify',{response})).code,400);
 assert.equal(records.has('archive.json'),false);
});
