(function(root){
const core=typeof module==='object'&&module.exports?require('./tradeoff-core.js'):root.TradeoffCore;
function calculate(x){
 const keys=['incomeA','incomeB','hoursA','hoursB','recoveryA','recoveryB','effortA','effortB','weeks'];
 if(keys.some(k=>!Number.isFinite(x[k]))||x.incomeA<=0||x.incomeB<=0||x.weeks<1||x.weeks>52||['hoursA','hoursB','recoveryA','recoveryB'].some(k=>x[k]<0)||['effortA','effortB'].some(k=>x[k]<0||x[k]>10)||x.hoursA+x.recoveryA>168||x.hoursB+x.recoveryB>168)throw Error('Enter positive incomes, 1–52 weeks, effort ratings from 0–10, and schedules totaling no more than 168 hours per week.');
 const timeA=x.hoursA+x.recoveryA,timeB=x.hoursB+x.recoveryB,extra=timeB-timeA,log=Math.log(x.incomeB/x.incomeA),gain=x.incomeB-x.incomeA;
 let preference=null;
 if(x.preference!==null&&x.preference!==undefined){if(!Number.isFinite(x.preference)||x.preference<=0||x.preference>168)throw Error('Your optional time limit must be greater than zero and no more than 168 hours.');const rate=Math.log(1.2)/x.preference;preference={margin:log-rate*extra,breakEven:x.incomeA*Math.exp(rate*extra)};}
 return {gain,percent:100*(x.incomeB/x.incomeA-1),index:100*log,timeA,timeB,extra,annualExtra:extra*x.weeks,loadA:x.hoursA*x.effortA/10,loadB:x.hoursB*x.effortB/10,perExtraHour:extra>0?gain/(extra*x.weeks):null,preference};
}
const factorNames={income:'Income',time:'Free time',energy:'Energy',security:'Financial security / benefits',flexibility:'Flexibility / control',meaning:'Meaning / growth',connection:'Relationships',health:'Health / sustainable stress',other:'Your additional factor',now:'Feelings now',later:'Feelings later',outcome:'Expected outcome value'};
function scoreTradeoff(x,p){
 const r=calculate(x),parts=[];
 for(const [key,label] of Object.entries(factorNames)){
 const f=p.factors[key]||{weight:0},w=f.weight;
 if(!Number.isFinite(w)||w<0||w>5)throw Error(label+': importance must be between 0 and 5.');
 if(w===0)continue;
 let delta;
 if(['income','time','energy'].includes(key)){
 if(!Number.isFinite(f.swing)||f.swing<=0)throw Error(label+': enter a positive major-change amount.');
 delta=key==='income'?Math.log(x.incomeB/x.incomeA)/Math.log1p(f.swing/100):key==='time'?-r.extra/f.swing:(r.loadA-r.loadB)/f.swing;
 }else{if(!Number.isFinite(f.a)||!Number.isFinite(f.b)||f.a<0||f.a>10||f.b<0||f.b>10)throw Error(label+': rate both options from 0 to 10, or set importance to 0.');delta=(f.b-f.a)/10;}
 parts.push({key,label,weight:w,delta});
 }
 const result=core.weightedTradeoff(parts),limits=[],alternativeLimits=[];
 for(const [key,value,label] of [['maxTime',r.timeB,'total weekly time'],['maxLoad',r.loadB,'weekly effort load']]){if(p[key]!==null&&p[key]!==undefined){if(!Number.isFinite(p[key])||p[key]<0||p[key]>168)throw Error('Hard limits must be between 0 and 168.');if(value>p[key])limits.push(label);if((key==='maxTime'?r.timeA:r.loadA)>p[key])alternativeLimits.push(label);}}
 return {...result,limits,alternativeLimits,verdict:core.constrainedVerdict(result,{preferred:limits,alternative:alternativeLimits,preferredName:'New option',alternativeName:'Current option'})};
}
if(typeof module==='object'&&module.exports)module.exports={calculate,scoreTradeoff};
if(!root.document)return;
const el=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n),n=v=>v.toFixed(1),signed=v=>(v>0?'+':'')+n(v);
function render(event){event?.preventDefault();const x={};['incomeA','incomeB','hoursA','hoursB','recoveryA','recoveryB','effortA','effortB','weeks'].forEach(k=>{const id='trade'+k[0].toUpperCase()+k.slice(1);x[k]=el(id).value.trim()===''?NaN:Number(el(id).value)});x.preference=el('tradePreference').value===''?null:Number(el('tradePreference').value);
const out=el('tradeResult');try{const r=calculate(x);out.replaceChildren();const line=(title,text)=>{const p=document.createElement('p'),b=document.createElement('b');b.textContent=title+' ';p.append(b,document.createTextNode(text));out.append(p)};
const profile={factors:{}};
for(const key of Object.keys(factorNames)){const read=id=>{const v=el(id).value;return v.trim()===''?NaN:Number(v)};profile.factors[key]={weight:read('scoreWeight_'+key)};if(['income','time','energy'].includes(key))profile.factors[key].swing=read('scoreSwing_'+key);else Object.assign(profile.factors[key],{a:read('scoreA_'+key),b:read('scoreB_'+key)});}
for(const [k,id] of [['maxTime','scoreMaxTime'],['maxLoad','scoreMaxLoad']])profile[k]=el(id).value===''?null:Number(el(id).value);
try{const original=scoreTradeoff(x,profile),rawProfile=JSON.parse(JSON.stringify(profile)),learning=root.WamDecisionLearning?.processIncome(profile,x);if(learning)Object.assign(profile,learning.input);const score=scoreTradeoff(learning?.schedule||x,profile);const heading=document.createElement('h3');heading.textContent=`${n(score.score)}/100 · ${score.verdict}`;out.append(heading);
if(learning){line('Personal learning:',learning.summary);if(learning.snapshot.applied)line('Before / after learning:',`${n(original.score)}/100 → ${n(score.score)}/100. Checked personal estimates were used; your priorities and hard limits stay fixed.`);for(const change of learning.snapshot.changes.filter(c=>c.applied&&c.kind==='resource'))line(change.label+':',`${n(change.original)} → ${n(change.value)} ${change.unit}; ${change.n} outcomes, ${change.checked} chronological checks; average error ${n(change.mae)} vs ${n(change.originalMae)} before correction.`);if(learning.snapshot.changes.some(c=>c.kind==='resource'&&c.applied)){const used=calculate(learning.schedule||x);line('Resources used in the score:',`Current → new option: ${n(used.timeA)} → ${n(used.timeB)} total hours/week; ${n(used.loadA)} → ${n(used.loadB)} equivalent full-effort hours/week. Recovery is included in time, not counted again in work intensity.`);}if(learning.snapshot.changes.some(c=>c.kind==='resource'&&c.reason?.includes('168')))line('Resource correction withheld:', 'The combined learned weekly time would exceed 168 hours. Original weekly time forecasts are used.');root.WamDecisionLearning.captureIncome({x,profile:rawProfile,result:score,learnedSchedule:learning.schedule,learning:{...learning.snapshot,originalScore:original.score,adjustedScore:score.score}});}
line('How to read it:', '50 means an even tradeoff; higher favors option B. This is a personal decision score, not predicted happiness or a probability.');
if(score.limits.length)line('Option B hard limits:', 'Exceeds your '+score.limits.join(' and ')+'.');if(score.alternativeLimits.length)line('Current option hard limits:', 'Exceeds your '+score.alternativeLimits.join(' and ')+'.');if(score.limits.length||score.alternativeLimits.length)line('Hard limit override:', 'The preference score does not override your limits. Revise any option that exceeds them.');
for(const f of score.parts)line(f.label+':',`${signed(f.points)} score points · importance ${f.weight}/5${f.capped?' · major-change cap reached':''}.`);
line('Assumption check:',`${n(score.low)}–${n(score.high)}/100 when all included factor comparisons move 0.1 normalized units in either direction. This is a sensitivity scenario, not statistical uncertainty.${score.low<=55&&score.high>=45?' Small assumption changes can affect the verdict.':''}`);
}catch(e){line('Personal score needs your input:',e.message)}
line('Income:',`${fmt(x.incomeA)} → ${fmt(x.incomeB)} per year; ${fmt(r.gain)} (${signed(r.percent)}%). Research-shaped income index: ${signed(r.index)} points, not happiness points.`);
line('Entered time forecast:',`${n(r.timeA)} → ${n(r.timeB)} hours/week including recovery; ${signed(r.extra)} hours/week or ${signed(r.annualExtra)} hours over ${x.weeks} weeks.`);
line('Entered effort forecast:',`${n(r.loadA)} → ${n(r.loadB)} self-rated equivalent full-effort hours/week (${signed(r.loadB-r.loadA)}). Recovery: ${n(x.recoveryA)} → ${n(x.recoveryB)} hours/week. This is not a physical energy measurement.`);
line('What the extra time earns:',r.perExtraHour===null?'No positive increase in total weekly time, so no extra-hour rate is calculated.':`${fmt(r.perExtraHour)} additional annual gross income per additional committed hour. Taxes and extra expenses are excluded.`);
if(r.preference){const m=r.preference.margin;line('Against your stated time preference:',`${Math.abs(m)<1e-9?'The options break even':m>0?'Option B exceeds your income-for-time requirement':'Option B falls short of your income-for-time requirement'}. At this time difference, the break-even annual income for B is ${fmt(r.preference.breakEven)}. This uses your preference, not a scientific happiness threshold; compare the effort difference separately.`)}else line('Separate income-for-time check:', 'Set your optional time preference to calculate a personal break-even income. The app does not invent a money-to-time or money-to-energy exchange rate.');
}catch(e){out.textContent=e.message}}
el('tradeForm').addEventListener('submit',render);
el('tradeExample').addEventListener('click',()=>{Object.entries({IncomeA:60000,IncomeB:75000,HoursA:40,HoursB:50,RecoveryA:3,RecoveryB:6,EffortA:5,EffortB:7,Weeks:48,Preference:8}).forEach(([k,v])=>el('trade'+k).value=v);for(const key of Object.keys(factorNames))el('scoreWeight_'+key).value=0;for(const [key,weight,swing] of [['income',4,20],['time',4,8],['energy',3,10]]){el('scoreWeight_'+key).value=weight;el('scoreSwing_'+key).value=swing;}el('scoreWeight_flexibility').value=2;el('scoreA_flexibility').value=7;el('scoreB_flexibility').value=4;el('scoreMaxTime').value='';el('scoreMaxLoad').value='';render()});
})(typeof globalThis!=='undefined'?globalThis:this);
