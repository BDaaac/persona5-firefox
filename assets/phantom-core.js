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
const key='phantom-start-links-v1';let items;try{let stored=JSON.parse(localStorage.getItem(key));items=Array.isArray(stored)?stored:defaults.map(x=>({...x}));}catch{items=defaults.map(x=>({...x}));}
items=items.map(item=>({...item,section:destinationSection(item)}));
function validUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
function save(){localStorage.setItem(key,JSON.stringify(items))}function renderLinks(){const nav=document.querySelector('#links');nav.replaceChildren();items.forEach((item)=>{const a=document.createElement('a');a.className='quick';a.href=item.url;a.rel='noopener noreferrer';const letter=document.createElement('span');letter.className='letter';letter.textContent=(item.name||'?')[0].toUpperCase();const name=document.createElement('span');name.className='name';name.textContent=item.name;a.append(letter,name);nav.append(a)})}
function time(){const now=new Date();document.querySelector('#clock').textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}).format(now);document.querySelector('#date').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(now).toUpperCase()};time();
document.querySelector('#search').addEventListener('submit',e=>{e.preventDefault();let q=document.querySelector('#q').value.trim();if(!q)return;const direct=/^(https?:\/\/)/i.test(q);if(direct&&validUrl(q)){location.href=q}else{location.href='https://www.google.com/search?q='+encodeURIComponent(q)}});
const modal=document.querySelector('#modal');
let editorMode='links';
function edit(mode=editorMode){
  editorMode=Object.hasOwn(destinationSections,mode)?mode:'links';
  const scoped=editorMode!=='links';
  document.querySelector('#modalTitle').textContent=scoped?destinationSections[editorMode].toUpperCase()+' DESTINATIONS':'ALL DESTINATIONS';
  document.querySelector('#editorDescription').textContent=scoped?'Edit sites in '+destinationSections[editorMode]+'. Changes are saved automatically.':'Edit all saved sites and choose their sections. Changes are saved automatically.';
  document.querySelector('#newSection').value=editorMode;
  document.querySelector('#reset').textContent=scoped?'RESET SECTION':'RESET ALL';
  const box=document.querySelector('#settingsList');box.replaceChildren();
  items.forEach((item,i)=>{
    if(scoped&&destinationSection(item)!==editorMode)return;
    const row=document.createElement('div');row.className='settings-row';
    const no=document.createElement('span');no.textContent=String(box.children.length+1).padStart(2,'0');
    const name=document.createElement('input');name.value=item.name;name.maxLength=32;name.setAttribute('aria-label','Name');
    name.addEventListener('change',()=>{item.name=name.value.trim().slice(0,32)||'LINK';name.value=item.name;save();renderLinks();});
    const url=document.createElement('input');url.value=item.url;url.setAttribute('aria-label','URL');
    url.addEventListener('change',()=>{const value=validUrl(url.value.trim());if(value){item.url=value;url.value=value;save();renderLinks();}else{url.value=item.url;alert('Enter an address starting with https:// or http://');}});
    const section=document.createElement('select');section.setAttribute('aria-label','Section');
    for(const [value,label] of Object.entries(destinationSections)){
      const option=document.createElement('option');option.value=value;option.textContent=value==='links'?'Favorites only':label;section.append(option);
    }
    section.value=destinationSection(item);
    section.addEventListener('change',()=>{item.section=section.value;save();renderLinks();edit();});
    const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Delete';del.setAttribute('aria-label','Delete '+item.name);
    del.addEventListener('click',()=>{items.splice(i,1);save();renderLinks();edit();});
    row.append(no,name,url,section,del);box.append(row);
  });
}
window.PhantomEditLinks=(mode='links')=>{edit(mode);modal.hidden=false;};
document.querySelector('#settings').onclick=()=>window.PhantomEditLinks();
document.querySelector('#close').onclick=()=>modal.hidden=true;
modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.hidden=true;});
document.querySelector('#addForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.querySelector('#newName').value.trim(),url=validUrl(document.querySelector('#newUrl').value.trim());
  if(!url){alert('Enter a full URL starting with https://');return;}
  if(items.length>=16){alert('You can save up to 16 destinations.');return;}
  items.push({name:name.slice(0,32)||'LINK',url,section:document.querySelector('#newSection').value});
  save();renderLinks();e.target.reset();edit();
});
document.querySelector('#reset').onclick=()=>{
  const scoped=editorMode!=='links';
  if(!confirm(scoped?'Restore default destinations in '+destinationSections[editorMode]+'?':'Restore all default destinations?'))return;
  const restored=defaults.map(item=>({...item,section:destinationSection(item)}));
  items=scoped?[...items.filter(item=>destinationSection(item)!==editorMode),...restored.filter(item=>item.section===editorMode)]:restored;
  save();renderLinks();edit();
};
renderLinks();
