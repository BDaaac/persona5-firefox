(() => {
  const key='phantom-music-v1';
  const tracks=[
    {id:'phantom',title:'Phantom',note:'PERSONA 5 TITLE SCREEN',file:'title-phantom.ogg',label:'TITLE SCREEN'},
    {id:'beneath',title:'Beneath the Mask',note:'INSTRUMENTAL VERSION',file:'beneath-the-mask.ogg',label:'BENEATH THE MASK'},
    {id:'layer',title:'Layer Cake',note:'PERSONA 5 ORIGINAL SOUNDTRACK',file:'layer-cake.ogg',label:'LAYER CAKE'},
    {id:'tokyo',title:'Tokyo Daylight',note:'PERSONA 5 ORIGINAL SOUNDTRACK',file:'tokyo-daylight.ogg',label:'TOKYO DAYLIGHT'}
  ];
  let trackId='phantom',loadedTrack='';
  let enabled=false,volume=30,music,selection,pending=false,run=0,introActive=false,status='off';
  try{
    const saved=JSON.parse(localStorage.getItem(key));
    enabled=saved?.enabled===true;
    if(tracks.some(track=>track.id===saved?.trackId))trackId=saved.trackId;
    if(Number.isFinite(saved?.volume))volume=Math.max(0,Math.min(100,saved.volume));
  }catch{}
  const wanted=()=>enabled&&!document.hidden&&!introActive;
  const currentTrack=()=>tracks.find(track=>track.id===trackId);
  function save(){try{localStorage.setItem(key,JSON.stringify({enabled,volume,trackId}));}catch{}}
  function paint(){
    const panel=document.querySelector('.calling-sheet:not(.sheet-exit) .sound-settings');
    if(!panel)return;
    const toggle=panel.querySelector('[data-music-toggle]');
    toggle.setAttribute('aria-checked',String(enabled));toggle.textContent=enabled?'ON':'OFF';
    panel.dataset.playing=String(status==='playing');
    panel.querySelector('[data-track-title]').textContent=currentTrack().title;
    panel.querySelector('[data-track-note]').textContent=currentTrack().note;
    panel.querySelectorAll('[data-track]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.track===trackId)));
    panel.querySelector('[data-music-status]').textContent=!enabled?'RECORD SELECTED · SOUND OFF':({playing:'NOW PLAYING · ON REPEAT',loading:'Loading record…',blocked:'Press PLAY to start the music.',error:'Could not load this track. Please try again.',paused:'MUSIC PAUSED'})[status]||'MUSIC PAUSED';
    panel.querySelector('[data-music-retry]').hidden=!enabled||!['blocked','error'].includes(status);
    panel.querySelector('output').textContent=volume+'%';
  }
  function stop(){
    run++;pending=false;music?.pause();
    status=enabled?'paused':'off';paint();
  }
  function resume(){
    if(!wanted()||pending)return;
    if(!music){
      music=new Audio('./assets/audio/'+currentTrack().file);loadedTrack=trackId;
      music.id='phantomMusic';music.hidden=true;music.preload='none';music.loop=true;
      music.volume=volume/100;document.body.append(music);
      music.addEventListener('error',()=>{if(!music.error)return;run++;pending=false;status='error';paint();});
    }
    if(loadedTrack!==trackId){music.src='./assets/audio/'+currentTrack().file;music.currentTime=0;loadedTrack=trackId;}
    if(!music.paused&&status==='playing')return;
    const request=++run;pending=true;status='loading';paint();
    music.play().then(()=>{
      if(request!==run)return;
      pending=false;
      if(!wanted()){stop();return;}
      status='playing';paint();
    }).catch(error=>{
      if(request!==run)return;
      pending=false;status=error.name==='NotAllowedError'?'blocked':'error';paint();
    });
  }
  function navigate(){
    if(document.hidden||introActive)return;
    if(!selection){
      selection=new Audio('./assets/audio/menu-select.mp3');
      selection.id='phantomMenuSound';selection.hidden=true;selection.volume=.5;
      document.body.append(selection);
    }
    selection.pause();selection.currentTime=0;
    selection.play().catch(()=>{});
  }
  function mount(panel){
    panel.innerHTML='<div class="record-caption"><span>PHANTOM RECORDS</span><small>PICK A RECORD</small></div><div class="record-crate" role="group" aria-label="Choose a soundtrack">'+tracks.map((track,index)=>`<button type="button" class="record-choice" data-track="${track.id}" aria-label="${track.title}${track.id==='beneath'?' — instrumental':''}" aria-pressed="false"><span class="record-vinyl" aria-hidden="true"><span class="record-label">P5<b>0${index+1}</b></span></span><span class="record-name">${track.label}</span></button>`).join('')+'</div><div class="sound-track"><div><strong data-track-title></strong><small data-track-note></small></div><button type="button" class="sound-toggle" role="switch" aria-label="Background music" data-music-toggle>OFF</button></div><p class="sound-status" data-music-status role="status"></p><button type="button" class="sound-retry" data-music-retry hidden>PLAY</button><div class="sound-volume"><label for="musicVolume">VOLUME</label><input id="musicVolume" type="range" min="0" max="100" step="5" value="'+volume+'"><output for="musicVolume">'+volume+'%</output></div>';
    panel.querySelectorAll('[data-track]').forEach(button=>button.onclick=()=>{
      if(button.dataset.track===trackId)return;
      stop();trackId=button.dataset.track;save();navigate();if(enabled)resume();paint();
    });
    panel.querySelector('[data-music-toggle]').onclick=()=>{enabled=!enabled;save();if(enabled)resume();else stop();paint();};
    panel.querySelector('[data-music-retry]').onclick=resume;
    panel.querySelector('input').oninput=event=>{volume=Number(event.target.value);if(music)music.volume=volume/100;save();paint();};
    paint();
  }
  window.PhantomAudio={navigate,mount,setIntroActive(active){introActive=active;if(active){selection?.pause();stop();}else resume();}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){selection?.pause();stop();}else resume();});
  // A remembered ON setting may need a real gesture after browser autoplay denial.
  const unlock=event=>{if(event.isTrusted&&enabled&&status==='blocked')resume();};
  document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
  window.addEventListener('pagehide',stop);
  window.addEventListener('pageshow',resume);
  queueMicrotask(resume);
})();
