/* Shared preference arithmetic. A score is neither a happiness forecast nor a probability. */
(function(root){
function weightedTradeoff(parts){
 if(!Array.isArray(parts)||!parts.length)throw Error('Choose at least one priority above 0.');
 let total=0;
 const normalized=parts.map(f=>{if(!Number.isFinite(f.weight)||f.weight<=0||f.weight>5||!Number.isFinite(f.delta))throw Error('Each selected criterion needs a valid importance and comparison.');total+=f.weight;return {...f,delta:Math.max(-1,Math.min(1,f.delta)),capped:Math.abs(f.delta)>1};});
 normalized.forEach(f=>f.points=50*f.weight*f.delta/total);
 const score=Math.max(0,Math.min(100,50+normalized.reduce((s,f)=>s+f.points,0)));
 const low=Math.max(0,50+normalized.reduce((s,f)=>s+50*f.weight*Math.max(-1,f.delta-.1)/total,0));
 const high=Math.min(100,50+normalized.reduce((s,f)=>s+50*f.weight*Math.min(1,f.delta+.1)/total,0));
 return {score,parts:normalized,low,high,preference:score>55?'preferred':score<45?'alternative':'close'};
}
function constrainedVerdict(result,{preferred=[],alternative=[],boundary=false,preferredName='Main option',alternativeName='Alternative'}={}){
 if(boundary)return 'Respect their answer — step back';
 if(preferred.length&&alternative.length)return 'Both options exceed your hard limits — change the plan';
 if(preferred.length)return preferredName+' exceeds your hard limit';
 if(alternative.length)return alternativeName+' exceeds your hard limit — '+preferredName.toLowerCase()+' fits those limits';
 return result.preference==='preferred'?preferredName+' looks worth it for your priorities':result.preference==='alternative'?alternativeName+' looks better for your priorities':'Close call — neither option clearly wins';
}
const api={weightedTradeoff,constrainedVerdict};if(typeof module==='object'&&module.exports)module.exports=api;root.TradeoffCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
