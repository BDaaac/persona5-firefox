(() => {
  const intro=document.getElementById('dailyIntro');
  const pad=n=>String(n).padStart(2,'0');
  const localKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  let currentKey='';
  const storageKey='phantom-intro-last-date-v1';
  const shortDays=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const skip=document.getElementById('dailySkip');
  const soundRetry=document.getElementById('dailySoundRetry');
  const preview=new URLSearchParams(location.search).get('intro')==='preview';
  let introTimer,closeTimer;
  let soundRun=0,soundtrack;
  function stopSound(){
    soundRun++;
    if(soundtrack){soundtrack.pause();soundtrack.currentTime=0;}
    if(intro.dataset.sound==='playing')intro.dataset.sound='idle';
  }
  function playSound(){
    stopSound();
    soundRetry.hidden=true;
    if(document.hidden)return;
    if(!soundtrack){
      soundtrack=new Audio('./assets/audio/calendar-transition.ogg');
      soundtrack.preload='auto';soundtrack.volume=.75;
      soundtrack.id='dailySoundtrack';soundtrack.hidden=true;
      intro.append(soundtrack);
      soundtrack.addEventListener('ended',()=>{intro.dataset.sound='idle';});
    }
    const run=soundRun,startedAt=performance.now();
    // One short track shares the visual timeline: change at .600s, knife
    // lead-in at 1.760s, its attack at 1.850s. No per-frame audio polling.
    soundtrack.play().then(()=>{
      if(run!==soundRun)return;
      const elapsed=(performance.now()-startedAt)/1000;
      if(intro.hidden||intro.classList.contains('is-leaving')||document.hidden||elapsed>2.95){stopSound();return;}
      // Slow initial loading must not shift the impact behind the animation.
      if(elapsed>.04)soundtrack.currentTime=elapsed;
      intro.dataset.sound='playing';
    }).catch(error=>{
      if(run!==soundRun)return;
      intro.dataset.sound=error.name==='NotAllowedError'?'blocked':'unavailable';
      soundRetry.hidden=error.name!=='NotAllowedError';
    });
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound();});
  const background=[...document.body.children].filter(el=>el!==intro && !['SCRIPT','STYLE'].includes(el.tagName));
  const previousInert=new Map();
  // One shared clock: the day settles at 1400ms, flight starts at 1650ms,
  // contact is at 1850ms. All impact effects use this exact contact time.
  intro.style.setProperty('--shift-at','600ms');
  intro.style.setProperty('--shift-duration','800ms');
  intro.style.setProperty('--flight-at','1650ms');
  intro.style.setProperty('--flight-duration','200ms');
  intro.style.setProperty('--impact-at','1850ms');
  function drawDates(today){
    const yesterday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-1,12);
    const year=document.getElementById('dailyYear');
    year.replaceChildren();
    for(const [date,phase] of [[yesterday,'old'],[today,'new']]){
      const label=document.createElement('span');
      label.className=`daily-period-${phase}`;
      label.textContent=`${date.getFullYear()} / ${date.getMonth()+1}`;
      if(phase==='old')label.setAttribute('aria-hidden','true');
      year.append(label);
    }
    const strip=document.getElementById('dailyDateStrip');
    const dagger=strip.querySelector('.daily-strike') || intro.querySelector('.daily-strike');
    strip.replaceChildren();
    // Each date travels from the next slot into its new position on the city arc.
    // The extra leftmost date exits; exactly five remain after the change.
    const slots=[{x:-16,y:55,tilt:-14,size:.35},{x:10,y:46,tilt:-9,size:.49},{x:28,y:58,tilt:-12,size:.72},{x:50,y:62,tilt:-11,size:1.12},{x:66,y:45,tilt:-10,size:.66},{x:84,y:35,tilt:5,size:.55},{x:112,y:27,tilt:9,size:.4}];
    for(let offset=-3;offset<=2;offset++){
      const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+offset,12);
      const from=slots[offset+4],to=slots[offset+3];
      const e=document.createElement('div');
      e.className='daily-card'+(offset===0?' is-current':'')+(offset===-3?' is-outgoing':'')+(d.getDay()===0?' is-sunday':d.getDay()===6?' is-saturday':'');
      e.dataset.date=localKey(d);
      e.style.cssText=`left:${to.x}%;top:${to.y}%;--from-x:${from.x-to.x}vw;--from-y:${from.y-to.y}vh;--from-tilt:${from.tilt}deg;--tilt:${to.tilt}deg;--from-size:${from.size};--size:${to.size}`;
      if(offset===-3)e.setAttribute('aria-hidden','true');
      const numeral=document.createElement('div');numeral.className='daily-numeral';
      const number=document.createElement('strong');number.className='day-number';number.textContent=d.getDate();
      const weekday=document.createElement('span');weekday.className='day-name';weekday.textContent=shortDays[d.getDay()];
      numeral.append(number);e.append(numeral,weekday);
      if(offset===0 && dagger){
        numeral.append(dagger);
        const puncture=document.createElement('i');puncture.className='daily-puncture';puncture.setAttribute('aria-hidden','true');
        const impact=document.createElement('i');impact.className='daily-impact';impact.setAttribute('aria-hidden','true');
        numeral.append(puncture,impact);
      }
      strip.append(e);
    }
  }
  function closeIntro(){
    clearTimeout(introTimer);
    stopSound();soundRetry.hidden=true;
    if(intro.hidden || intro.classList.contains('is-leaving'))return;
    intro.classList.add('is-leaving');
    try{localStorage.setItem(storageKey,currentKey)}catch{}
    closeTimer=setTimeout(()=>{
      intro.hidden=true;intro.classList.remove('is-leaving','is-running');
      document.documentElement.classList.remove('phantom-intro-open');
      for(const [el,wasInert] of previousInert)el.inert=wasInert;
      previousInert.clear();
      window.PhantomAudio?.setIntroActive(false);
      window.PhantomSelectStart?.();
      document.getElementById('gameSearchInput')?.focus({preventScroll:true});
    },280);
  }
  function showIntro(){
    window.PhantomAudio?.setIntroActive(true);
    clearTimeout(introTimer);clearTimeout(closeTimer);
    const today=new Date();currentKey=localKey(today);
    intro.classList.remove('is-running','is-leaving');
    drawDates(today);intro.hidden=false;document.documentElement.classList.add('phantom-intro-open');
    for(const el of background){if(!previousInert.has(el))previousInert.set(el,el.inert);el.inert=true;}
    void intro.offsetWidth;
    intro.classList.add('is-running');
    playSound();
    skip.focus({preventScroll:true});
    if(!preview)introTimer=setTimeout(closeIntro,3900);
  }
  skip.addEventListener('click',closeIntro);
  soundRetry.addEventListener('click',showIntro);
  intro.addEventListener('keydown',event=>{
    event.stopPropagation();
    if(event.key==='Enter'&&event.target===soundRetry)return;
    if(event.key==='Escape'||event.key==='Enter'){event.preventDefault();closeIntro();}
    if(event.key==='Tab'){
      event.preventDefault();
      (!soundRetry.hidden&&document.activeElement===skip?soundRetry:skip).focus();
    }
  });
  window.PhantomReplayIntro=showIntro;
  let lastShown='';try{lastShown=localStorage.getItem(storageKey)||''}catch{}
  const forced=['1','preview'].includes(new URLSearchParams(location.search).get('intro'));
  if(forced || lastShown!==localKey(new Date()))showIntro();

})();
