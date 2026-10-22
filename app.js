'use strict';
const $ = s => document.querySelector(s);

/* ───────── data ───────── */
const KEY = 'phantom-start-links-v1';
const SOUND_KEY = 'phantom-start-sound';
const MAX_LINKS = 16;
const defaults = [
  { name: 'CHATGPT', url: 'https://chatgpt.com' },
  { name: 'GITHUB',  url: 'https://github.com' },
  { name: 'YOUTUBE', url: 'https://youtube.com' },
  { name: 'ALMAU',   url: 'https://almau.edu.kz' },
  { name: 'KAGGLE',  url: 'https://kaggle.com' },
  { name: 'REDDIT',  url: 'https://reddit.com' },
];
const BANGS = {
  g:   ['GOOGLE',  'https://www.google.com/search?q='],
  gh:  ['GITHUB',  'https://github.com/search?q='],
  yt:  ['YOUTUBE', 'https://www.youtube.com/results?search_query='],
  so:  ['STACKOVERFLOW', 'https://stackoverflow.com/search?q='],
  mdn: ['MDN',     'https://developer.mozilla.org/search?q='],
  k:   ['KAGGLE',  'https://www.kaggle.com/search?q='],
  py:  ['PYTHON DOCS', 'https://docs.python.org/3/search.html?q='],
  npm: ['NPM',     'https://www.npmjs.com/search?q='],
};

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

function validUrl(value) {
  try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}
const clone = list => list.map(x => ({ ...x }));
function load() {
  try {
    const raw = JSON.parse(store.get(KEY));
    if (Array.isArray(raw)) {
      const ok = raw
        .filter(x => x && typeof x.name === 'string' && validUrl(x.url))
        .slice(0, MAX_LINKS)
        .map(x => ({ name: x.name.slice(0, 32), url: validUrl(x.url) }));
      if (ok.length || raw.length === 0) return ok;
    }
  } catch { /* fallthrough */ }
  return clone(defaults);
}
let items = load();
const save = () => store.set(KEY, JSON.stringify(items));
const host = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

/* ───────── sound (WebAudio, по умолчанию выключен) ───────── */
let soundOn = store.get(SOUND_KEY) === '1';
let actx;
function blip(freq = 720, dur = 0.05, type = 'square', vol = 0.04) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch { /* no audio */ }
}
function renderSound() { $('#snd').textContent = soundOn ? 'ON' : 'OFF'; }

/* ───────── clock ───────── */
function tick() {
  const n = new Date();
  const p = v => String(v).padStart(2, '0');
  $('#clock').firstChild.nodeValue = p(n.getHours());
  $('#clock').querySelector('.colon').nextSibling.nodeValue = p(n.getMinutes());
  $('#sec').textContent = p(n.getSeconds());
  $('#date').textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .format(n).toUpperCase();
}
tick(); setInterval(tick, 1000);

/* ───────── menu ───────── */
const menu = $('#menu');
let sel = 0;

// у каждого пункта своя «рваность»: наклон, поворот, сдвиг, размер (циклично)
const JAG = [
  { sk: -14, rot: -2,   ox: 0,  sc: 1 },
  { sk: -10, rot: 1.5,  ox: 30, sc: .94 },
  { sk: -16, rot: -1,   ox: -6, sc: 1.05 },
  { sk: -12, rot: 2,    ox: 44, sc: .92 },
  { sk: -15, rot: -1.5, ox: 12, sc: 1 },
  { sk: -9,  rot: 1,    ox: 54, sc: .96 },
];

