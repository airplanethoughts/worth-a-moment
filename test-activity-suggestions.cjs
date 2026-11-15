const assert=require('node:assert/strict'),S=require('./dist/activity-suggestions-core.js');const start=Date.parse('2026-11-19T17:00:00Z'),end=start+4*3600000,now=start-3600000;
let r=S.suggest({start,end,now,events:[{busy:true,start,end}],seed:1});assert.equal(r.selected.length,0);
r=S.suggest({start,end,now,events:[{busy:true,start:start+3600000,end:start+7200000}],seed:1,effortLimit:1});assert(r.selected.length);for(const a of r.selected){assert(a.effort<=1);assert(a.money===0);assert(a.end<=start+3000000||a.start>=start+7800000);}
const params={start,end,now,mode:'new',seed:3};assert.deepEqual(S.suggest(params),S.suggest(params));const different=S.suggest({...params,seed:8});assert.notDeepEqual(S.suggest(params).selected.map(a=>a.id),different.selected.map(a=>a.id));
const old={id:'old',task:'Make tea',date:new Date(now-86400000).toISOString(),decisionType:'everyday',outcomeChoice:'do',outcome:'Worth the effort',minutes:'15',energy:'1',money:'0'};
r=S.suggest({start,end,now,records:[old],mode:'balanced'});assert(r.selected.some(a=>a.source==='familiar'));assert(r.selected.some(a=>a.source==='new'));assert.equal(r.weights.weekdayTime,.07);assert.equal(r.weights.month,.03);assert.equal(r.selected.find(a=>a.source==='familiar').pattern,0);assert.equal(r.selected.find(a=>a.source==='familiar').monthPattern,0);
assert.equal(S.suggest({start,end,now,records:[{...old,outcomeChoice:'alt'}],mode:'familiar'}).selected.length,0);
assert.equal(S.suggest({start,end,now,records:[{...old,interest:'declined'}],mode:'familiar'}).selected.length,0);
assert.equal(S.suggest({start,end,now,records:[{...old,money:'20'}],spendLimit:0,mode:'familiar'}).selected.length,0);
assert.equal(S.suggest({start,end,now,records:[{...old,date:new Date(end+1).toISOString()}],mode:'familiar'}).selected.length,0);
assert.equal(S.suggest({start,end,now,records:[{...old,money:undefined}],mode:'familiar'}).selected.length,0);
assert.equal(S.suggest({start,end,now,interests:[],mode:'new'}).selected.length,0);
assert.equal(S.suggest({start,end,now,records:[{...old,calendarSource:{key:'future',start:now+1000,end:now+2000}}],mode:'familiar'}).selected.length,0);
const contextual=S.suggest({start,end,now,events:[{key:'exam',title:'Exam study group',busy:true,start:start+7200000,end:start+10800000}],mode:'balanced'});assert(contextual.selected.some(a=>a.contextTitles.includes('Exam study group')));
assert.throws(()=>S.suggest({start,end:start,now}));
console.log('Activity suggestions passed: conflict/buffer filtering, budget, effort, unknown costs, chosen-only evidence, refusals, future leakage, controllable exploration, reproducible shuffling, and capped routine influence.');
