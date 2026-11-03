/* A small progressive form around the existing inputs and calculation engines. */
(function(){
const form=document.getElementById('form');if(!form)return;
const $=id=>document.getElementById(id);
const titles=['Name the choices','Compare your resources','Describe the benefits','Choose priorities & calculate'];
const summaries=['What are you choosing between, and what could each choice change?','Compare time, money, recovery and effort for both options.','Use your own scale. You can leave uncertain benefits unrated and exclude them from the score.','Start with two or three criteria. Only factors with importance above zero count.'];
const old=Array.from(form.children);
const panels=titles.map((title,i)=>{const panel=document.createElement('section');panel.className='guided-panel';panel.dataset.stage=String(i);panel.id='comparisonStage'+i;const h=document.createElement('h3');h.tabIndex=-1;h.textContent=`${i+1}. ${title}`;const p=document.createElement('p');p.className='helper';p.textContent=summaries[i];panel.append(h,p);return panel;});
function stageOf(node){if(node.id==='decisionScoreSettings')return 3;if(node.id==='purchaseFields'||node.id==='relationshipFields')return 0;
const target=node.getAttribute('for')||node.id;
if(['decisionType','task','alt','gain','skip','repeat'].includes(target))return 0;
if(node.classList.contains('chips'))return 0;
if(node.querySelector('#minutes')||node.querySelector('#energy')||node.querySelector('#annualGoal'))return 1;
if(node.querySelector('#scoreDoNow')||node.querySelector('#fitDo_connection')||node.querySelector('#moodDo')||node.querySelector('#smallOption'))return 2;
if(node.tagName==='BUTTON'||node.textContent.includes('You make the call'))return 3;
return 0;}
old.forEach(node=>panels[stageOf(node)].append(node));
form.append(...panels);
// Resource comparisons belong together even though the legacy form placed the alternative in benefit notes.
const alternative=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent='The alternative’s resources';alternative.append(legend);
for(const id of ['altMinutes','altMoney','altRecovery','altEffort']){const field=$(id),label=form.querySelector(`label[for="${id}"]`)||panels[2].querySelector(`label[for="${id}"]`);if(label)alternative.append(label);alternative.append(field);}
panels[1].append(alternative);
const nav=document.createElement('nav');nav.className='guided-nav';nav.setAttribute('aria-label','Comparison steps');const list=document.createElement('ol');nav.append(list);
const navButtons=titles.map((title,i)=>{const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.className='quiet';button.textContent=`${i+1}. ${title}`;button.onclick=()=>show(i,true);li.append(button);list.append(li);return button;});
const controls=document.createElement('div');controls.className='guided-controls';const back=document.createElement('button'),next=document.createElement('button'),progress=document.createElement('p');back.type=next.type='button';back.className='quiet';next.className='primary';back.textContent='Back';next.textContent='Continue';progress.className='helper';progress.setAttribute('aria-live','polite');controls.append(back,progress,next);
form.append(nav,...panels,controls);
let active=0,loadingExample=false;
for(const id of ['example','purchaseExample','relationshipExample'])$(id).addEventListener('click',()=>{loadingExample=true;},true);
function show(i,focus=false){active=Math.max(0,Math.min(3,i));panels.forEach((p,j)=>p.hidden=j!==active);navButtons.forEach((b,j)=>{if(j===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});back.hidden=active===0;next.hidden=active===3;progress.textContent=`Step ${active+1} of 4`;if(focus){panels[active].querySelector('h3').focus();nav.scrollIntoView({behavior:'smooth',block:'start'});}}
function reveal(field){const panel=field.closest('.guided-panel');if(panel)show(Number(panel.dataset.stage),true);for(let p=field.parentElement;p&&p!==form;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;field.focus();}
back.onclick=()=>show(active-1,true);next.onclick=()=>{const invalid=Array.from(panels[active].querySelectorAll('input,select,textarea')).find(n=>n.willValidate&&!n.checkValidity());if(invalid){reveal(invalid);invalid.reportValidity();return;}show(active+1,true);};
const checklist=document.createElement('p');checklist.id='scoreReadiness';checklist.className='helper';checklist.setAttribute('role','status');$('decisionScoreSettings').querySelector('summary').after(checklist);
const factors=['money','time','energy','now','later','connection','meaning','security'];
const pairs={now:['scoreDoNow','scoreAltNow'],later:['scoreDoLater','scoreAltLater'],connection:['fitDo_connection','fitAlt_connection'],meaning:['fitDo_meaning','fitAlt_meaning'],security:['fitDo_security','fitAlt_security']};
function missing(){const chosen=factors.filter(k=>Number($('decisionWeight_'+k).value)>0);if(!chosen.length)return {field:$('decisionWeight_money'),message:'Choose at least one priority above zero.'};for(const key of chosen){const ids=['money','time','energy'].includes(key)?['decisionSwing_'+key]:pairs[key];for(const id of ids){const node=$(id);if(node.value===''||!node.checkValidity()||(['money','time','energy'].includes(key)&&Number(node.value)<=0))return {field:node,message:'Complete '+(form.querySelector(`label[for="${id}"]`)?.textContent||id)+' for the factors you chose.'};}}return null;}
function readiness(){const chosen=factors.filter(k=>Number($('decisionWeight_'+k).value)>0);checklist.textContent=`${chosen.length} ${chosen.length===1?'criterion':'criteria'} selected. `+(missing()?.message||'Ready to calculate your personalized score.');for(const key of ['money','time','energy']){const anchor=$('decisionSwing_'+key);anchor.parentElement.hidden=!chosen.includes(key);}}
form.noValidate=true;form.addEventListener('submit',event=>{if(loadingExample)return;const invalid=Array.from(form.querySelectorAll('input,select,textarea')).find(n=>n.willValidate&&!n.checkValidity());const incomplete=invalid?{field:invalid,message:'Check this input.'}:missing();if(incomplete){event.preventDefault();event.stopImmediatePropagation();checklist.textContent=incomplete.message;reveal(incomplete.field);incomplete.field.reportValidity();return;}show(3);},true);
form.addEventListener('input',readiness);form.addEventListener('change',readiness);
for(const id of ['example','purchaseExample','relationshipExample'])$(id).addEventListener('click',()=>{setTimeout(()=>{loadingExample=false;readiness();show(3);if(current&&form.checkValidity()){addPerspective();renderNumbers();}},0);});
$('reset').addEventListener('click',()=>{readiness();show(0);});
$('personalProfile').open=false;
show(location.hash==='#decisionScoreSettings'?3:0);readiness();
})();
