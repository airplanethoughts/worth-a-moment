const assert=require('node:assert/strict');const M=require('./dist/momentary-model.js');
assert.deepEqual(M.step([2,4,6],{kind:'certain',reward:3,expected:9},.5),[4,2,3]);
assert.deepEqual(M.step([2,4,6],{kind:'uncertain',reward:3,expected:5},.5),[1,7,1]);
assert.equal(M.train([]).ready,false);assert.equal(M.train(M.demo().slice(0,23)).ready,false);
const events=M.demo(),model=M.train(events);assert.equal(model.ready,true);assert.ok(model.mae<model.baselineMae);assert.equal(model.trainN+model.testN,48);
const altered=events.map((e,i)=>i>=model.trainN?{...e,happiness:10-e.happiness}:e);assert.equal(M.train(altered).gamma,model.gamma,'held-out outcomes must not choose gamma');
const constant=events.map(e=>({...e,happiness:5}));assert.equal(M.train(constant).ready,false,'constant baseline must not appear beaten');
assert.equal(M.predict({ready:false},{kind:'certain',reward:4}),null);assert.ok(M.predict(model,{kind:'uncertain',expected:5,reward:5}).value<=10);
assert.equal(M.valid({kind:'uncertain',expected:NaN,reward:3,happiness:4}),false);console.log('Model checks passed: reward coding, decay, cold start, chronological holdout, baseline gating, and prediction bounds.');
