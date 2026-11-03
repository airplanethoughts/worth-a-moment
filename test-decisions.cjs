const assert=require('node:assert/strict');const {decisionScore}=require('./dist/decision-score.js');
const x={factors:{money:{weight:3,a:100,b:0,swing:100},now:{weight:3,a:8,b:5}},limits:{}};
const r=decisionScore(x);assert.equal(r.score,32.5);assert.equal(r.parts.reduce((s,f)=>s+f.points,50),r.score);assert.ok(r.low<r.score&&r.high>r.score);
assert.equal(decisionScore({...x,declined:true}).boundary,true);assert.match(decisionScore({...x,declined:true}).verdict,/step back/);
assert.deepEqual(decisionScore({...x,limits:{money:50}}).violations,['spending']);
assert.equal(decisionScore({factors:{now:{weight:5,a:8,b:5}}}).score,65);
assert.equal(decisionScore({factors:{now:{weight:5,a:5,b:5}}}).score,50);
assert.throws(()=>decisionScore({factors:{}}));assert.throws(()=>decisionScore({factors:{now:{weight:1,a:NaN,b:3}}}));assert.throws(()=>decisionScore({factors:{time:{weight:2,a:30,b:60,swing:0}}}));
console.log('Decision score checks passed: resource direction, weighted contributions, neutral cases, missing values, boundaries, limits, sensitivity.');

// The same preference arithmetic applies to class/work/rest, purchases and relationships.
for(const scenario of ['class','purchase','relationship','another choice']){
 const result=decisionScore({factors:{money:{weight:2,a:30,b:10,swing:40},time:{weight:3,a:60,b:90,swing:60},energy:{weight:1,a:4,b:2,swing:2},now:{weight:2,a:8,b:6},later:{weight:2,a:9,b:5}}});
 assert.ok(Math.abs(result.score-53.5)<1e-10,scenario);
 assert.ok(Math.abs(result.score-result.parts.reduce((s,f)=>s+f.points,50))<1e-10);
}
for(const key of ['now','later','connection','meaning','security','health','flexibility','other']){
 assert.equal(decisionScore({factors:{[key]:{weight:3,a:8,b:2}}}).score,80,key);
 assert.throws(()=>decisionScore({factors:{[key]:{weight:1,a:11,b:2}}}),/0 to 10/);
 assert.throws(()=>decisionScore({factors:{[key]:{weight:1,a:2,b:-1}}}),/0 to 10/);
}
const limits={factors:{money:{weight:0,a:40,b:70},now:{weight:1,a:2,b:9}},limits:{money:50}};
const feasible=decisionScore(limits);assert.deepEqual(feasible.alternativeViolations,['spending']);assert.match(feasible.verdict,/Alternative exceeds/);assert.equal(feasible.score,15);
const both=decisionScore({...limits,limits:{money:20}});assert.match(both.verdict,/Both options exceed/);
assert.match(decisionScore({...limits,limits:{money:20},declined:true}).verdict,/step back/);
assert.throws(()=>decisionScore({factors:{now:{weight:1,a:8,b:6}},limits:{money:20}}),/Both resource costs/);
assert.throws(()=>decisionScore({factors:{money:{weight:1,a:-1,b:0,swing:20}}}),/cannot be negative/);
assert.throws(()=>decisionScore({factors:{energy:{weight:1,a:6,b:2,swing:2}}}),/1 to 5/);
const all={factors:{money:{weight:2,a:10,b:20,swing:20},health:{weight:4,a:8,b:5},flexibility:{weight:3,a:2,b:7},other:{weight:1,a:7,b:1}}};
const original=decisionScore(all);const reversed=decisionScore({factors:Object.fromEntries(Object.entries(all.factors).map(([k,f])=>[k,{...f,a:f.b,b:f.a}]))});assert.ok(Math.abs(original.score+reversed.score-100)<1e-10);
const {weightedTradeoff}=require('./dist/tradeoff-core.js');
assert.throws(()=>weightedTradeoff([{weight:1,delta:Infinity}]));assert.throws(()=>weightedTradeoff([]));
for(let i=0;i<100;i++){const parts=Array.from({length:4},(_,j)=>({weight:j+1,delta:Math.sin(i+j)*3}));const z=weightedTradeoff(parts);assert.ok(z.score>=0&&z.score<=100);assert.ok(z.low<=z.score+1e-10&&z.high>=z.score-1e-10);assert.ok(Math.abs(weightedTradeoff(parts.map(p=>({...p,delta:-p.delta}))).score+z.score-100)<1e-10);}
console.log('All decision contexts passed: extra criteria, invalid ranges, two-sided hard limits, boundary overrides, reversals and bounded contributions.');
