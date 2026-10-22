(() => {
  const intro=document.getElementById('dailyIntro');
  const pad=n=>String(n).padStart(2,'0');
  const localKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  let currentKey='';
  const storageKey='phantom-intro-last-date-v1';
  const shortDays=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const skip=document.getElementById('dailySkip');
  const preview=new URLSearchParams(location.search).get('intro')==='preview';
  let introTimer,closeTimer;
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
    if(intro.hidden || intro.classList.contains('is-leaving'))return;
    intro.classList.add('is-leaving');
    try{localStorage.setItem(storageKey,currentKey)}catch{}
    closeTimer=setTimeout(()=>{
      intro.hidden=true;intro.classList.remove('is-leaving','is-running');
      document.documentElement.classList.remove('phantom-intro-open');
      for(const [el,wasInert] of previousInert)el.inert=wasInert;
      previousInert.clear();
      window.PhantomSelectHub?.();
      document.getElementById('hubReplay')?.focus({preventScroll:true});
    },280);
  }
  function showIntro(){
    clearTimeout(introTimer);clearTimeout(closeTimer);
    const today=new Date();currentKey=localKey(today);
    intro.classList.remove('is-running','is-leaving');
    drawDates(today);intro.hidden=false;document.documentElement.classList.add('phantom-intro-open');
    for(const el of background){if(!previousInert.has(el))previousInert.set(el,el.inert);el.inert=true;}
    void intro.offsetWidth;
    intro.classList.add('is-running');
    skip.focus({preventScroll:true});
    if(!preview)introTimer=setTimeout(closeIntro,3900);
  }
  skip.addEventListener('click',closeIntro);
  intro.addEventListener('keydown',event=>{
    event.stopPropagation();
    if(event.key==='Escape'||event.key==='Enter'){event.preventDefault();closeIntro();}
    if(event.key==='Tab'){event.preventDefault();skip.focus();}
  });
  window.PhantomReplayIntro=showIntro;
  let lastShown='';try{lastShown=localStorage.getItem(storageKey)||''}catch{}
  const forced=['1','preview'].includes(new URLSearchParams(location.search).get('intro'));
  if(forced || lastShown!==localKey(new Date()))showIntro();

  let weatherCache=null,weatherLoading=false;
  const weatherNames=code=>{
    if(code===0)return 'Clear sky';
    if(code<=3)return 'Partly cloudy';
    if(code<=48)return 'Fog';
    if(code<=67)return 'Rain';
    if(code<=77)return 'Snow';
    if(code<=82)return 'Showers';
    if(code<=86)return 'Snow showers';
    if(code>=95)return 'Thunderstorm';
    return 'Changeable weather';
  };
  function showWeather(){
    const temp=document.getElementById('hubWeather'),desc=document.getElementById('hubWeatherDetails');
    if(!temp)return;
    if(weatherCache?.current){
      temp.textContent=`${Math.round(weatherCache.current.temperature_2m)}°C`;
      desc.textContent=`${weatherNames(weatherCache.current.weather_code)} · feels ${Math.round(weatherCache.current.apparent_temperature)}°`;
    }else desc.textContent='Weather unavailable · check connection';
  }
  async function fetchWeather(){
    if(weatherLoading)return;
    weatherLoading=true;
    try{
      const signal=AbortSignal.timeout(6500);
      const response=await fetch('https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current=temperature_2m,apparent_temperature,weather_code&timezone=Asia%2FAlmaty',{signal});
      if(!response.ok)throw new Error('Weather network response');
      weatherCache=await response.json();
      showWeather();
    }catch{showWeather()}finally{weatherLoading=false;}
  }
  function tickHub(){
    const clock=document.getElementById('hubClock'),date=document.getElementById('hubDate');
    if(!clock)return;
    const now=new Date();
    clock.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Almaty',hour:'2-digit',minute:'2-digit'}).format(now);
    date.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Almaty',weekday:'long',month:'short',day:'numeric'}).format(now).toUpperCase();
  }
  window.PhantomInitHub=()=>{
    tickHub();showWeather();
    const note=document.getElementById('hubNote');
    try{note.value=localStorage.getItem('phantom-hub-note-v1')||''}catch{}
    note.addEventListener('input',()=>{
      const status=document.getElementById('noteStatus');
      try{localStorage.setItem('phantom-hub-note-v1',note.value);if(status)status.textContent='SAVED ✓';}
      catch{if(status)status.textContent='NOT SAVED';}
    });
    document.getElementById('hubReplay').addEventListener('click',showIntro);
    if(!weatherCache)fetchWeather();
  };
  setInterval(tickHub,20000);
})();
