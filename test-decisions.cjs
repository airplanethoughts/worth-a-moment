const assert=require('node:assert/strict');const {decisionScore}=require('./dist/decision-score.js');
const x={factors:{money:{weight:3,a:100,b:0,swing:100},now:{weight:3,a:8,b:5}},limits:{}};
const r=decisionScore(x);assert.equal(r.score,32.5);assert.equal(r.parts.reduce((s,f)=>s+f.points,50),r.score);assert.ok(r.low<r.score&&r.high>r.score);
assert.equal(decisionScore({...x,declined:true}).boundary,true);assert.match(decisionScore({...x,declined:true}).verdict,/step back/);
assert.deepEqual(decisionScore({...x,limits:{money:50}}).violations,['spending']);
assert.equal(decisionScore({factors:{now:{weight:5,a:8,b:5}}}).score,65);
assert.equal(decisionScore({factors:{now:{weight:5,a:5,b:5}}}).score,50);
assert.throws(()=>decisionScore({factors:{}}));assert.throws(()=>decisionScore({factors:{now:{weight:1,a:NaN,b:3}}}));assert.throws(()=>decisionScore({factors:{time:{weight:2,a:30,b:60,swing:0}}}));
console.log('Decision score checks passed: resource direction, weighted contributions, neutral cases, missing values, boundaries, limits, sensitivity.');
