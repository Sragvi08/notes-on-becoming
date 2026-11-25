const defaults=()=>({tags:['Learning','Small wins','Technical','Proud'].map((name,i)=>({id:'tag'+i,name,color:['#B2D9E0','#FBDBBF','#A7BA93','#F9B97F'][i],tech:i===2})),notes:[],habits:[],checks:[],reflections:[],settings:{motion:true,hand:true,zone:''}});
const dateOK=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d))&&new Date(d).toISOString().startsWith(d);
const str=s=>typeof s==='string'&&s.trim().length>0;
function valid(s){
 if(!s||!['tags','notes','habits','checks','reflections'].every(k=>Array.isArray(s[k])&&s[k].every(r=>r&&typeof r.id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(r.id))&&new Set(s[k].map(r=>r.id)).size===s[k].length))return false;
 const exists=(k,id)=>s[k].some(r=>r.id===id);
 try{new Intl.DateTimeFormat('en',{timeZone:s.settings.zone||'UTC'})}catch{return false}
 return typeof s.settings.motion==='boolean'&&typeof s.settings.hand==='boolean'&&s.tags.every(t=>str(t.name)&&/^#[a-f0-9]{6}$/i.test(t.color)&&typeof t.tech==='boolean')&&s.notes.every(n=>dateOK(n.date)&&str(n.body)&&Array.isArray(n.tags)&&n.tags.length&&n.tags.every(t=>exists('tags',t)))&&s.habits.every(h=>str(h.name)&&['Build','Maintain','Reduce'].includes(h.mode)&&Number.isFinite(h.target)&&h.frequency>=1&&h.frequency<=7)&&s.checks.every(c=>exists('habits',c.habit)&&dateOK(c.date)&&['Met','Missed'].includes(c.status))&&s.reflections.every(r=>str(r.body)&&dateOK(r.date)&&['Weekly','Monthly'].includes(r.period)&&r.links.every(id=>exists('notes',id)));
}

export {defaults,valid};