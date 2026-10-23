const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/phantom-audio.js','utf8');
const tick=()=>new Promise(r=>setImmediate(r));
function setup(saved){
 const listeners={},audios=[],memory=new Map(saved?[['phantom-music-v1',JSON.stringify(saved)]]:[]);
 const controls=new Map();for(const key of ['[data-music-toggle]','[data-music-status]','[data-music-retry]','[data-track-title]','[data-track-note]','output','input'])controls.set(key,{setAttribute(k,v){this[k]=v;}});
 const records=['phantom','beneath','layer','tokyo'].map(id=>({dataset:{track:id},setAttribute(k,v){this[k]=v;}}));
 const panel={dataset:{},querySelector:k=>controls.get(k),querySelectorAll:()=>records};
 const document={hidden:false,body:{append(){}},querySelector:()=>panel,addEventListener:(k,f)=>listeners[k]=f};
 let mode='ok',waiting=[];
 function Audio(src){this.src=src;this.paused=true;this.currentTime=0;this.plays=0;this.addEventListener=()=>{};this.pause=()=>this.paused=true;this.play=()=>{this.plays++;this.paused=false;if(mode==='blocked')return Promise.reject({name:'NotAllowedError'});if(mode==='pending'&&!this.src.endsWith('menu-select.mp3'))return new Promise((resolve,reject)=>waiting.push({resolve,reject}));return Promise.resolve();};audios.push(this);}
 const window={addEventListener:(k,f)=>listeners[k]=f};
 vm.runInNewContext(source,{window,document,Audio,localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},queueMicrotask});
 window.PhantomAudio.mount(panel);
 return {records,api:window.PhantomAudio,document,audios,controls,listeners,memory,waiting,mode:v=>mode=v,panel};
}
(async()=>{
 let checks=0;function check(test,label){assert.ok(test,label);console.log('PASS '+label);checks++;}
 const t=setup();await tick();check(t.audios.length===0,'Off loads no audio');
 t.api.navigate();t.api.navigate();check(t.audios.length===1&&t.audios[0].plays===2,'Rapid navigation reuses one effect');
 t.api.setIntroActive(true);t.api.navigate();check(t.audios[0].paused&&t.audios[0].plays===2,'Intro suppresses navigation');t.api.setIntroActive(false);
 const toggle=t.controls.get('[data-music-toggle]');toggle.onclick();await tick();const music=t.audios[1];check(!music.paused&&music.loop&&music.volume===.3,'Toggle plays looping music at 30%');
 t.api.setIntroActive(true);check(music.paused,'Intro pauses music');t.api.setIntroActive(false);await tick();check(!music.paused,'Intro completion resumes music');
 t.document.hidden=true;t.listeners.visibilitychange();check(music.paused,'Hidden tab pauses');t.document.hidden=false;t.listeners.visibilitychange();await tick();check(!music.paused,'Visible tab resumes');
 t.controls.get('input').oninput({target:{value:'55'}});check(music.volume===.55&&JSON.parse(t.memory.get('phantom-music-v1')).volume===55,'Volume applied and persisted');
 toggle.onclick();check(music.paused&&!JSON.parse(t.memory.get('phantom-music-v1')).enabled,'Off stops and persists');
 t.mode('pending');toggle.onclick();toggle.onclick();t.waiting.shift().resolve();await tick();check(music.paused&&t.panel.dataset.playing==='false','Late play resolution cannot revive OFF');
 t.mode('blocked');toggle.onclick();await tick();check(!t.controls.get('[data-music-retry]').hidden,'Autoplay denial exposes PLAY');
 t.mode('ok');t.controls.get('[data-music-retry]').onclick();await tick();check(!music.paused&&t.controls.get('[data-music-retry]').hidden,'PLAY recovers from denial');
 const restored=setup({enabled:true,volume:55});await tick();check(restored.audios[0].volume===.55&&!restored.audios[0].paused,'Saved ON and volume restored');
  const plays=music.plays;t.records[1].onclick();await tick();
 check(t.audios.length===2&&music.src.endsWith('beneath-the-mask.ogg')&&music.plays===plays+1,'Changing records replaces the source on one player');
 const replayCount=music.plays;t.records[1].onclick();check(music.plays===replayCount,'Choosing current record does not restart it');
 toggle.onclick();const stoppedPlays=music.plays;t.records[2].onclick();await tick();
 check(music.paused&&music.plays===stoppedPlays&&JSON.parse(t.memory.get('phantom-music-v1')).trackId==='layer','Choosing while OFF persists without starting or downloading');
 toggle.onclick();await tick();check(music.src.endsWith('layer-cake.ogg')&&!music.paused,'ON loads the record chosen while OFF');
 t.mode('pending');t.records[3].onclick();const oldPlay=t.waiting.shift();t.records[0].onclick();const newPlay=t.waiting.shift();oldPlay.reject({name:'NotAllowedError'});newPlay.resolve();await tick();
 check(t.panel.dataset.playing==='true'&&music.src.endsWith('title-phantom.ogg'),'Rapid record changes ignore stale rejection');
 const recordRestore=setup({enabled:true,volume:40,trackId:'tokyo'});await tick();
 check(recordRestore.audios[0].src.endsWith('tokyo-daylight.ogg'),'Selected record survives reload');
 const invalid=setup({enabled:true,trackId:'https://invalid.test/audio'});await tick();check(invalid.audios[0].src.endsWith('title-phantom.ogg'),'Invalid saved record falls back to Phantom');
 console.log(checks+' checks passed');
})();
