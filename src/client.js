'use strict';
const $=q=>document.querySelector(q), main=$('#main'), modal=$('#dialog'), db=$('#dialogBody');
const sections=['Daily Log','Habit Log','Tech Log','Reflections'], colors=['#8daba9','#a7ba93','#b2d9e0','#fbdbbf'],paths=['M3 4h6c2 0 3 1 3 2 0-1 1-2 3-2h6v15h-6c-2 0-3 1-3 2 0-1-1-2-3-2H3z M12 6v14','M4 5h16v15H4z M4 10h16 M9 3v4m6-4v4 M8 15l2 2 4-4','m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 14','M5 20c1-9 4-15 15-16-1 10-5 14-12 13m-4 4L16 9','M10 3a7 7 0 1 0 .01 0M15 15l6 6','M12 8a4 4 0 1 0 .01 0M10 2h4l1 3 3 1 3 3-2 3 1 3-2 3-3 1-2 3h-3l-1-3-3-1-2-3 1-3-1-3 2-3 3-1z'];
const icon=i=>'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[i]+'"/></svg>';
$('.headtools button').innerHTML=icon(4);$('.headtools button:last-child').innerHTML=icon(5);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>crypto.randomUUID(),stamp=()=>new Date().toISOString(), short=(d,o)=>new Date(d+'T12:00:00').toLocaleDateString('en-US',o), pretty=d=>short(d,{month:'long',day:'numeric'}), TODAY=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:s?.settings.zone||undefined}).format(new Date());
let s=null,rev=0,section=0,day='',opened=false,dirty=false,saving=false,monthly=false,focusId='',noticeTimer,ready;
function say(t){$('#notice').textContent=t;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').textContent='',3000)}
async function load(){const r=await fetch('/api/archive');if(!r.ok)throw Error(r.status===401?'Sign in to open your private journal.':'The archive could not be loaded.');const p=await r.json();s=p.data;rev=p.revision;day=TODAY();prefs()}
function prefs(){document.body.classList.toggle('quiet',!s.settings.motion);document.body.classList.toggle('plain',!s.settings.hand)}
async function ensure(){try{await ready;return true}catch(e){show('Open journal','<p>'+esc(e.message)+'</p><a class="link" target="_top" href="/">Sign in</a> <button onclick="location.reload()">Retry</button>');return false}}
async function change(fn,success){if(saving)return;saving=true;try{const next=structuredClone(s);fn(next);const r=await fetch('/api/archive',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:next,revision:rev})});if(!r.ok)throw Error((await r.json()).error||'Could not save. Please retry.');rev=(await r.json()).revision;s=next;dirty=false;modal.close();prefs();success?.();if(opened)render();say('Saved to your journal')}catch(e){if(modal.open)$('#err').textContent=e.message;else say(e.message)}finally{saving=false}}
function show(title,html){dirty=false;db.innerHTML='<div class="dialoghead"><h2>'+esc(title)+'</h2><button aria-label="Close" onclick="closePanel()">×</button></div>'+html;$('#err').textContent='';if(!modal.open)modal.showModal()}
function closePanel(){if(!saving&&(!dirty||confirm('Discard your unsaved changes?'))){dirty=false;modal.close()}}
modal.addEventListener('cancel',e=>{e.preventDefault();closePanel()});modal.addEventListener('input',()=>{if($('#editForm'))dirty=true});
const loops='<div class="rings" aria-hidden="true">'+('<i class="ring"></i>'.repeat(15))+'</div>';
function emblem(){
 const rays=Array.from({length:24},(_,i)=>'<path transform="rotate('+i*15+' 60 60)" d="M60 4v'+(i%2?4:7)+'"/>').join('');
 const impression=(x,y,color)=>'<use href="#flame" x="'+x+'" y="'+y+'" width="75" height="94" color="'+color+'"/>';
 return '<svg class="emblem" viewBox="0 0 120 120" aria-hidden="true"><g stroke="#ba9869" opacity=".7">'+rays+'</g>'+impression(22.7,14.1,'#cbba8a')+impression(22,11.7,'#223d3d')+impression(22.2,12.8,'#b18a58')+'</svg>';
}
function cover(){history.replaceState(null,'',location.pathname);opened=false;main.innerHTML='<div class="desk"><div class="object"><button class="leather" aria-label="Open journal" onclick="enter(0)"><span class="frame"><b>✦</b><b>✦</b><b>✦</b><b>✦</b></span><span class="coverText">'+emblem()+'<h1>Notes on Becoming</h1><em>Kindling Curiosity</em><span class="orn">── ✧ ──</span></span></button>'+loops+'<div class="peeks">'+colors.map(c=>'<i style="background:'+c+'"></i>').join('')+'</div><i class="ribbon"></i></div><section class="intro"><span class="micro">✧ &nbsp; The journal cover</span><h2>Notes on <i>Becoming</i></h2><p>Kindling Curiosity</p><button class="primary" onclick="enter(0)">'+icon(0)+' Open journal</button><div class="index"><div class="label">Inside this notebook</div>'+sections.map((n,i)=>'<button class="row" onclick="enter('+i+')"><i style="background:'+colors[i]+'">'+icon(i)+'</i><span>'+n+'</span><span>›</span></button>').join('')+'</div></section></div><footer class="deskfoot"><span>Notes on Becoming</span><span>Private edition &nbsp; ✧</span></footer>'}
async function enter(i,instant=false){if(!await ensure())return;if(!opened&&!instant&&s.settings.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches){$('.leather')?.classList.add('opening');await new Promise(r=>setTimeout(r,310))}opened=true;section=i;render()}
const field=(label,control)=>'<label class="field">'+label+control+'</label>',input=(name,value='',type='text')=>'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'">',btn=(label,call)=>'<button class="sub" onclick="'+call+'">'+label+'</button>',act=(name,cls='')=>'<button type="submit" class="primary '+cls+'">'+name+'</button>',form=body=>'<form id="editForm">'+body+'</form>';
const tech=n=>n.tags.some(t=>s.tags.find(x=>x.id===t)?.tech),notes=()=>s.notes.filter(n=>section!==2||tech(n)), dates=()=>[...new Set(notes().map(n=>n.date).concat(day))].sort();
function gotoDate(d,animation='fan',nid='',part=0){if(!d)return;const previous=day,previousPart=leafPart,oldBook=$('.book');day=d;leafPart=part;focusId=nid;opened=true;render();if(oldBook&&(previous!==d||previousPart!==leafPart))turnSheet(oldBook,d>previous||(d===previous&&leafPart>previousPart),animation==='fan');if(nid)requestAnimationFrame(()=>{const el=document.getElementById('n'+nid);el?.focus();el?.scrollIntoView({block:'nearest'})})}
// Each strip follows its neighbour. Their angles vary across the paper as the free edge lifts.
function turnSheet(oldBook,forward,jump){
 const book=$('.book');
 if(!s.settings.motion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const mobile=getComputedStyle(book.querySelector('.right')).display==='none';
 const leaves=book.querySelectorAll('.leaf'),old=oldBook.querySelectorAll('.leaf');
 const left=leaves[0],right=leaves[1],front=mobile?old[0]:old[forward?1:0],back=mobile?left:leaves[forward?0:1];
 const w=left.offsetWidth,h=left.offsetHeight,sign=forward?1:-1;
 if(!w||!h)return;
 const group=document.createElement('div');
 group.className='turn-layer';group.inert=true;group.setAttribute('aria-hidden','true');
 book.append(group);
 function copy(page){
  const el=page.cloneNode(true);el.removeAttribute('id');el.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
  Object.assign(el.style,{display:'block',width:w+'px',height:h+'px',padding:getComputedStyle(left).padding,margin:0,boxShadow:'none',overflow:'hidden'});
  return el;
 }
 if(!mobile){
  const under=copy(old[forward?0:1]);Object.assign(under.style,{position:'absolute',left:(forward?left:right).offsetLeft+'px',top:left.offsetTop+'px'});group.append(under);
 }
 const count=14,width=w/count,strips=[];
 const hinge=mobile?left.offsetLeft:(forward?right.offsetLeft:left.offsetLeft+w);
 for(let i=0;i<count;i++){
  const strip=document.createElement('div');strip.className='paper-strip';
  Object.assign(strip.style,{left:hinge+'px',top:left.offsetTop+'px',width:(width+.6)+'px',height:h+'px'});
  const reverse=mobile?false:!forward;
  for(let face=0;face<(mobile?1:2);face++){
   const side=document.createElement('div');side.className='paper-face'+(face?' verso':'');
   const sheet=copy(face?back:(mobile&&!forward?back:front));
   sheet.style.transform='translateX(-'+((reverse!==Boolean(face)?count-1-i:i)*width)+'px)';
   side.append(sheet);strip.append(side);
  }
  group.append(strip);strips.push(strip);
 }
 if(mobile&&!forward){const under=copy(front);Object.assign(under.style,{position:'absolute',left:left.offsetLeft+'px',top:left.offsetTop+'px'});group.prepend(under)}
 const start=performance.now(),duration=jump?570:790;
 function frame(now){
  if(!group.isConnected)return;
  const t=Math.min(1,(now-start)/duration),ease=t*t*(3-2*t),phase=mobile&&!forward?1-ease:ease;
  let x=0,z=0;
  for(let i=0;i<count;i++){
   const u=(i+.5)/count,theta=Math.PI*(mobile?.53:1)*phase+Math.sin(Math.PI*phase)*(.92*(u-.45));
   const dx=width*Math.cos(theta),dz=width*Math.sin(theta),dir=mobile?1:sign;
   strips[i].style.transform='translate3d('+(dir*(dir>0?x:x+dx))+'px,0,'+(dir>0?z:z+dz)+'px) rotateY('+(-dir*theta)+'rad)';
   strips[i].style.setProperty('--shade',String(.18*Math.abs(Math.sin(theta))));
   x+=dx;z+=dz;
  }
  if(t<1)requestAnimationFrame(frame);else group.remove();
 }
 frame(start);
}
let leafPart=0,pageList=[],layoutKey='',layoutStore;
function step(dir){const i=pageList.findIndex(p=>p.date===day&&p.part===leafPart);const next=pageList[i+dir];if(next)gotoDate(next.date,'turn','',next.part)}
function chips(n){return n.tags.map(t=>s.tags.find(x=>x.id===t)).filter(Boolean).map(t=>'<span class="chip" style="background:'+t.color+'">'+esc(t.name)+'</span>').join('')}
function noteHTML(n,body=n.body,offset=0){return '<article class="note '+(focusId===n.id?'saved':'')+'" tabindex="-1" id="n'+n.id+(offset?'_'+offset:'')+'">'+chips(n)+'<p class="writing">'+esc(body)+'</p>'+(body.length<n.body.length?btn('Read full note',"fullNote('"+n.id+"')"):'')+btn('Edit',"noteEditor('"+n.id+"')")+(section===2?btn('View in Daily Log',"sourceNote('"+n.id+"')"):'')+'</article>'}
function fullNote(nid){const n=s.notes.find(n=>n.id===nid);show(pretty(n.date),chips(n)+'<p class="writing">'+esc(n.body)+'</p>'+btn('Edit note',"noteEditor('"+nid+"')"))}
function sourceNote(nid){section=0;gotoDate(s.notes.find(n=>n.id===nid).date,'fan',nid)}
function daily(page){
 const d=page.date;
 return '<span class="micro">'+sections[section]+' &nbsp; / &nbsp; '+short(d,{year:'numeric'})+'</span><h2 class="date-title">'+pretty(d)+(page.part?' <small>— continued</small>':'')+'</h2><p class="soft weekday">'+short(d,{weekday:'long'})+'</p>'+page.items.map(item=>noteHTML(item.note,item.body,item.offset)).join('')+(!page.items.length?'<p class="soft">'+(section===2?'Notes with technical tags appear here.':'A fresh page.')+'</p>':'')+btn(page.items.length?'Add note':'Write your first note',"noteEditor('', '"+d+"')");
}
function paginate(){
 const key=[section,day,innerWidth,innerHeight,document.fonts.status].join('/');
 if(layoutStore===s&&key===layoutKey)return;
 const book=document.createElement('div');book.className='book measure '+(section===0?'daily-book':'');book.inert=true;
 const paper=document.createElement('section');paper.className='leaf date-sheet';book.append(paper);document.body.append(book);
 const limit=paper.offsetHeight;paper.style.height='auto';
 const pages=[];
 try{
 for(const date of dates()){
  let page={date,part:0,items:[]};pages.push(page);
  const advance=()=>{page={date,part:page.part+1,items:[]};pages.push(page)};
  for(const note of notes().filter(n=>n.date===date)){
   let offset=0;
   while(offset<note.body.length){
    const slice=len=>({note,offset,body:note.body.slice(offset,offset+len)});
    const fits=len=>{paper.innerHTML=daily({...page,items:[...page.items,slice(len)]});return paper.offsetHeight<=limit-3};
    let len=Math.min(4096,note.body.length-offset);
    if(!fits(len)){
     if(page.items.length){advance();continue}
     let low=1,high=len;
     while(low<high){const mid=Math.ceil((low+high)/2);if(fits(mid))low=mid;else high=mid-1}
     len=low;const cut=note.body.slice(offset,offset+len).search(/\s+\S*$/u);if(cut>len*.65)len=cut+1;
    }
    if(len>1&&/[\uD800-\uDBFF]/.test(note.body[offset+len-1]))len--;
    page.items.push(slice(len));offset+=len;if(offset<note.body.length)advance();
   }
  }
 }
 pageList=pages;layoutStore=s;layoutKey=key;
 }finally{book.remove()}
}
function render(anim=''){history.replaceState(null,'','#'+section+'/'+day);const a=dates();let pos=0,left,right;if(section===0||section===2){paginate();const matches=pageList.filter(p=>p.date===day);const hit=focusId&&matches.find(p=>p.items.some(x=>x.note.id===focusId));const current=hit||matches[Math.min(leafPart,matches.length-1)];leafPart=current.part;pos=pageList.indexOf(current);left=daily(current);right=pageList[pos+1]?daily(pageList[pos+1]):'<span class="micro">'+sections[section]+'</span><h2>Notebook index</h2>'+ (a.filter(d=>notes().some(n=>n.date===d)).map(d=>'<button class="row" onclick="gotoDate(\''+d+'\')">'+pretty(d)+' <small>'+d.slice(0,4)+'</small></button>').join('')||'<p class="soft">Your logged dates will appear here.</p>')}else if(section===1){left=habitPage();right='<span class="micro">Habit Log</span><h2>Habit index</h2>'+s.habits.map(h=>'<p>'+esc(h.name)+' · '+(h.archived?'Archived':esc(h.mode))+'</p>').join('')}else{left=reflectionPage();right='<span class="micro">Reflections</span><h2>Linked moments</h2>'+s.reflections.flatMap(r=>r.links).filter((x,i,a)=>a.indexOf(x)===i).map(nid=>btn(pretty(s.notes.find(n=>n.id===nid).date),"sourceNote('"+nid+"')")).join('')}
main.innerHTML='<div class="tools">'+btn('‹ &nbsp; Cover','cover()')+btn('Today','gotoDate(TODAY())')+btn('Jump to date','jump()')+btn('Search','searchPanel()')+'</div><div class="book '+(section===0?'daily-book':'')+'"><section class="leaf '+((section===0||section===2)?'date-sheet ':'')+anim+(section===1?' dot':'')+'">'+left+'</section><section class="leaf right '+((section===0||section===2)?'date-sheet':'')+'">'+right+'</section>'+loops+'<nav class="tabs">'+sections.map((n,i)=>'<button class="tab" aria-current="'+(section===i)+'" style="background:'+colors[i]+'" onclick="enter('+i+')">'+n+'</button>').join('')+'</nav></div><div class="pagefoot"><span>'+sections[section]+'</span>'+(section===0||section===2?'<span><button aria-label="Previous page" '+(pos===0?'disabled':'')+' onclick="step(-1)">‹</button> '+(pos+1)+' / '+pageList.length+' <button aria-label="Next page" '+(pos===pageList.length-1?'disabled':'')+' onclick="step(1)">›</button></span>':'')+'</div>'}
function jump(){show('Jump to date',field('Journal date',input('date',day,'date'))+btn('Open page',"if(db.querySelector('input').value){modal.close();gotoDate(db.querySelector('input').value)}"))}
function noteEditor(nid='',d=day){const n=s.notes.find(n=>n.id===nid),sel=n?.tags||[];show(n?'Edit note':'Write a note',form(field('Entry date',input('date',n?.date||d,'date'))+field('Note','<textarea name="body" autofocus>'+esc(n?.body)+'</textarea>')+'<p class="label">Tags</p>'+s.tags.map(t=>'<label class="chip" style="background:'+t.color+'"><input type="checkbox" name="tag" value="'+t.id+'" '+(sel.includes(t.id)||(!n&&section===2&&t.tech)?'checked':'')+'> '+esc(t.name)+'</label>').join('')+field('New tag (optional)',input('newtag'))+'<div class="actions">'+act('Save note')+(n?'<button type="button" id="delete">Delete note</button>':'')+'</div>'));const f=$('#editForm'),check=()=>f.querySelector('[type=submit]').disabled=!(f.body.value.trim()&&f.date.value&&(f.newtag.value.trim()||f.querySelector(':checked')));check();f.oninput=check;f.body.focus();f.onsubmit=e=>{e.preventDefault();let key=nid||id();change(next=>{let tags=[...f.querySelectorAll(':checked')].map(el=>el.value);let name=f.newtag.value.trim();if(name){let t=next.tags.find(t=>t.name.toLowerCase()===name.toLowerCase());if(!t){t={id:id(),name,color:colors[1],tech:section===2};next.tags.push(t)}tags.push(t.id)}const value={id:key,body:f.body.value.trim(),tags:[...new Set(tags)],date:f.date.value,created:n?.created||stamp(),updated:stamp()};if(n)next.notes[next.notes.findIndex(x=>x.id===nid)]=value;else next.notes.push(value)},()=>{day=f.date.value;focusId=key})};if(n)$('#delete').onclick=()=>{
 if($('#deleteConfirm'))return;
 const panel=document.createElement('div');panel.id='deleteConfirm';panel.innerHTML='<p>Delete this note from the journal and remove its reflection links?</p><button type="button" class="keep">Keep note</button> <button type="button" class="destroy">Confirm deletion</button>';
 f.append(panel);panel.querySelector('.keep').focus();
 panel.querySelector('.keep').onclick=()=>{panel.remove();$('#delete').focus()};
 panel.querySelector('.destroy').onclick=()=>change(next=>{next.notes=next.notes.filter(x=>x.id!==nid);next.reflections.forEach(r=>r.links=r.links.filter(x=>x!==nid))},()=>{focusId=''});
}}
function searchPanel(){ensure().then(ok=>{if(!ok)return;show('Search the archive',field('Keywords',input('q'))+field('Search in','<select name="scope"><option>Daily Log</option><option '+(section===2?'selected':'')+'>Tech Log</option><option '+(section===3?'selected':'')+'>Reflections</option></select>')+field('From',input('from','','date'))+field('Through',input('to','','date'))+'<div>'+s.tags.map(t=>'<label class="chip"><input name="tag" type="checkbox" value="'+t.id+'">'+esc(t.name)+'</label>').join('')+'</div><div id="results"></div>');const update=()=>{const val=n=>db.querySelector('[name='+n+']').value,scope=val('scope'),tags=[...db.querySelectorAll(':checked')].filter(x=>x.name==='tag').map(x=>x.value),refs=scope==='Reflections';let matches=(refs?s.reflections:s.notes).filter(n=>(scope!=='Tech Log'||tech(n))&&(!tags.length||(refs?n.links.flatMap(k=>s.notes.find(m=>m.id===k)?.tags||[]):n.tags).some(x=>tags.includes(x)))&&n.body.toLowerCase().includes(val('q').toLowerCase())&&(!val('from')||n.date>=val('from'))&&(!val('to')||n.date<=val('to'))).sort((a,b)=>b.date.localeCompare(a.date));$('#results').innerHTML=matches.map(n=>'<button class="results" onclick="hit(\''+n.id+'\','+(refs?3:scope==='Tech Log'?2:0)+')"><b>'+pretty(n.date)+'</b> · '+esc(n.body.slice(0,100))+(refs?'':chips(n))+'</button>').join('')||'<p>No notes found.</p>'+btn('Reset filters','searchPanel()')};db.oninput=update;modal.addEventListener('close',()=>db.oninput=null,{once:true});update();db.querySelector('input').focus()})}
function hit(nid,i){modal.close();section=i;if(i===3){opened=true;render();reflect(nid)}else gotoDate(s.notes.find(n=>n.id===nid).date,'fan',nid)}
function shift(d,n){const dt=new Date(d+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()+n);return dt.toISOString().slice(0,10)}
function periodStart(d,p){return p==='Monthly'?d.slice(0,7)+'-01':shift(d,-((new Date(d+'T12:00:00Z').getUTCDay()+6)%7))}
function habitPage(){const start=periodStart(day,monthly?'Monthly':'Weekly'),count=monthly?new Date(+day.slice(0,4),+day.slice(5,7),0).getDate():7;return '<span class="micro">Habit Log</span><h2>Habit tracker</h2><p>'+pretty(start)+' · '+(monthly?'Monthly':'Weekly')+'</p>'+btn(monthly?'Weekly grid':'Monthly grid','monthly=!monthly;render()')+' '+btn('Add habit','habitEditor()')+s.habits.filter(h=>!h.archived).map(h=>'<h3>'+esc(h.name)+'</h3><p>'+esc(h.mode)+' · '+h.target+' '+esc(h.unit)+' · '+h.frequency+' days/week '+btn('Edit',"habitEditor('"+h.id+"')")+'</p><div class="grid">'+Array.from({length:count},(_,i)=>{const d=shift(start,i),c=s.checks.find(c=>c.habit===h.id&&c.date===d);return '<button class="'+(c?.status||'').toLowerCase()+'" aria-label="'+esc(d+' '+(c?.status||'Not recorded'))+'" onclick="checkHabit(\''+h.id+'\',\''+d+'\')">'+d.slice(-2)+(c?.status==='Met'?' ✓':c?' ×':'')+'</button>'}).join('')+'</div>').join('')}
function habitEditor(hid){const h=s.habits.find(x=>x.id===hid);show(h?'Edit habit':'Add habit',form(field('Habit name',input('name',h?.name))+field('Mode','<select name="mode">'+['Build','Maintain','Reduce'].map(m=>'<option '+(m===h?.mode?'selected':'')+'>'+m+'</option>').join('')+'</select>')+field('Daily target',input('target',h?.target??1,'number'))+field('Unit',input('unit',h?.unit||'times'))+field('Days per week',input('frequency',h?.frequency||3,'number'))+act('Save habit')+(h?' <button type="button" id="archive">Archive habit</button>':'')));const f=$('#editForm');f.elements.name.required=true;f.frequency.min=1;f.frequency.max=7;f.target.min=0;f.target.step='any';f.onsubmit=e=>{e.preventDefault();change(next=>{const v={id:hid||id(),name:f.elements.name.value.trim(),mode:f.mode.value,target:+f.target.value,unit:f.unit.value,frequency:+f.frequency.value,start:h?.start||day};if(h)Object.assign(next.habits.find(x=>x.id===hid),v);else next.habits.push(v)})};if(h)$('#archive').onclick=()=>{if(confirm('Archive this habit and retain its history?'))change(next=>next.habits.find(x=>x.id===hid).archived=true)}}
function checkHabit(hid,d){const h=s.habits.find(x=>x.id===hid),c=s.checks.find(x=>x.date===d&&x.habit===hid);show(h.name,form('<p>'+pretty(d)+'</p>'+field('Status','<select name="status">'+['Not recorded','Met','Missed'].map(x=>'<option '+(x===c?.status?'selected':'')+'>'+x+'</option>').join('')+'</select>')+field('Measured value in '+esc(h.unit)+' (optional)',input('value',c?.value??'','number'))+act('Save check-in')));const f=$('#editForm');f.elements.value.step='any';f.onsubmit=e=>{e.preventDefault();change(next=>{next.checks=next.checks.filter(x=>x.habit!==hid||x.date!==d);const v=f.elements.value.value,goal=c?.goal||{target:h.target,mode:h.mode,frequency:h.frequency,unit:h.unit};const status=v===''?f.status.value:(goal.mode==='Reduce'?+v<=goal.target:+v>=goal.target)?'Met':'Missed';if(status!=='Not recorded')next.checks.push({id:c?.id||id(),habit:hid,date:d,status,value:v===''?null:+v,goal})})}}
function reflectionPage(){return '<span class="micro">Reflections</span><h2>Reflections</h2>'+btn('Write a reflection','reflect()')+[...s.reflections].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>'<article><h3>'+r.period+' · '+pretty(r.date)+'</h3><p class="writing">'+esc(r.body)+'</p>'+btn('Edit reflection',"reflect('"+r.id+"')")+r.links.map(k=>btn('Linked note',"sourceNote('"+k+"')")).join('')+'</article>').join('')}
function reflect(rid){const r=s.reflections.find(x=>x.id===rid);show(r?'Edit reflection':'Write a reflection',form(field('Period','<select name="period"><option>Weekly</option><option '+(r?.period==='Monthly'?'selected':'')+'>Monthly</option></select>')+field('Date within period',input('date',r?.date||day,'date'))+field('Reflection','<textarea required name="body">'+esc(r?.body)+'</textarea>')+(s.notes.length?'<p class="label">Link journal notes</p>':'')+s.notes.map(n=>'<label class="settingsrow"><input type="checkbox" value="'+n.id+'" '+(r?.links.includes(n.id)?'checked':'')+'>'+esc(n.date+' · '+n.body.slice(0,55))+'</label>').join('')+act('Save reflection')));const f=$('#editForm');f.onsubmit=e=>{e.preventDefault();change(next=>{const v={id:rid||id(),date:periodStart(f.date.value,f.period.value),period:f.period.value,body:f.body.value.trim(),links:[...f.querySelectorAll(':checked')].map(x=>x.value),updated:stamp(),created:r?.created||stamp()};if(r)Object.assign(next.reflections.find(x=>x.id===rid),v);else next.reflections.push(v)})}}
async function settings(){if(!await ensure())return;show('Journal settings',form('<p class="label">Notebook</p><label class="settingsrow"><input type="checkbox" name="hand" '+(s.settings.hand?'checked':'')+'> Handwritten notes</label><label class="settingsrow"><input type="checkbox" name="motion" '+(s.settings.motion?'checked':'')+'> Animate page turns</label>'+field('Time zone (blank uses this device)',input('zone',s.settings.zone))+'<p class="label">Tags</p><div id="taglist"></div><button type="button" id="addtag">Add tag</button><div class="actions">'+act('Save settings')+'<button type="button" onclick="downloadArchive()">Export JSON</button><button type="button" onclick="downloadArchive(true)">Export Markdown</button></div>'+(!rev?'<label class="field">Import previous journal (.json)<input type="file" accept=".json" onchange="importJournal(this.files[0])"></label>':'')+'</form><p><a class="link" href="/logout" target="_top">Sign out</a></p>'));const row=t=>'<div class="settingsrow tagrow" data-id="'+t.id+'"><input aria-label="Tag color" type="color" value="'+t.color+'"><input required aria-label="Tag name" type="text" value="'+esc(t.name)+'"><label><input type="checkbox" '+(t.tech?'checked':'')+'> Technical</label></div>';$('#taglist').innerHTML=s.tags.map(row).join('');$('#addtag').onclick=()=>$('#taglist').insertAdjacentHTML('beforeend',row({id:id(),color:colors[1],name:''}));const f=$('#editForm');f.onsubmit=e=>{e.preventDefault();change(next=>{next.settings={motion:f.motion.checked,hand:f.hand.checked,zone:f.zone.value.trim()};next.tags=[...db.querySelectorAll('.tagrow')].map(el=>({id:el.dataset.id,name:el.children[1].value.trim(),color:el.children[0].value,tech:el.querySelector('[type=checkbox]').checked}))})}}
function downloadArchive(md=false){const body=md?s.notes.map(n=>'## '+n.date+'\n\n'+n.body+'\n\n'+n.tags.map(t=>'#'+s.tags.find(x=>x.id===t).name).join(' ')).join('\n\n'):JSON.stringify({version:1,...s},null,2);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:md?'text/markdown':'application/json'}));a.download='notes-on-becoming-'+TODAY()+(md?'.md':'.json');a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
document.addEventListener('keydown',e=>{if(e.key==='/'&&!modal.open&&!e.target.matches('input,textarea,select')){e.preventDefault();searchPanel()}});
let reflowTimer;
function reflowPages(){if(opened&&(section===0||section===2)){layoutKey='';render()}}
window.addEventListener('resize',()=>{clearTimeout(reflowTimer);reflowTimer=setTimeout(reflowPages,150)});
document.fonts.addEventListener('loadingdone',reflowPages);
const route=location.hash.match(/^#([0-3])\/(\d{4}-\d{2}-\d{2})$/);cover();ready=load();ready.then(()=>{if(route&&!isNaN(Date.parse(route[2]))){day=route[2];enter(+route[1],true)}}).catch(()=>{});

async function importJournal(file){if(!file||rev)return;try{const {version,...data}=JSON.parse(await file.text());if(version!==1||!Array.isArray(data.notes))throw Error();await change(next=>Object.assign(next,data))}catch{$('#err').textContent='Choose a JSON export from Notes on Becoming.'}}
