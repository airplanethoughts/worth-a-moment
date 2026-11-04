/* Bayesian/ridge calibration of reported feelings, not a universal emotion model. */
(function(root){
'use strict';
const VERSION=1,LAMBDA=5,MIN_TRAIN=6,MIN_CHECKS=4,MIN_GAIN=.05;
const clip=x=>Math.max(0,Math.min(10,x));
const rating=v=>(typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=10?Number(v):null;
function scaleKey(p){if(!p||!['scaleDefinition','anchorLow','anchorMid','anchorHigh'].every(k=>typeof p[k]==='string'&&p[k].trim()))return null;return JSON.stringify(['scaleDefinition','anchorLow','anchorMid','anchorHigh'].map(k=>p[k].trim()));}
function horizonKey(slot,horizon){return slot==='now'?'now':typeof horizon==='string'&&horizon.trim()?'later:'+horizon.trim().toLowerCase():null;}
function observations(items,asOf=Date.now()){
 const out=[],seen=new Set();
 for(const item of items){if(!item||typeof item.id!=='string'||item.simulated||seen.has(item.id))continue;seen.add(item.id);const scale=scaleKey(item.personalScale),decisionAt=Date.parse(item.date),outcome=item.feelingOutcomes;if(!scale||!Number.isFinite(decisionAt)||!['do','alt'].includes(outcome?.choice))continue;
 const context=['everyday','purchase','relationship','income'].includes(item.decisionType)?item.decisionType:'everyday';
 for(const slot of ['now','later']){const actual=outcome[slot],observedAt=Date.parse(actual?.recordedAt),value=rating(actual?.value),forecast=rating(item.personalScale[(outcome.choice==='do'?'scoreDo':'scoreAlt')+(slot==='now'?'Now':'Later')]),horizon=horizonKey(slot,item.personalScale.horizon);
 if(value===null||forecast===null||actual?.timingConfirmed!==true||!Number.isFinite(observedAt)||observedAt<=decisionAt||observedAt>asOf||!horizon)continue;
 out.push({id:item.id+':'+slot,decisionAt,observedAt,forecast,actual:value,scale,context,horizon});
 }}return out;
}
function fit(rows){if(!rows.length)return null;let a=rows.length+LAMBDA,b=0,c=LAMBDA,u=0,v=0;for(const r of rows){const z=(r.forecast-5)/5,error=r.actual-r.forecast;b+=z;c+=z*z;u+=error;v+=z*error;}const determinant=a*c-b*b;return [(u*c-v*b)/determinant,(v*a-u*b)/determinant];}
function estimate(beta,forecast){return clip(forecast+beta[0]+beta[1]*(forecast-5)/5);}
function supported(rows,forecast){return rows.length&&forecast>=Math.min(...rows.map(r=>r.forecast))-1&&forecast<=Math.max(...rows.map(r=>r.forecast))+1;}
function train(input,asOf=Date.now()){
 const rows=input.filter(r=>Number.isFinite(r.decisionAt)&&Number.isFinite(r.observedAt)&&r.observedAt>r.decisionAt&&r.observedAt<=asOf&&rating(r.forecast)!==null&&rating(r.actual)!==null).map(r=>({...r,forecast:rating(r.forecast),actual:rating(r.actual)})).sort((a,b)=>a.observedAt-b.observedAt).slice(-200);
 let checked=0,error=0,originalError=0;const checks=[];
 // Every historical prediction may use only outcomes known before that decision was saved.
 for(const row of rows){const past=rows.filter(r=>r.id!==row.id&&r.observedAt<row.decisionAt);if(past.length<MIN_TRAIN||!supported(past,row.forecast))continue;const predicted=estimate(fit(past),row.forecast);error+=Math.abs(predicted-row.actual);originalError+=Math.abs(row.forecast-row.actual);checked++;checks.push({id:row.id,trainingIds:past.map(r=>r.id),predicted,actual:row.actual});}
 const mae=checked?error/checked:null,originalMae=checked?originalError/checked:null,ready=rows.length>=MIN_TRAIN+MIN_CHECKS&&checked>=MIN_CHECKS&&mae+MIN_GAIN<originalMae;
 const reason=rows.length<MIN_TRAIN+MIN_CHECKS?'Need at least 10 comparable completed outcomes.':checked<MIN_CHECKS?'Need four later decisions with at least six outcomes already known when each forecast was saved.':!ready?'The correction has not improved on your original forecasts by at least 0.05 points.':'The correction improved on your original forecasts in chronological checks.';
 return {version:VERSION,ready,n:rows.length,checked,mae,originalMae,beta:fit(rows),minForecast:rows.length?Math.min(...rows.map(r=>r.forecast)):null,maxForecast:rows.length?Math.max(...rows.map(r=>r.forecast)):null,reason,checks};
}
function predict(model,forecast){const value=rating(forecast);if(value===null)return {value:null,applied:false,reason:'No original feeling forecast.'};if(!model.ready)return {value,applied:false,reason:model.reason};if(value<model.minForecast-1||value>model.maxForecast+1)return {value,applied:false,reason:'Outside the range checked against your past forecasts.'};return {value:estimate(model.beta,value),applied:true,reason:'Personal correction applied.'};}
function calibrate(items,{scale,context,horizon,forecast,asOf=Date.now(),enabled=true}){const rows=observations(items,asOf).filter(r=>r.scale===scale&&r.context===context&&r.horizon===horizon),model=train(rows,asOf),result=enabled?predict(model,forecast):{value:rating(forecast),applied:false,reason:'Learning is switched off.'};return {...result,model};}
const api={VERSION,LAMBDA,MIN_TRAIN,MIN_CHECKS,MIN_GAIN,rating,scaleKey,horizonKey,observations,fit,estimate,train,predict,calibrate};if(typeof module==='object'&&module.exports)module.exports=api;root.FeelingCalibration=api;
})(typeof globalThis!=='undefined'?globalThis:this);