function renderMenu() {
  menu.replaceChildren();
  menu.style.setProperty('--n', Math.max(items.length, 1));

  if (!items.length) {
    const e = document.createElement('div');
    e.className = 'empty';
    e.textContent = 'Пусто. Нажми «,» и добавь первую ссылку.';
    menu.append(e);
    $('#dt').textContent = '—'; $('#du').textContent = '';
    return;
  }
  if (sel >= items.length) sel = items.length - 1;

  items.forEach((it, i) => {
    const j = JAG[i % JAG.length];
    const a = document.createElement('a');
    a.className = 'it';
    a.href = it.url;
    a.rel = 'noopener noreferrer';
    a.setAttribute('role', 'option');
    a.style.setProperty('--i', i);
    a.style.setProperty('--sk', j.sk + 'deg');
    a.style.setProperty('--rot', j.rot + 'deg');
    a.style.setProperty('--ox', j.ox + 'px');
    a.style.setProperty('--sc', j.sc);

    const plate = document.createElement('span');
    plate.className = 'plate';
    const txt = document.createElement('span');
    txt.className = 'txt';
    txt.textContent = it.name;
    a.append(plate, txt);
    if (i < 9) {
      const k = document.createElement('span');
      k.className = 'k';
      k.textContent = i + 1;
      a.append(k);
    }

    a.addEventListener('mouseenter', () => select(i, false));
    a.addEventListener('focus', () => select(i, false));
    a.addEventListener('click', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // обычное поведение ссылки
      e.preventDefault();
      go(it.url);
    });
    menu.append(a);
  });
  select(sel, true, true);
}

function select(i, _scroll = true, silent = false) {
  const els = menu.querySelectorAll('.it');
  if (!els.length) return;
  i = (i + els.length) % els.length;
  const changed = i !== sel;
  sel = i;
  els.forEach((el, k) => {
    el.setAttribute('aria-selected', k === i ? 'true' : 'false');
    el.style.setProperty('--o', Math.max(0.5, 1 - Math.abs(k - i) * 0.17).toFixed(2));
  });
  $('#dn').textContent = String(i + 1).padStart(2, '0');
  $('#dt').textContent = items[i].name;
  $('#du').textContent = host(items[i].url);
  if (changed && !silent) blip(660 + i * 28);
}

function go(url) {
  blip(980, 0.12, 'sawtooth', 0.05);
  document.body.classList.add('leaving');
  setTimeout(() => { location.href = url; }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 480);
}
// bfcache: вернулись назад — убираем шторку
addEventListener('pageshow', () => document.body.classList.remove('leaving'));

/* ───────── search / bangs ───────── */
const bangsEl = $('#bangs');
for (const [k, [name]] of Object.entries(BANGS)) {
  const s = document.createElement('span');
  s.innerHTML = `<b>!${k}</b> ${name.toLowerCase()}`;
  bangsEl.append(s);
}

function resolveQuery(raw) {
  const q = raw.trim();
  if (!q) return null;
  const m = q.match(/^!(\w+)\s+(.+)$/);
  if (m && BANGS[m[1].toLowerCase()]) return BANGS[m[1].toLowerCase()][1] + encodeURIComponent(m[2]);
  if (/^https?:\/\//i.test(q)) return validUrl(q);
  // "github.com/foo" без протокола → прямой переход
  if (!/\s/.test(q) && /^([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(q)) return validUrl('https://' + q);
  if (/^localhost(:\d+)?(\/\S*)?$/i.test(q)) return validUrl('http://' + q);
  return 'https://www.google.com/search?q=' + encodeURIComponent(q);
}
// командная строка выезжает снизу, только пока в ней фокус
$('#q').addEventListener('focus', () => document.body.classList.add('searching'));
$('#q').addEventListener('blur', () => document.body.classList.remove('searching'));
$('#search').addEventListener('submit', e => {
  e.preventDefault();
  const url = resolveQuery($('#q').value);
  if (url) go(url);
});

/* ───────── keyboard ───────── */
const modal = $('#modal');
const isTyping = t => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!modal.hidden) { modal.hidden = true; return; }
    if (isTyping(e.target)) { e.target.blur(); return; }
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#q').focus(); $('#q').select(); return; }
  if (isTyping(e.target) || !modal.hidden || e.ctrlKey || e.metaKey || e.altKey) return;

  switch (e.key) {
    case 'ArrowDown': case 'j': case 'J': e.preventDefault(); select(sel + 1); break;
    case 'ArrowUp':   case 'k': case 'K': e.preventDefault(); select(sel - 1); break;
    case 'Home': e.preventDefault(); select(0); break;
    case 'End':  e.preventDefault(); select(items.length - 1); break;
    case 'Enter': if (items[sel] && document.activeElement?.tagName !== 'A' && document.activeElement?.tagName !== 'BUTTON') go(items[sel].url); break;
    case '/': e.preventDefault(); $('#q').focus(); break;
    case ',': e.preventDefault(); openSettings(); break;
    case 'm': case 'M': soundOn = !soundOn; store.set(SOUND_KEY, soundOn ? '1' : '0'); renderSound(); blip(880, 0.08); break;
    default:
      if (/^[1-9]$/.test(e.key) && items[+e.key - 1]) { select(+e.key - 1); go(items[+e.key - 1].url); }
  }
});

