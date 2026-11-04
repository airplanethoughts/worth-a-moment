/* Beta-Bernoulli forecasts by observed preparation dose. Association, not causation. */
(function(root){
'use strict';
const VERSION=1,MIN=12,CHECKS=4,IMPROVEMENT=.005;
const band=m=>m<=15?0:m<=60?1:2;
function rows(records,asOf=Date.now()){
 const out=[],seen=new Set();for(const r of records){const s=r?.preparationStudy,a=s?.actual,d=Date.parse(r?.date),t=Date.parse(a?.recordedAt);if(!r||seen.has(r.id)||r.simulated||s?.version!==1||!['everyday','purchase','relationship','income'].includes(s.context)||typeof s.definition!=='string'||!s.definition.trim()||!['light','prepared'].includes(s.chosen)||typeof a?.success!=='boolean'||!Number.isFinite(a.minutes)||a.minutes<0||a.minutes>100000||!Number.isFinite(d)||!Number.isFinite(t)||t<=d||t>asOf)continue;seen.add(r.id);if(r.decisionType!=='preparation'&&['do','alt'].includes(r.outcomeChoice)&&r.outcomeChoice!==(s.chosen==='prepared'?'do':'alt'))continue;const planned=s.input?.[s.chosen]?.time;if(!Number.isFinite(planned)||planned<0||planned>100000)continue;out.push({id:r.id,context:s.context,definition:s.definition.trim(),decisionAt:d,observedAt:t,minutes:a.minutes,planned,success:Number(a.success)});}return out;
}
function posterior(a){const n=a.length,s=a.reduce((t,r)=>t+r.success,0),alpha=s+1,beta=n-s+1,p=alpha/(n+2),sd=Math.sqrt(alpha*beta/((n+2)**2*(n+3)));return {n,s,p,low:Math.max(0,p-2*sd),high:Math.min(1,p+2*sd),min:n?Math.min(...a.map(r=>r.minutes)):null,max:n?Math.max(...a.map(r=>r.minutes)):null};}
function fit(a){return {pooled:posterior(a),bands:[0,1,2].map(b=>posterior(a.filter(r=>band(r.minutes)===b)))};}
function supported(g,m,min=3){return g.n>=min&&Math.log1p(m)>=Math.log1p(g.min)-Math.log(2)&&Math.log1p(m)<=Math.log1p(g.max)+Math.log(2);}
function train(all,context,definition,asOf=Date.now()){
 const data=all.filter(r=>r.context===context&&r.definition===definition&&r.observedAt<=asOf).sort((a,b)=>a.decisionAt-b.decisionAt||a.id.localeCompare(b.id)).slice(-200);const model=fit(data);let brier=0,baseline=0,checked=0;
 for(const r of data){const past=data.filter(p=>p.observedAt<r.decisionAt),m=fit(past),g=m.bands[band(r.planned)];if(past.length<6||!supported(g,r.planned,2))continue;brier+=(g.p-r.success)**2;baseline+=(m.pooled.p-r.success)**2;checked++;}
 const error=checked?brier/checked:null,baseError=checked?baseline/checked:null;
 const varied=model.bands.filter(g=>g.n>=3).length>=2,ready=data.length>=MIN&&varied&&checked>=CHECKS&&baseError-error>IMPROVEMENT;
 const reason=data.length<MIN?'Need at least 12 comparable completed outcomes.':!varied?'Need at least three outcomes in each of two preparation-time bands.':checked<CHECKS?'Need four chronological checks with earlier known outcomes.':!ready?'Preparation bands have not improved Brier error over the pooled success rate by 0.005.':'Preparation-time forecasts improved on the pooled baseline in chronological checks.';
 return {version:VERSION,...model,n:data.length,checked,brier:error,baseline:baseError,ready,reason};
}
function predict(m,minutes,enabled=true){if(!Number.isFinite(minutes)||minutes<0||minutes>100000)return {applied:false,reason:'Enter valid planned preparation minutes.'};const g=m.bands[band(minutes)];if(!enabled||!m.ready)return {applied:false,reason:!enabled?'Preparation probability learning is off.':m.reason,n:g.n};if(!supported(g,minutes))return {applied:false,reason:'Not enough comparable outcomes near this preparation duration.',n:g.n};return {...g,applied:true,band:band(minutes),reason:'Learned from chosen-plan outcomes; not a causal effect.'};}
function outcomeFactor(main,alternative,success,failure,weight){if(!main.applied||!alternative.applied)throw Error('Both plans need supported, checked preparation probabilities.');if(![success,failure,weight].every(Number.isFinite)||success<=failure||success>100||failure<0||weight<=0||weight>5)throw Error('Enter outcome values from 0–100 (success higher) and importance above 0.');return {weight,a:(failure+main.p*(success-failure))/10,b:(failure+alternative.p*(success-failure))/10};}
const api={VERSION,MIN,CHECKS,IMPROVEMENT,band,rows,posterior,train,predict,outcomeFactor};if(typeof module==='object'&&module.exports)module.exports=api;root.PreparationProbability=api;
})(typeof globalThis!=='undefined'?globalThis:this);
