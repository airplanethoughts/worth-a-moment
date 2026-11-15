/* Progressive disclosure only: original IDs, values and scoring arithmetic stay intact. */
(function(){
const $=id=>document.getElementById(id),form=$('form');if(!form)return;
const settings=$('decisionScoreSettings');
const intro=document.createElement('p');intro.className='helper';intro.textContent='Choose what matters for this decision. Leave anything else out. Only selected benefits need ratings; you can keep the calculation settings as they are.';settings.querySelector('summary').after(intro);
const custom=$('decisionCustomPriorities');if(custom){custom.querySelector('summary').textContent='Choose what matters to you';for(const p of custom.querySelectorAll('p')){if(p.textContent.startsWith('Compare doing this'))p.textContent='Use the choices below to say what matters. Leave out anything you do not want included.';if(p.textContent.startsWith('Connection, meaning'))p.textContent='Rate your selected benefits below. Avoid counting the same benefit several times. These priorities apply to this decision score.';}}
const proxies=[];
const importance=['Leave out','A little','Somewhat','Important','Very important','Top priority'];
for(const input of settings.querySelectorAll('input[id^="decisionWeight_"]')){
 const select=document.createElement('select');for(const a of input.attributes)if(!['type','min','max','step','value'].includes(a.name))select.setAttribute(a.name,a.value);
 importance.forEach((text,i)=>{const option=new Option(text,String(i));select.add(option);});select.id=input.id+'_simple';select.value=input.value;input.hidden=true;input.after(select);proxies.push({input,select});select.addEventListener('input',()=>{input.value=select.value;});select.addEventListener('change',()=>{input.value=select.value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
 const label=form.querySelector('label[for="'+input.id+'"]');if(label){label.htmlFor=select.id;label.textContent=label.textContent.replace(/\s*· importance 0–5/,'');}
}
const advanced=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Advanced: how strongly should savings count?';advanced.append(summary);
const note=document.createElement('p');note.className='helper';note.textContent='These settings tell the model what counts as a big saving. They are adjustable assumptions, not measured energy. Keep the existing settings if you are unsure. Smaller amounts make a saving count more strongly.';advanced.append(note);
for(const [key,title,example] of [
 ['money','A big money saving for me ($)','Example: 50 means saving $50 counts as a big improvement.'],
 ['time','A big time saving for me (minutes)','Example: 60 means saving an hour counts as a big improvement.'],
 ['energy','A big difference in how tiring the options feel','Example: 2 means going from effort 4/5 to 2/5 counts as a big improvement. This does not say how happy dinner makes you.']]){
 const input=$('decisionSwing_'+key);if(!input)continue;const box=input.parentElement;const label=form.querySelector('label[for="'+input.id+'"]');if(label)label.textContent=title;const help=document.createElement('p');help.className='helper';help.textContent=example;box.append(help);advanced.append(box);
}
settings.append(advanced);
const benefits=document.createElement('section');benefits.id='selectedBenefits';const h=document.createElement('h4');h.textContent='Rate only the benefits you chose';const hint=document.createElement('p');hint.className='helper';hint.textContent='Use your own 0–10 scale for both choices. Blank means unknown, not zero. Ratings you leave out do not affect the tradeoff score.';benefits.append(h,hint);
const pairs={now:['scoreDoNow','scoreAltNow'],later:['scoreDoLater','scoreAltLater'],connection:['fitDo_connection','fitAlt_connection'],meaning:['fitDo_meaning','fitAlt_meaning'],security:['fitDo_security','fitAlt_security'],health:['decisionA_health','decisionB_health'],flexibility:['decisionA_flexibility','decisionB_flexibility'],other:['decisionA_other','decisionB_other']};
const groups=[];
for(const [key,ids] of Object.entries(pairs)){
 const row=document.createElement('div');row.className='row';for(const id of ids){const input=$(id);if(!input)continue;const label=form.querySelector('label[for="'+id+'"]');const box=document.createElement('div');if(label)box.append(label);box.append(input);row.append(box);}benefits.append(row);groups.push({key,row});
}
settings.append(benefits);
const oldHappiness=$('scoreHorizon').closest('details');if(oldHappiness){oldHappiness.open=false;oldHappiness.querySelector('summary').textContent='Optional: happiness timing and separate forecast settings';}
const oldFit=$('fitDo_enjoyment')?.closest('details');if(oldFit){oldFit.open=false;oldFit.querySelector('summary').textContent='Optional: separate personal-fit index';}
const status=document.createElement('p');status.className='helper';status.setAttribute('role','status');benefits.append(status);
function refresh(){for(const {input,select} of proxies)select.value=input.value;let count=0;for(const {key,row} of groups){row.hidden=Number($('decisionWeight_'+key).value)<=0;if(!row.hidden)count++;}status.textContent=count?'Only these selected benefits enter your tradeoff score.':'You have selected costs only. This comparison will not count enjoyment, connection or other possible benefits. Add a benefit above for a more complete comparison.';}
form.addEventListener('input',refresh);form.addEventListener('change',refresh);form.addEventListener('reset',()=>setTimeout(refresh,0));for(const id of ['example','purchaseExample','relationshipExample','simpleResourceScore'])$(id)?.addEventListener('click',()=>setTimeout(refresh,0));refresh();
})();
