/* Expected-utility scenarios, not a causal model of effort or a luck detector. */
(function(root){
'use strict';
const core=typeof module==='object'&&module.exports?require('./tradeoff-core.js'):root.TradeoffCore;
const finite=(x,min,max,label)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<min||x>max)throw Error(label+' is outside its supported range.');return x;};
function compare(x){
 const success=finite(x.success,0,100,'Success value'),failure=finite(x.failure,0,100,'Other outcome value');
 if(success<=failure)throw Error('Define success so its personal value is higher than the other outcome.');
 const weights={},swings={};for(const key of ['outcome','time','money','effort'])weights[key]=finite(x.weights?.[key],0,5,key+' importance');
 if(!weights.outcome)throw Error('Give the outcome a positive importance.');
 for(const key of ['time','money','effort']){swings[key]=finite(x.swings?.[key],Number.MIN_VALUE,1e9,key+' major change');}
 for(const side of ['light','prepared']){const a=x[side];if(!a)throw Error('Enter both plans.');for(const k of ['low','p','high'])finite(a[k],0,1,'Probability');if(a.low>a.p||a.p>a.high)throw Error('Each probability needs low ≤ best estimate ≤ high.');for(const k of ['time','money','effort'])finite(a[k],0,k==='effort'?10:1e9,k+' cost');}
 const gap=(success-failure)/100,costParts=['time','money','effort'].filter(k=>weights[k]>0).map(k=>({key:k,label:k+' kept',weight:weights[k],delta:(x.light[k]-x.prepared[k])/swings[k]}));
 const scoreAt=(p,q)=>core.weightedTradeoff([{key:'outcome',label:'Expected outcome value',weight:weights.outcome,delta:(p-q)*gap},...costParts],x.temporal);
 const result=scoreAt(x.prepared.p,x.light.p),low=scoreAt(x.prepared.low,x.light.high).score,high=scoreAt(x.prepared.high,x.light.low).score;
 const cost=costParts.reduce((s,f)=>s+f.weight*Math.max(-1,Math.min(1,f.delta)),0);
 let breakEven=x.light.p-cost/(weights.outcome*gap);
 if(x.temporal){if(scoreAt(1,x.light.p).score<50)breakEven=2;else if(scoreAt(0,x.light.p).score>=50)breakEven=-1;else{let lo=0,hi=1;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(scoreAt(mid,x.light.p).score>=50)hi=mid;else lo=mid;}breakEven=hi;}}
 const limits=[];for(const k of ['time','money','effort']){const v=x.limits?.[k];if(v===null||v===undefined)continue;finite(v,0,k==='effort'?10:1e9,k+' limit');for(const side of ['light','prepared'])if(x[side][k]>v)limits.push(side+' exceeds '+k+' limit');}
 return {...result,range:{low,high},breakEven,expected:{light:x.light.p*success+(1-x.light.p)*failure,prepared:x.prepared.p*success+(1-x.prepared.p)*failure},probabilityChange:x.prepared.p-x.light.p,limits,blocked:!!x.declined||limits.length>0,robust:low>50?'prepared':high<50?'light':'uncertain'};
}
function evidence(records,context,definition){const rows=[];for(const r of records){const s=r?.preparationStudy,o=s?.actual;if(r.simulated||s?.version!==1||s.context!==context||s.definition!==definition||!['light','prepared'].includes(s.chosen)||!o||typeof o.success!=='boolean'||!Number.isFinite(o.minutes)||o.minutes<0||Date.parse(o.recordedAt)<=Date.parse(r.date)||!Number.isFinite(Date.parse(o.recordedAt))||Date.parse(o.recordedAt)>Date.now())continue;if(r.decisionType!=='preparation'&&['do','alt'].includes(r.outcomeChoice)&&r.outcomeChoice!==(s.chosen==='prepared'?'do':'alt'))continue;const p=s.input?.[s.chosen]?.p;const probability=typeof p==='number'&&Number.isFinite(p)&&p>=0&&p<=1?p:null;rows.push({choice:s.chosen,success:o.success,minutes:o.minutes,p:probability});}
 const groups={};for(const choice of ['light','prepared']){const a=rows.filter(r=>r.choice===choice),n=a.length,s=a.filter(r=>r.success).length,forecasted=a.filter(r=>r.p!==null);groups[choice]={n,successes:s,rate:n?s/n:null,smoothed:(s+1)/(n+2),meanMinutes:n?a.reduce((t,r)=>t+r.minutes,0)/n:null,brier:forecasted.length?forecasted.reduce((t,r)=>t+(r.p-Number(r.success))**2,0)/forecasted.length:null};}
 return groups;
}
const api={compare,evidence};if(typeof module==='object'&&module.exports)module.exports=api;root.PreparationCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
