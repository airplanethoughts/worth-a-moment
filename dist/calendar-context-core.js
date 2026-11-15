/* Pure calendar/history functions. Provider plans and observed outcomes remain distinct. */
(function(root){'use strict';
const text=v=>typeof v==='string'?v.trim():'';
const titleKey=v=>text(v).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ');
function stamp(part){if(!part||typeof part!=='object')return null;if(typeof part.dateTime==='string'&&/(Z|[+-]\d{2}:\d{2})$/.test(part.dateTime)){const ms=Date.parse(part.dateTime);return Number.isFinite(ms)?ms:null;}if(typeof part.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(part.date)){const [y,m,d]=part.date.split('-').map(Number),dt=new Date(y,m-1,d);return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d?dt.getTime():null;}return null;}
function event(raw,calendarId='primary'){
 if(!raw||typeof raw.id!=='string'||raw.status==='cancelled'||raw.attendees?.some(a=>a.self&&a.responseStatus==='declined'))return null;
 const start=stamp(raw.start),end=stamp(raw.end);if(start===null||end===null||end<=start)return null;
 return {key:calendarId+':'+raw.id,id:raw.id,calendarId,title:text(raw.summary).slice(0,160)||'Untitled event',start,end,allDay:!!raw.start.date,busy:raw.transparency!=='transparent',tentative:raw.status==='tentative',recurring:typeof raw.recurringEventId==='string'};
}
function overlaps(events,start,end){return events.filter(e=>e.busy&&e.start<end&&e.end>start).sort((a,b)=>a.start-b.start);}
function busyMinutes(events,start,end){let total=0,last=start;for(const e of overlaps(events,start,end)){const a=Math.max(start,e.start),b=Math.min(end,e.end);total+=Math.max(0,b-Math.max(last,a));last=Math.max(last,b);}return total/60000;}
function candidates(e,records){const seen=new Set();return records.filter(r=>{if(!r||typeof r.id!=='string'||seen.has(r.id)||r.simulated||['income','preparation'].includes(r.decisionType))return false;seen.add(r.id);return titleKey(r.task)===titleKey(e.title)||r.calendarSource?.key===e.key;}).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,20);}
function feedback(records,asOf=Date.now()){
 const seen=new Set();return records.filter(r=>{const f=r?.calendarFeedback,s=r?.calendarSource;if(!s||typeof s.key!=='string'||seen.has(s.key)||!f||f.attended!==true||!['yes','mixed','no'].includes(f.worth)||!Number.isFinite(s.end)||s.end>asOf||!Number.isFinite(Date.parse(f.recordedAt))||Date.parse(f.recordedAt)<s.end||Date.parse(f.recordedAt)>asOf||r.simulated)return false;seen.add(s.key);return true;});
}
function worthSummary(records,asOf){const rows=feedback(records,asOf),counts={yes:0,mixed:0,no:0};for(const r of rows)counts[r.calendarFeedback.worth]++;const n=rows.length;return {n,counts,probability:n?(counts.yes+1)/(n+3):null,prior:[1,1,1],ids:rows.map(r=>r.id)};}
function chooseSnapshot(record){if(!record||record.outcomeChoice==='alt'||record.resourceOutcomes?.choice==='alt'||record.feelingOutcomes?.choice==='alt')return null;return record;}
const api={titleKey,stamp,event,busyMinutes,candidates,feedback,worthSummary,chooseSnapshot};if(typeof module==='object'&&module.exports)module.exports=api;root.WamCalendarCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
