import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const html=read('shell.html').replace('/*STYLE*/',()=>read('style.css')).replace('/*CLIENT*/',()=>read('client.js'));
fs.writeFileSync(new URL('journal.html',import.meta.url),html);

const sdk=read('../node_modules/@simplewebauthn/browser/dist/bundle/index.umd.min.js');
fs.writeFileSync(new URL('signin.html',import.meta.url),read('auth-page.html').replace('/*PASSKEY_SDK*/',()=>sdk));
