(() => {
  const shell=document.getElementById('gameShell');
  const detail=document.getElementById('gameDetail');
  const pin=document.createElement('div');
  pin.className='sheet-pin';pin.setAttribute('aria-hidden','true');
  pin.innerHTML='<span class="sheet-puncture"></span><img src="./assets/daily-dagger-ink.png" alt="">';
  const paperTiming={flightAt:340,flight:360,settle:300};
  let paperRequest=0,pinAnimations=[];
  function animatePaper(sheet){
    const request=++paperRequest;
    const impact=paperTiming.flightAt+paperTiming.flight,total=impact+paperTiming.settle;
    // Paper and blade fall vertically; the blade catches the paper at 700ms.
    sheet.animate([
      {opacity:0,transform:'translateY(-260px) rotate(-3deg)',offset:0},
      {opacity:1,transform:'translateY(-240px) rotate(-2.5deg)',offset:.12,easing:'cubic-bezier(.32,0,.67,.3)'},
      {opacity:1,transform:'rotate(-.6deg)',offset:impact/total},
      {transform:'rotate(1.1deg)',offset:(impact+60)/total},
      {transform:'rotate(-.95deg)',offset:(impact+170)/total},
      {opacity:1,transform:'rotate(-.6deg)',offset:1}
    ],{duration:total,easing:'linear'});
    const blade=pin.querySelector('img'),puncture=pin.querySelector('.sheet-puncture');
    pinAnimations.forEach(animation=>animation.cancel());pinAnimations=[];
    pin.classList.remove('is-pinned');
    const flight=blade.animate([
      {opacity:0,transform:'translateY(-340px) rotate(-26deg)'},
      {opacity:1,offset:.12},
      {opacity:1,transform:'rotate(-32deg)'}
    ],{delay:paperTiming.flightAt,duration:paperTiming.flight,easing:'cubic-bezier(.45,0,.8,.5)',fill:'both'});
    const hole=puncture.animate([{opacity:0},{opacity:1}],{delay:impact,duration:1,fill:'forwards'});
    const settle=pin.animate([{rotate:'0deg'},{rotate:'-2deg',offset:.3},{rotate:'.6deg',offset:.65},{rotate:'0deg'}],{delay:impact,duration:paperTiming.settle,easing:'ease-out'});
    pinAnimations=[flight,hole,settle];
    settle.finished.then(()=>{
      if(request!==paperRequest)return;
      pin.classList.add('is-pinned');
      pinAnimations.forEach(animation=>animation.cancel());pinAnimations=[];
    }).catch(()=>{});
  }
  const menu=shell.querySelector('.game-menu');
  const sections=[
    {id:'search',label:'Search',character:'joker',codename:'JOKER',title:'Seek the<br><em>unexpected.</em>',caption:'WEB SEARCH'},
    {id:'links',label:'Favorites',character:'ann',codename:'PANTHER / ANN',title:'Your usual<br><em>suspects.</em>',caption:'SAVED DESTINATIONS'},
    {id:'dev',label:'Develop',character:'futaba',codename:'ORACLE / FUTABA',title:'Build<br><em>something.</em>',caption:'DEVELOPMENT'},
    {id:'study',label:'Study',character:'makoto',codename:'QUEEN / MAKOTO',title:'Stay<br><em>curious.</em>',caption:'WORK & STUDY'},
    {id:'media',label:'Media',character:'ryuji',codename:'SKULL / RYUJI',title:'After<br><em>hours.</em>',caption:'WATCH / LISTEN / READ'},
    {id:'hub',label:'Investigate',character:'akechi',codename:'GORO AKECHI',title:'Follow the<br><em>evidence.</em>',caption:'DETECTIVE DESK'},
    {id:'settings',label:'Config',character:'yusuke',codename:'FOX / YUSUKE',title:'Your place.<br><em>Your rules.</em>',caption:'MAKE IT YOURS'}
  ];
  let selected=0, query='', entranceTimer;
  let caseDraft='',caseSource='github';
  const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function cutLetters(label){
    return [...label].map((letter,i)=>`<span class="news-letter" style="--letter-tilt:${[-5,3,-2,5,0][i%5]}deg;--letter-scale:${[1.06,.88,1,.96][i%4]}em" aria-hidden="true">${safe(letter)}</span>`).join('');
  }
  menu.innerHTML=sections.map((s,i)=>`<button class="game-option" data-scene="${s.id}" style="--order:${i}" aria-label="${s.label}"><b aria-hidden="true">${String(i+1).padStart(2,'0')}</b><span class="news-run">${cutLetters(s.label)}</span></button>`).join('');
  const options=[...menu.querySelectorAll('.game-option')];
  const character=shell.querySelector('.menu-character');
  let activePortrait=character.querySelector('img'),castRequest=0,castAnimation=null;
  // Load on intent, cache each decode, and keep the current portrait until ready.
  const portraits=sections.map(section=>{
    const image=section.character==='joker'?activePortrait:new Image();
    if(image!==activePortrait){
      image.className='cast-portrait';image.alt='';image.hidden=true;
      image.dataset.character=section.character;image.decoding='async';
      character.append(image);
    }
    return {image,ready:null};
  });
  function loadPortrait(index){
    const entry=portraits[index];
    if(!entry.ready){
      if(!entry.image.getAttribute('src'))entry.image.src=`./assets/menu-${sections[index].character}.png`;
      entry.ready=entry.image.decode().then(()=>entry.image).catch(()=>null);
    }
    return entry.ready;
  }
  async function showCharacter(index,animate,direction){
    const request=++castRequest;
    const next=await loadPortrait(index);
    if(!next||request!==castRequest)return;
    const old=activePortrait,visible=getComputedStyle(old);
    const from={opacity:visible.opacity,transform:visible.transform};
    castAnimation?.cancel();castAnimation=null;
    if(animate&&next!==old){
      const exit=old.animate([from,{opacity:0,transform:`translateX(${-direction*18}px)`}],{duration:160,easing:'ease-in',fill:'forwards'});
      castAnimation=exit;
      try{await exit.finished;}catch{return;}
      if(request!==castRequest){exit.cancel();if(castAnimation===exit)castAnimation=null;return;}
      old.hidden=true;exit.cancel();
    }
    portraits.forEach(({image})=>{image.hidden=image!==next;});
    next.hidden=false;activePortrait=next;shell.dataset.character=sections[index].character;
    if(!animate)return;
    const entrance=next.animate([next===old?from:{opacity:0,transform:`translateX(${direction*18}px)`},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'});
    castAnimation=entrance;
    entrance.finished.then(()=>{if(castAnimation===entrance){entrance.cancel();castAnimation=null;}}).catch(()=>{});
  }
  shell.dataset.character='joker';
  const commandGroup=shell.querySelector('.game-left');
  // Each command has a distinct framing. Only transforms move; the hit areas and
  // text stay real DOM. Rapid selections retarget from the currently visible frame.
  const poses=[
    {x:0,mx:0,my:0},{x:-8,mx:8,my:-3},{x:4,mx:4,my:3},
    {x:-4,mx:10,my:0},{x:-6,mx:6,my:4},{x:4,mx:8,my:-2},{x:-8,mx:4,my:2}
  ];
  let sceneReady=false,sceneAnimations=[];
  function frameScene(index,animate,direction=1){
    const pose=poses[index],factor=window.matchMedia('(max-width:980px)').matches ? .45 : 1;
    const targets=[
      [character,`translateX(${pose.x*factor}px)`,440],
      [commandGroup,`translate(${pose.mx*factor}px,${pose.my*factor}px)`,440]
    ];
    const visible=targets.map(([element])=>getComputedStyle(element).transform);
    sceneAnimations.forEach(animation=>animation.cancel());sceneAnimations=[];
    clearTimeout(entranceTimer);shell.classList.remove('is-entering');
    targets.forEach(([element,target,duration],i)=>{
      element.style.transform=target;
      if(animate)sceneAnimations.push(element.animate([{transform:visible[i]},{transform:target}],{duration,easing:'cubic-bezier(.22,1,.36,1)'}));
    });
    if(!animate)return;
    sceneAnimations.push(options[index].animate([{translate:`${-direction*8}px 0px`},{translate:'0px 0px'}],{duration:300,easing:'ease-out'}));
    const batch=sceneAnimations;
    Promise.allSettled(batch.map(animation=>animation.finished)).then(()=>{if(sceneAnimations===batch)sceneAnimations=[];});
  }
  const clockFormat=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
  const dateFormat=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'});
  const weekdayFormat=new Intl.DateTimeFormat('en-US',{weekday:'long'});
  let clockTimer,lastClock='',lastDay='';
  const digitSegments=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
  const segmentShapes={a:'7,2 27,2 31,6 27,10 7,10 3,6',b:'28,11 32,7 36,11 36,29 32,33 28,29',c:'28,39 32,35 36,39 36,57 32,61 28,57',d:'7,58 27,58 31,62 27,66 7,66 3,62',e:'0,39 4,35 8,39 8,57 4,61 0,57',f:'0,11 4,7 8,11 8,29 4,33 0,29',g:'7,30 27,30 31,34 27,38 7,38 3,34'};
  function renderClockDigits(id,value){
    document.getElementById(id).innerHTML=[...value].map(digit=>'<svg viewBox="-2 0 40 68" aria-hidden="true" focusable="false">'+Object.entries(segmentShapes).map(([segment,points])=>`<polygon class="${digitSegments[Number(digit)].includes(segment)?'segment-on':'segment-off'}" points="${points}"/>`).join('')+'</svg>').join('');
  }
  function tick(){
    const now=new Date();
    const time=clockFormat.format(now),day=now.toDateString();
    if(time!==lastClock){
      const [hours,minutes]=time.split(':');
      renderClockDigits('clockHours',hours);renderClockDigits('clockMinutes',minutes);
      const clock=document.getElementById('gameClock');clock.dateTime=time;clock.setAttribute('aria-label',time);lastClock=time;
    }
    if(day!==lastDay){document.getElementById('gameDate').textContent=dateFormat.format(now).toUpperCase();document.getElementById('gameDay').textContent=weekdayFormat.format(now).toUpperCase();lastDay=day;}
    clearTimeout(clockTimer);
    if(!document.hidden)clockTimer=setTimeout(tick,60000-now.getSeconds()*1000-now.getMilliseconds()+20);
  }
  document.addEventListener('visibilitychange',()=>{shell.classList.toggle('is-page-hidden',document.hidden);clearTimeout(clockTimer);if(!document.hidden)tick();});
  tick();
  function linkList(mode){
    const visible=items.filter(item=>validUrl(item.url)&&(mode==='links'||destinationSection(item)===mode));
    if(!visible.length)return '<p class="game-empty">No destinations yet. Add your first site to this section.</p><button class="game-cta" data-edit>ADD A DESTINATION</button>';
    return '<nav class="game-links'+(visible.length>6?' is-dense':'')+'" aria-label="Saved destinations">'+visible.map((item,i)=>{
      const href=validUrl(item.url),host=new URL(href).hostname.replace(/^www\./,'');
      return `<a class="game-link" href="${safe(href)}" rel="noopener noreferrer" title="${safe(item.name)} — ${safe(host)}"><b aria-hidden="true">${String(i+1).padStart(2,'0')}</b><span class="link-name">${safe(item.name)}</span><small class="link-host">${safe(host)}</small></a>`;
    }).join('')+'</nav>';
  }
  function directAddress(value){
    const explicit=/^https?:\/\//i.test(value);
    const domain=/^(?:localhost(?::\d+)?|(?:[a-z\d-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#][^\s]*)?$/i.test(value);
    return (explicit||domain)?validUrl(explicit?value:'https://'+value):null;
  }
  const searchForm=()=>`<div class="search-ticket"><div class="ticket-top"><span>PHANTOM SEARCH SERVICE</span><span aria-hidden="true">★</span></div><label for="gameSearchInput">WHAT ARE WE LOOKING FOR?</label><form id="gameSearchForm" class="game-search" role="search"><input id="gameSearchInput" aria-label="Search the web" autocomplete="off" placeholder="A thought, a question, or a URL…" value="${safe(query)}"><button type="submit" aria-label="Search"><small>LET’S</small>GO</button></form><div class="ticket-bottom"><span id="searchDestination">SEARCH GOOGLE</span></div></div><div class="search-seal" aria-hidden="true">THE WORLD<br>IS ONE QUERY AWAY.</div>`;
  function hub(){return `<div class="investigation">
    <div class="evidence-tools">
      <a class="evidence-tool" href="https://lens.google.com/" target="_blank" rel="noopener noreferrer"><span class="evidence-number">01 / VISUAL SEARCH</span><strong>GOOGLE LENS</strong><span>Find the source. Identify the image.</span><small>UPLOAD A PHOTO IN LENS</small></a>
      <a class="evidence-tool evidence-ai" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer"><span class="evidence-number">02 / AI ANALYSIS</span><strong>CHATGPT</strong><span>Explain a screenshot, code, or error.</span><small>ATTACH YOUR EVIDENCE IN CHATGPT</small></a>
    </div>
    <form class="case-form" id="caseForm" role="search" aria-label="Investigate a technical error">
      <label for="caseQuery">03 / TRACE AN ERROR</label>
      <textarea id="caseQuery" rows="2" maxlength="1000" required spellcheck="false" placeholder="Paste an error or exception…">${safe(caseDraft)}</textarea>
      <div class="case-actions"><label class="case-source-label" for="caseSource">SEARCH IN<select id="caseSource" name="source"><option value="github"${caseSource==='github'?' selected':''}>GitHub issues</option><option value="stackoverflow"${caseSource==='stackoverflow'?' selected':''}>Stack Overflow</option><option value="web"${caseSource==='web'?' selected':''}>Web</option></select></label><button class="game-cta" type="submit">FIND LEADS</button></div>
    </form>
  </div>`;}
  function initInvestigation(){
    const form=document.getElementById('caseForm'),input=document.getElementById('caseQuery'),source=document.getElementById('caseSource');
    input.addEventListener('input',()=>{caseDraft=input.value;input.setCustomValidity('');});
    source.addEventListener('change',()=>{caseSource=source.value;});
    form.addEventListener('submit',event=>{
      event.preventDefault();const value=input.value.trim();
      if(!value){input.setCustomValidity('Enter an error message to investigate.');input.reportValidity();return;}
      const destination=source.value==='github'
        ?'https://github.com/search?type=issues&q='+encodeURIComponent(value)
        :'https://www.google.com/search?q='+encodeURIComponent((source.value==='stackoverflow'?'site:stackoverflow.com ':'')+value);
      location.href=destination;
    });
  }
  function select(index,{focusMenu=false,motion=true}={}){
    const previous=selected;
    const oldSheet=detail.querySelector('.calling-sheet:not(.sheet-exit)');
    const currentInput=document.getElementById('gameSearchInput');
    if(currentInput)query=currentInput.value;
    selected=(index+sections.length)%sections.length;
    const section=sections[selected];
    shell.dataset.scene=section.id;
    options.forEach((button,i)=>{button.classList.toggle('active',i===selected);if(i===selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    detail.dataset.mode=section.id;
    let content=`<div class="game-detail-top"><span>${String(selected+1).padStart(2,'0')} / ${section.label.toUpperCase()}</span><span>${section.codename}</span></div><h2 id="detailTitle">${section.title}</h2>`;
    if(section.id==='settings'){
      content+='<section class="sound-settings" aria-label="Music"></section><div class="settings-links"><span>YOUR SITES</span><button class="game-cta" data-edit>EDIT DESTINATIONS</button></div><button class="intro-replay" type="button" data-replay>REPLAY DATE INTRO</button>';
    }else if(section.id==='search')content+=searchForm();
    else if(section.id==='hub')content+=hub();
    else content+=`<div class="detail-caption"><span>${section.caption}</span><button type="button" data-edit aria-label="Edit destinations">EDIT LINKS</button></div>${linkList(section.id)}`;
    const direction=selected>=previous?1:-1;
    const departing=oldSheet&&sceneReady&&motion&&selected!==previous?oldSheet.cloneNode(true):null;
    const departingFrame=departing?{transform:getComputedStyle(oldSheet).transform,opacity:getComputedStyle(oldSheet).opacity}:null;
    detail.innerHTML=`<div class="calling-sheet">${content}</div>`;
    detail.append(pin);
    const sheet=detail.querySelector('.calling-sheet');
    sheet.style.setProperty('--sheet-direction',direction);
    if(departing){
      departing.classList.add('sheet-exit');departing.inert=true;departing.setAttribute('aria-hidden','true');
      departing.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));
      detail.append(departing);
      const exit=departing.animate([departingFrame,{transform:'translateY(180px) rotate(4deg)',opacity:0}],{duration:280,easing:'cubic-bezier(.4,0,1,1)'});
      exit.finished.then(()=>departing.remove()).catch(()=>departing.remove());
    }
    animatePaper(sheet);
    detail.style.setProperty('--panel-shift',`${direction*55}px`);
    detail.style.setProperty('--panel-angle',`${direction*3}deg`);
    frameScene(selected,sceneReady&&motion&&selected!==previous,direction);
    showCharacter(selected,sceneReady&&motion&&selected!==previous,direction);
    if(sceneReady&&motion&&selected!==previous)window.PhantomAudio?.navigate();
    sceneReady=true;
    if(section.id==='settings')window.PhantomAudio?.mount(sheet.querySelector('.sound-settings'));
    detail.querySelector('[data-replay]')?.addEventListener('click',()=>window.PhantomReplayIntro?.());
    detail.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',openEditor));
    const form=document.getElementById('gameSearchForm');
    if(form){
      const input=document.getElementById('gameSearchInput');
      const updateDestination=()=>document.getElementById('searchDestination').textContent=directAddress(input.value.trim())?'OPEN WEBSITE':'SEARCH GOOGLE';
      input.addEventListener('input',updateDestination);updateDestination();
      form.addEventListener('submit',event=>{
      event.preventDefault();const value=document.getElementById('gameSearchInput').value.trim();if(!value)return;
      const destination=directAddress(value);
      location.href=destination||'https://www.google.com/search?q='+encodeURIComponent(value);
      });
    }
    if(section.id==='hub')initInvestigation();
    if(focusMenu)options[selected].focus({preventScroll:true});
  }
  function enter(){clearTimeout(entranceTimer);shell.classList.remove('is-entering');void shell.offsetWidth;shell.classList.add('is-entering');entranceTimer=setTimeout(()=>shell.classList.remove('is-entering'),800);}
  window.PhantomSelectStart=()=>{select(0,{motion:false});enter();};
  options.forEach((button,i)=>{
    button.addEventListener('click',()=>select(i));
    button.addEventListener('pointerenter',()=>loadPortrait(i),{once:true});
    button.addEventListener('focus',()=>loadPortrait(i),{once:true});
  });
  function focusSearch(){if(sections[selected].id!=='search')select(0);document.getElementById('gameSearchInput')?.focus();}
  let editorReturn=null;
  function openEditor(){
    editorReturn=document.activeElement;window.PhantomEditLinks(sections[selected].id);shell.inert=true;
    document.querySelector('#settingsList input')?.focus();
    if(!document.querySelector('#settingsList input'))document.getElementById('newName').focus();
  }
  function restoreEditor(){shell.inert=false;select(selected);const button=detail.querySelector('[data-edit]');(button||options[selected]).focus({preventScroll:true});editorReturn=null;}
  document.getElementById('close').addEventListener('click',()=>{if(document.getElementById('modal').hidden)restoreEditor();});
  document.getElementById('modal').addEventListener('click',event=>{if(event.target.id==='modal'&&event.currentTarget.hidden)restoreEditor();});
  window.addEventListener('phantom:destinations-changed',()=>{
    if(editorReturn||!document.getElementById('modal').hidden||!['links','dev','study','media'].includes(sections[selected].id))return;
    const href=document.activeElement.closest?.('.game-link')?.getAttribute('href');
    select(selected,{motion:false});
    if(href)[...detail.querySelectorAll('.game-link')].find(link=>link.getAttribute('href')===href)?.focus({preventScroll:true});
  });
  document.addEventListener('keydown',event=>{
    if(editorReturn){
      if(event.key==='Escape'){event.preventDefault();restoreEditor();return;}
      if(event.key==='Tab'){
        const controls=[...document.querySelectorAll('#modal button,#modal input,#modal select')].filter(el=>!el.disabled);
        if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1).focus();}
        else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0].focus();}
      }
      return;
    }
    if(shell.inert||!document.getElementById('modal').hidden)return;
    const active=document.activeElement,typing=/INPUT|TEXTAREA|SELECT/.test(active?.tagName||'')||active?.isContentEditable;
    if(typing){if(event.key==='Escape'){event.preventDefault();options[selected].focus({preventScroll:true});}return;}
    if(event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key==='/'){event.preventDefault();focusSearch();return;}
    if(event.key==='Escape'){event.preventDefault();select(0,{focusMenu:true});return;}
    if(menu.contains(active)||active===document.body){
      if(event.key==='ArrowDown'){event.preventDefault();select(selected+1,{focusMenu:true});}
      else if(event.key==='ArrowUp'){event.preventDefault();select(selected-1,{focusMenu:true});}
      else if(event.key==='Enter'){event.preventDefault();if(sections[selected].id==='settings')detail.querySelector('[data-track][aria-pressed=true]')?.focus();else if(sections[selected].id==='search')focusSearch();else if(sections[selected].id==='hub')document.getElementById('caseQuery')?.focus();else (detail.querySelector('.game-link')||detail.querySelector('[data-edit]'))?.focus();}
    }
  });
  select(0);enter();
})();