/* ───────── parallax ───────── */
const stage = $('#stage');
addEventListener('mousemove', e => {
  stage.style.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
  stage.style.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3));
}, { passive: true });

/* ───────── settings ───────── */
function move(i, d) {
  const j = i + d;
  if (j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  save(); renderMenu(); editList();
}
function editList() {
  const box = $('#settingsList');
  box.replaceChildren();
  items.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'settings-row';

    const no = document.createElement('span');
    no.textContent = String(i + 1).padStart(2, '0');

    const name = document.createElement('input');
    name.value = item.name;
    name.setAttribute('aria-label', 'Название');
    name.addEventListener('change', () => { items[i].name = name.value.trim().slice(0, 32) || 'LINK'; save(); renderMenu(); });

    const url = document.createElement('input');
    url.value = item.url;
    url.setAttribute('aria-label', 'URL');
    url.addEventListener('change', () => {
      const v = validUrl(url.value.trim());
      if (v) { items[i].url = v; save(); renderMenu(); }
      else { url.value = items[i].url; alert('Нужен адрес с https:// или http://'); }
    });

    const up = Object.assign(document.createElement('button'), { textContent: '↑', title: 'Выше' });
    const dn = Object.assign(document.createElement('button'), { textContent: '↓', title: 'Ниже' });
    up.className = dn.className = 'mv';
    up.type = dn.type = 'button';
    up.addEventListener('click', () => move(i, -1));
    dn.addEventListener('click', () => move(i, 1));

    const del = Object.assign(document.createElement('button'), { textContent: '×', title: 'Удалить', type: 'button' });
    del.addEventListener('click', () => { items.splice(i, 1); save(); renderMenu(); editList(); });

    row.append(no, name, url, up, dn, del);
    box.append(row);
  });
}
function openSettings() { editList(); modal.hidden = false; }
$('#settings').onclick = openSettings;
$('#close').onclick = () => { modal.hidden = true; };
modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });

$('#addForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#newName').value.trim();
  const url = validUrl($('#newUrl').value.trim());
  if (!url) { alert('Введите полный URL с https://'); return; }
  if (items.length >= MAX_LINKS) { alert('Максимум ' + MAX_LINKS + ' ссылок'); return; }
  items.push({ name: name.slice(0, 32), url });
  save(); renderMenu(); editList(); e.target.reset();
});
$('#reset').onclick = () => {
  if (confirm('Вернуть стандартные ссылки?')) { items = clone(defaults); save(); renderMenu(); editList(); }
};
$('#export').onclick = async () => {
  const text = JSON.stringify(items, null, 2);
  try { await navigator.clipboard.writeText(text); alert('JSON скопирован в буфер обмена'); }
  catch { prompt('Скопируй JSON:', text); }
};
$('#import').onclick = () => {
  const text = prompt('Вставь JSON со ссылками: [{"name":"...","url":"https://..."}]');
  if (!text) return;
  try {
    const raw = JSON.parse(text);
    if (!Array.isArray(raw)) throw 0;
    const ok = raw.filter(x => x && typeof x.name === 'string' && validUrl(x.url))
      .slice(0, MAX_LINKS).map(x => ({ name: x.name.slice(0, 32), url: validUrl(x.url) }));
    if (!ok.length) throw 0;
    items = ok; save(); renderMenu(); editList();
  } catch { alert('Неверный формат JSON'); }
};

/* ───────── init ───────── */
renderSound();
renderMenu();
addEventListener('resize', () => select(sel, false, true));
