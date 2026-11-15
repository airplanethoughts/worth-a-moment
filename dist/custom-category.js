/* A user category labels an everyday decision without changing its score model. */
(function(){
const type=document.getElementById('decisionType');if(!type)return;
const option=new Option('Other / my own category','everyday');option.dataset.customCategory='true';type.add(option);
const box=document.createElement('div');box.hidden=true;
const label=document.createElement('label');label.htmlFor='customCategory';label.textContent='What would you call this category?';
const input=document.createElement('input');input.id='customCategory';input.maxLength=80;input.placeholder='For example: hobbies, travel, or family';
const hint=document.createElement('p');hint.className='helper';hint.textContent='This label is saved with your decision. It uses the same general tradeoff calculation.';
box.append(label,input,hint);type.after(box);
function custom(){return type.selectedOptions[0]?.dataset.customCategory==='true';}
function refresh(){box.hidden=!custom();input.required=custom();input.disabled=!custom();}
type.addEventListener('change',refresh);document.getElementById('form').addEventListener('reset',()=>setTimeout(refresh,0));
for(const id of ['example','purchaseExample','relationshipExample'])document.getElementById(id)?.addEventListener('click',()=>setTimeout(refresh,0));
function captureCategory(){if(!current)return;if(custom())current.customCategory=input.value.trim();else delete current.customCategory;}
document.getElementById('form').addEventListener('submit',captureCategory);
document.getElementById('save').addEventListener('click',captureCategory,true);
const oldRender=render;render=function(){oldRender();const rows=document.querySelectorAll('#entries .entry');saved.slice().reverse().forEach((item,i)=>{if(typeof item.customCategory!=='string'||!item.customCategory.trim())return;const p=document.createElement('small');p.textContent='Category: '+item.customCategory;rows[i]?.querySelector('.body')?.append(p);});};
refresh();render();
})();
