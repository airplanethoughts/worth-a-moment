/* Explicitly saved, browser-local priorities. Outcome ratings are never stored here. */
(function(){
const dKeys=['money','time','energy','now','later','connection','meaning','security','health','flexibility','other','outcome'];
const iKeys=['income','time','energy','security','flexibility','meaning','connection','health','other','now','later','outcome'];
const decisionIds=[...dKeys.map(k=>'decisionWeight_'+k),...['money','time','energy'].map(k=>'decisionSwing_'+k),'decisionMaxMoney','decisionMaxTime','decisionMaxEffort'];
const incomeIds=[...iKeys.map(k=>'scoreWeight_'+k),...['income','time','energy'].map(k=>'scoreSwing_'+k),'scoreMaxTime','scoreMaxLoad','tradePreference'];
const el=id=>document.getElementById(id);let profiles={};try{const data=JSON.parse(localStorage.getItem('worth-scoring-priorities-v1')||'null');if(data?.version===1&&data.profiles&&typeof data.profiles==='object')profiles=data.profiles}catch{}
let type=el('decisionType').value;const draft={};
function capture(ids){return Object.fromEntries(ids.map(id=>[id,el(id).value]));}
function apply(ids,data){for(const id of ids){const node=el(id),v=data?.[id];if(!node||typeof v!=='string')continue;const n=Number(v);if(v===''||(Number.isFinite(n)&&(!node.hasAttribute('min')||n>=Number(node.min))&&(!node.hasAttribute('max')||n<=Number(node.max))))node.value=v;}}
function status(id,text){el(id).textContent=text;}
function clear(ids){for(const id of ids)el(id).value=id.includes('Weight_')?'0':'';}
function controls(anchor,label,key,ids){const bar=document.createElement('div');bar.className='preference-controls';const save=document.createElement('button');save.type='button';save.className='quiet';save.textContent='Save these priorities';const reset=document.createElement('button');reset.type='button';reset.className='quiet';reset.textContent='Clear these priorities';const msg=document.createElement('p');msg.id=label+'PreferenceStatus';msg.className='helper';msg.setAttribute('role','status');msg.textContent='Save to remember importance, major-change amounts and hard limits on this device. Option ratings stay with the decision.';anchor.querySelector('summary').after(bar);bar.append(save,reset,msg);
save.onclick=()=>{if(ids.some(id=>!el(id).checkValidity())){msg.textContent='Correct the highlighted priority or limit values before saving.';for(const id of ids)if(!el(id).checkValidity()){el(id).reportValidity();break}return;}const selected=key();profiles[selected]=capture(ids);try{localStorage.setItem('worth-scoring-priorities-v1',JSON.stringify({version:1,profiles}));msg.textContent='Priorities saved on this device. Existing reflections keep their original score.';}catch{msg.textContent='Browser storage is unavailable; these priorities apply only to this session.';}};
reset.onclick=()=>{clear(ids);delete profiles[key()];if(label==='decision')delete draft[type];try{localStorage.setItem('worth-scoring-priorities-v1',JSON.stringify({version:1,profiles}));}catch{}msg.textContent='Priorities cleared. Choose what matters before calculating.';if(label==='income')invalidateIncome();refresh();};}
controls(el('decisionScoreSettings'),'decision',()=>type,decisionIds);
const incomeDetails=el('scoreWeight_income').closest('details');controls(incomeDetails,'income',()=>'income',incomeIds);
apply(decisionIds,profiles[type]);apply(incomeIds,profiles.income);
document.addEventListener('wam:preparation-controls-ready',()=>{apply(decisionIds,profiles[type]);apply(incomeIds,profiles.income);});
let timer;function refresh(){clearTimeout(timer);timer=setTimeout(()=>{if(current&&el('form').checkValidity()){
for(const id of ['task','alt','minutes','money','energy','capacity','gain','skip','repeat'])current[id]=el(id).value.trim();
put('doTitle',current.task);put('altTitle',current.alt);put('doGain',current.gain);put('skipText',current.skip);
const frequency=current.repeat==='daily'?7:1;
put('recurrence',current.repeat==='once'?'This is one decision for today. It does not have to become a rule for every day.':`At this pace, that's about ${Number((Number(current.minutes)*frequency/60).toFixed(1))} hours and $${(Number(current.money||0)*frequency).toFixed(2)} each week. Is that a rhythm you want to keep?`);
addPerspective();renderNumbers();el('save').disabled=!current.decisionTradeoff;put('saveMessage','This comparison has unsaved changes. Save a reflection to keep this version.');
}else if(current){delete current.decisionTradeoff;el('save').disabled=true;const result=el('decisionScoreResult');if(result)result.textContent='Update the missing or invalid decision inputs and calculate again.';}},80);}
el('form').addEventListener('input',()=>{if(current)el('save').disabled=true;refresh();});
el('form').addEventListener('change',()=>{if(current)el('save').disabled=true;refresh();});
el('save').addEventListener('click',event=>{if(!current||!el('form').checkValidity()||!current.decisionTradeoff){event.preventDefault();event.stopImmediatePropagation();status('saveMessage','Complete a valid personalized score before saving this comparison.');}},true);
el('decisionType').addEventListener('change',()=>{draft[type]=capture(decisionIds);type=el('decisionType').value;clear(decisionIds);apply(decisionIds,draft[type]||profiles[type]);status('decisionPreferenceStatus','Using priorities for '+el('decisionType').selectedOptions[0].textContent+'. Save to remember changes.');refresh();});
for(const [id,target] of [['example','everyday'],['purchaseExample','purchase'],['relationshipExample','relationship']]){
el(id).addEventListener('click',()=>{draft[type]=capture(decisionIds);},true);
el(id).addEventListener('click',()=>{type=target;const p=draft[type]||profiles[type];if(p&&decisionIds.some(id=>id.startsWith('decisionWeight_')&&Number(p[id])>0)){apply(decisionIds,p);status('decisionPreferenceStatus','Example option data loaded; your existing priorities and limits were preserved.');}else status('decisionPreferenceStatus','Illustrative example priorities loaded. Replace them with your own before deciding.');refresh();});}
el('tradeExample').addEventListener('click',()=>{draft.income=capture(incomeIds);},true);
el('tradeExample').addEventListener('click',()=>{const p=draft.income||profiles.income;if(p&&incomeIds.some(id=>id.startsWith('scoreWeight_')&&Number(p[id])>0)){apply(incomeIds,p);status('incomePreferenceStatus','Example option data loaded; your priorities and limits were preserved.');el('tradeForm').requestSubmit();}else status('incomePreferenceStatus','Illustrative example priorities loaded. Replace them with your own.');});
el('reset').addEventListener('click',()=>{draft[type]=capture(decisionIds);},true);
el('reset').addEventListener('click',()=>{const previous=type;type=el('decisionType').value;apply(decisionIds,type===previous?draft[previous]:draft[type]||profiles[type]);});
// Income edits mark old results stale instead of leaving a recommendation that refers to old inputs.
function invalidateIncome(){document.dispatchEvent(new Event('wam:income-invalidated'));const out=el('tradeResult');if(out.childNodes.length){out.replaceChildren();const p=document.createElement('p');p.textContent='Inputs changed. Calculate again to update your score and verdict.';out.append(p);}}
el('tradeForm').addEventListener('input',invalidateIncome);
el('tradeForm').addEventListener('change',invalidateIncome);
})();
