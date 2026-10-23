const defaults=[{name:'CHATGPT',url:'https://chatgpt.com'},{name:'GITHUB',url:'https://github.com'},{name:'YOUTUBE',url:'https://youtube.com'},{name:'ALMAU',url:'https://almau.edu.kz'},{name:'KAGGLE',url:'https://kaggle.com'},{name:'REDDIT',url:'https://reddit.com'}];
const destinationSections={links:'Favorites',dev:'Develop',study:'Study',media:'Media'};
function destinationSection(item){
  if(Object.hasOwn(destinationSections,item.section))return item.section;
  // Classify legacy links once; later name/address changes keep this assignment.
  const value=item.name+' '+item.url;
  if(/github|kaggle|stackoverflow|leetcode|huggingface|vercel|docker|code|python|react/i.test(value))return 'dev';
  if(/almau|university|academy|notion|drive|calendar|office|figma|linear|jira|teams|coursera|edx/i.test(value))return 'study';
  if(/youtube|youtu\.be|reddit|spotify|twitch|netflix|soundcloud|music|pinterest|kinopoisk/i.test(value))return 'media';
  return 'links';
}
const key='phantom-start-links-v1',destinationLimit=8;
class DestinationError extends Error{}
function normalizeDestinations(list){
  if(!Array.isArray(list)||list.some(item=>!item||typeof item.name!=='string'||typeof item.url!=='string'))throw new DestinationError('Saved sites could not be read. Nothing was overwritten.');
  return list.map((item,index)=>({...item,id:item.id||'legacy:'+JSON.stringify([index,item.name,item.url]),section:destinationSection(item)}));
}
function readDestinations(){
  const stored=localStorage.getItem(key);
  if(stored===null)return normalizeDestinations(defaults);
  let parsed;try{parsed=JSON.parse(stored);}catch{throw new DestinationError('Saved sites could not be read. Nothing was overwritten.');}
  return normalizeDestinations(parsed);
}
let items;try{items=readDestinations();}catch{items=normalizeDestinations(defaults);}
function validUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
function destinationStatus(message,error=false){const status=document.getElementById('destinationStatus');status.textContent=message;status.dataset.error=String(error);}
function storageFailure(error){destinationStatus(error instanceof DestinationError?error.message:'Could not save sites in this browser. Check site storage permissions and try again.',true);}
function persistDestinations(change){
  try{
    // Merge this one edit into the latest saved list, not this tab's old snapshot.
    const latest=readDestinations();change(latest);
    localStorage.setItem(key,JSON.stringify(latest));items=latest;renderLinks();
    destinationStatus('SAVED IN THIS BROWSER');return true;
  }catch(error){storageFailure(error);return false;}
}
function requireDestinationSpace(list,section,exceptId){
  if(list.filter(item=>item.id!==exceptId&&destinationSection(item)===section).length>=destinationLimit)throw new DestinationError(destinationSections[section]+' has 8 sites. Remove or move one before adding another.');
}
function updateDestination(id,patch){return persistDestinations(list=>{
  const item=list.find(item=>item.id===id);
  if(!item)throw new DestinationError('This site was removed in another tab. Close and reopen the editor.');
  if(patch.section&&patch.section!==item.section)requireDestinationSpace(list,patch.section,id);
  Object.assign(item,patch);
});}
function renderLinks(){const nav=document.querySelector('#links');nav.replaceChildren();items.forEach((item)=>{const a=document.createElement('a');a.className='quick';a.href=item.url;a.rel='noopener noreferrer';const letter=document.createElement('span');letter.className='letter';letter.textContent=(item.name||'?')[0].toUpperCase();const name=document.createElement('span');name.className='name';name.textContent=item.name;a.append(letter,name);nav.append(a)})}
function time(){const now=new Date();document.querySelector('#clock').textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}).format(now);document.querySelector('#date').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(now).toUpperCase()};time();
document.querySelector('#search').addEventListener('submit',e=>{e.preventDefault();let q=document.querySelector('#q').value.trim();if(!q)return;const direct=/^(https?:\/\/)/i.test(q);if(direct&&validUrl(q)){location.href=q}else{location.href='https://www.google.com/search?q='+encodeURIComponent(q)}});
const modal=document.querySelector('#modal');
let editorMode='links';
function edit(mode=editorMode){
  editorMode=mode==='all'||Object.hasOwn(destinationSections,mode)?mode:'links';
  const scoped=editorMode!=='all';
  document.querySelector('#modalTitle').textContent=scoped?destinationSections[editorMode].toUpperCase()+' DESTINATIONS':'ALL DESTINATIONS';
  const count=items.filter(item=>destinationSection(item)===editorMode).length;
  document.querySelector('#editorDescription').textContent=scoped?destinationSections[editorMode]+': '+count+' / '+destinationLimit+' sites. Existing edits save automatically.':'Edit all sections here. Each section keeps its own sites, up to 8 each.';
  if(!document.querySelector('#newName').value&&!document.querySelector('#newUrl').value)document.querySelector('#newSection').value=scoped?editorMode:'links';
  document.querySelector('#reset').textContent=scoped?'RESET SECTION':'RESET ALL';
  const box=document.querySelector('#settingsList');box.replaceChildren();
  items.forEach(item=>{
    if(scoped&&destinationSection(item)!==editorMode)return;
    const row=document.createElement('div');row.className='settings-row';
    const no=document.createElement('span');no.textContent=String(box.children.length+1).padStart(2,'0');
    const name=document.createElement('input');name.value=item.name;name.maxLength=32;name.setAttribute('aria-label','Name');
    const saveName=()=>{row.dataset.nameDirty='true';if(updateDestination(item.id,{name:name.value.trim().slice(0,32)||'LINK'}))delete row.dataset.nameDirty;};
    name.addEventListener('input',saveName);name.addEventListener('change',saveName);
    const url=document.createElement('input');url.value=item.url;url.setAttribute('aria-label','URL');
    const saveUrl=()=>{
      row.dataset.urlDirty='true';const value=validUrl(url.value.trim());
      url.setCustomValidity(value?'':'Enter a full address starting with https:// or http://');
      if(value&&updateDestination(item.id,{url:value}))delete row.dataset.urlDirty;
    };
    url.addEventListener('input',saveUrl);url.addEventListener('change',saveUrl);
    const section=document.createElement('select');section.setAttribute('aria-label','Section');
    for(const [value,label] of Object.entries(destinationSections)){
      const option=document.createElement('option');option.value=value;option.textContent=label;section.append(option);
    }
    section.value=destinationSection(item);
    section.addEventListener('change',()=>{
      if(updateDestination(item.id,{section:section.value}))edit();
      else section.value=items.find(saved=>saved.id===item.id)?.section||item.section;
    });
    const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Delete';del.setAttribute('aria-label','Delete '+item.name);
    del.addEventListener('click',()=>{if(persistDestinations(list=>{const index=list.findIndex(saved=>saved.id===item.id);if(index>=0)list.splice(index,1);}))edit();});
    row.append(no,name,url,section,del);box.append(row);
  });
}
window.PhantomEditLinks=(mode='all')=>{
  let error;try{items=readDestinations();}catch(failure){error=failure;}
  edit(mode);modal.hidden=false;destinationStatus('');if(error)storageFailure(error);
};
document.querySelector('#settings').onclick=()=>window.PhantomEditLinks();
function addDestination(){
  const form=document.querySelector('#addForm'),name=document.querySelector('#newName'),url=document.querySelector('#newUrl'),section=document.querySelector('#newSection').value;
  const address=validUrl(url.value.trim());url.setCustomValidity(address?'':'Enter a full address starting with https:// or http://');
  if(!form.reportValidity())return false;
  const added=persistDestinations(list=>{
    requireDestinationSpace(list,section);
    list.push({id:crypto.randomUUID(),name:name.value.trim().slice(0,32)||'LINK',url:address,section});
  });
  if(added){form.reset();url.setCustomValidity('');edit();}return added;
}
function closeEditor(){
  for(const row of document.querySelectorAll('#settingsList .settings-row')){
    if(row.dataset.nameDirty)row.querySelector('input').dispatchEvent(new Event('change'));
    if(row.dataset.urlDirty){const input=row.querySelector('input:nth-of-type(2)');input.dispatchEvent(new Event('change'));if(row.dataset.urlDirty){input.reportValidity();destinationStatus('Check the edited address before saving.',true);return;}}
    if(row.dataset.nameDirty)return;
  }
  if((document.querySelector('#newName').value.trim()||document.querySelector('#newUrl').value.trim())&&!addDestination())return;
  modal.hidden=true;
}
document.querySelector('#close').onclick=closeEditor;
modal.addEventListener('click',e=>{if(e.target===modal)closeEditor();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.hidden=true;});
document.querySelector('#newUrl').addEventListener('input',event=>event.target.setCustomValidity(''));
document.querySelector('#addForm').addEventListener('submit',e=>{
  e.preventDefault();addDestination();
});
document.querySelector('#reset').onclick=()=>{
  const scoped=editorMode!=='all';
  if(!confirm(scoped?'Restore default destinations in '+destinationSections[editorMode]+'?':'Restore all default destinations?'))return;
  const restored=defaults.map(item=>({...item,section:destinationSection(item)}));
  if(persistDestinations(list=>{
    const kept=scoped?list.filter(item=>destinationSection(item)!==editorMode):[];
    list.splice(0,list.length,...normalizeDestinations([...kept,...restored.filter(item=>!scoped||item.section===editorMode)]));
  }))edit();
};
function syncDestinations(){try{items=readDestinations();renderLinks();window.dispatchEvent(new Event('phantom:destinations-changed'));}catch(error){storageFailure(error);}}
window.addEventListener('storage',event=>{if(event.key===key||event.key===null)syncDestinations();});
window.addEventListener('pageshow',event=>{if(event.persisted)syncDestinations();});
renderLinks();
