/* Shared preference arithmetic. A score is neither a happiness forecast nor a probability. */
(function(root){
function weightedTradeoff(parts,temporal){
 if(!Array.isArray(parts)||!parts.length)throw Error('Choose at least one priority above 0.');
 let total=0;
 let normalized=parts.map(f=>{if(!Number.isFinite(f.weight)||f.weight<=0||f.weight>5||!Number.isFinite(f.delta))throw Error('Each selected criterion needs a valid importance and comparison.');total+=f.weight;return {...f,delta:Math.max(-1,Math.min(1,f.delta)),capped:Math.abs(f.delta)>1};});
 let timing=null;
 if(temporal){
  if(!Number.isFinite(temporal.days)||temporal.days<=0||temporal.days>36500||!['average','endpoint'].includes(temporal.view)||!temporal.effects||typeof temporal.effects!=='object'||Array.isArray(temporal.effects)||!Object.keys(temporal.effects).length)throw Error('Choose a valid time window, score view and effect.');
  const blocked=['money','time','energy','effort','income','later'];
  for(const key of Object.keys(temporal.effects))if(blocked.includes(key)||!normalized.some(f=>f.key===key))throw Error('Choose an included benefit criterion for the time effect. Costs and explicit later forecasts stay unchanged.');
  const effects=[];
  normalized=normalized.map(f=>{const e=temporal.effects[f.key];if(!e)return {...f,immediateDelta:f.delta,averageDelta:f.delta,endpointDelta:f.delta};const v=timeEffect(f.delta,e,temporal.days);effects.push({key:f.key,label:f.label,shape:e.shape,changeDays:e.changeDays,...v});return {...f,immediateDelta:f.delta,averageDelta:v.average,endpointDelta:v.endpoint,delta:temporal.view==='average'?v.average:v.endpoint};});
  const scoreAt=field=>50+50*normalized.reduce((sum,f)=>sum+f.weight*f[field],0)/total;
  timing={days:temporal.days,view:temporal.view,immediateScore:scoreAt('immediateDelta'),averageScore:scoreAt('averageDelta'),endpointScore:scoreAt('endpointDelta'),effects};
 }
 normalized.forEach(f=>f.points=50*f.weight*f.delta/total);
 const score=Math.max(0,Math.min(100,50+normalized.reduce((s,f)=>s+f.points,0)));
 const low=Math.max(0,50+normalized.reduce((s,f)=>s+50*f.weight*Math.max(-1,f.delta-.1)/total,0));
 const high=Math.min(100,50+normalized.reduce((s,f)=>s+50*f.weight*Math.min(1,f.delta+.1)/total,0));
 return {score,parts:normalized,low,high,...(timing?{temporal:timing}:{}),preference:score>55?'preferred':score<45?'alternative':'close'};
}
function timeEffect(delta,e,days){
 if(!Number.isFinite(delta)||Math.abs(delta)>1||!Number.isFinite(days)||days<=0||days>36500||!['fade','lasting','grow'].includes(e?.shape))throw Error('Enter a supported effect and positive time window.');
 if(e.shape==='lasting')return {initial:delta,endpoint:delta,average:delta,total:delta*days};
 if(!Number.isFinite(e.changeDays)||e.changeDays<.001||e.changeDays>36500)throw Error('Enter a positive half-life or doubling time in days.');
 const k=Math.LN2/e.changeDays,a=Math.abs(delta),sign=Math.sign(delta);if(!a)return {initial:0,endpoint:0,average:0,total:0};
 let endpoint,total;
 if(e.shape==='fade'){endpoint=delta*Math.exp(-k*days);total=delta*(-Math.expm1(-k*days))/k;}
 else{const capTime=-Math.log(a)/k,t=Math.min(days,capTime);endpoint=sign*Math.exp(Math.min(0,Math.log(a)+k*days));total=sign*((Math.exp(Math.log(a)+k*t)-a)/k+Math.max(0,days-capTime));}
 return {initial:delta,endpoint,average:total/days,total};
}
function constrainedVerdict(result,{preferred=[],alternative=[],boundary=false,preferredName='Main option',alternativeName='Alternative'}={}){
 if(boundary)return 'Respect their answer — step back';
 if(preferred.length&&alternative.length)return 'Both options exceed your hard limits — change the plan';
 if(preferred.length)return preferredName+' exceeds your hard limit';
 if(alternative.length)return alternativeName+' exceeds your hard limit — '+preferredName.toLowerCase()+' fits those limits';
 return result.preference==='preferred'?preferredName+' looks worth it for your priorities':result.preference==='alternative'?alternativeName+' looks better for your priorities':'Close call — neither option clearly wins';
}
const api={weightedTradeoff,constrainedVerdict,timeEffect};if(typeof module==='object'&&module.exports)module.exports=api;root.TradeoffCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
