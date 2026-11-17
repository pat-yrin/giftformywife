/* Lógica del calendario. No necesitas tocar este archivo para personalizarlo:
   el contenido está en content.js y los estilos en styles.css. */
(() => {
  'use strict';

  const C = window.CONFIG || {};
  const DAYS = (window.DAYS || []).slice().sort((a, b) => a.day - b.day);
  const byDay = Object.fromEntries(DAYS.map((d) => [d.day, d]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const params = new URLSearchParams(location.search);
  const DEBUG = params.has('debug');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MONTH = (C.month || 12) - 1;

  const fill = (s) =>
    String(s ?? '').replace(/\{forName\}/g, C.forName || '').replace(/\{fromName\}/g, C.fromName || '');

  /* ---------- tiempo (con fecha simulable: ?fecha=2026-12-10) ---------- */
  let simBase = null;
  const simStart = Date.now();
  const f = (params.get('fecha') || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (f) simBase = new Date(+f[1], +f[2] - 1, +f[3], 9, 0, 0).getTime();
  const now = () => (simBase ? new Date(simBase + (Date.now() - simStart)) : new Date());
  const doorDate = (d) => new Date(C.year, MONTH, d, 0, 0, 0);
  const isUnlocked = (d) => DEBUG || now() >= doorDate(d);
  const niceDate = (date) => date.toLocaleDateString('es', { day: 'numeric', month: 'long' });

  /* ---------- progreso guardado (el modo prueba usa otra clave) ---------- */
  const TEST = DEBUG || simBase !== null;
  const KEY = `adviento-${C.year}${TEST ? '-prueba' : ''}`;
  const emptyState = () => ({ opened: {}, solved: {}, redeemed: {}, found: {} });
  let state = emptyState();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(emptyState(), JSON.parse(raw));
  } catch (_) {}
  if (params.has('reset')) { state = emptyState(); save(); }

  /* ---------- utilidades DOM ---------- */
  const h = (tag, props = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    kids.flat().filter(Boolean).forEach((c) => e.append(c));
    return e;
  };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const s = (tag, attrs = {}, ...kids) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    kids.forEach((c) => e.append(c));
    return e;
  };
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- cabecera y pie ---------- */
  document.title = fill(C.title || 'Calendario de Adviento');
  $('#title').textContent = fill(C.title || 'Calendario de Adviento');
  $('#subtitle').textContent = fill(C.subtitle || '');
  $('#eyebrow').textContent = C.eyebrow || new Date(C.year, MONTH, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' });
  $('#footer').textContent = fill(C.footer || '');

  /* ====================== ÁRBOL ====================== */
  const ORN_COLORS = ['#f4b6cb', '#a9d8c4', '#c9b9ee', '#f9cfae', '#a9c8ee', '#f6df98'];
  const SLOTS = [
    [184, 135], [216, 135],
    [165, 200], [200, 200], [235, 200],
    [133, 250], [178, 250], [222, 250], [267, 250],
    [124, 318], [162, 318], [200, 318], [238, 318], [276, 318],
    [122, 392], [161, 392], [200, 392], [239, 392], [278, 392],
    [92, 445], [146, 445], [200, 445], [254, 445], [308, 445],
  ];
  const starPts = (R, r) =>
    Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 ? r : R;
      return `${(Math.cos(a) * rad).toFixed(1)},${(Math.sin(a) * rad).toFixed(1)}`;
    }).join(' ');

  function buildOrnament(day) {
    const [x, y] = SLOTS[((day - 1) * 7) % SLOTS.length];
    const color = ORN_COLORS[(day - 1) % ORN_COLORS.length];
    const g = s('g', { class: 'orn', 'data-day': day, transform: `translate(${x} ${y})` });
    g.append(s('circle', { class: 'ghost', r: 9 }));
    const ball = s('g', { class: 'ball' });
    if (day % 4 === 0) {
      ball.append(s('polygon', { points: starPts(13, 5.5), fill: color, stroke: '#fff', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
    } else {
      ball.append(
        s('line', { x1: 0, y1: -11, x2: 0, y2: -17, stroke: '#d8c79c', 'stroke-width': 1.5 }),
        s('rect', { x: -3.5, y: -13, width: 7, height: 4.5, rx: 1.2, fill: '#e8d6a4' }),
        s('circle', { r: 10.5, fill: color, stroke: '#fff', 'stroke-width': 1 }),
        s('ellipse', { cx: -3.5, cy: -3.5, rx: 3.2, ry: 2, fill: '#fff', opacity: 0.75, transform: 'rotate(-35 -3.5 -3.5)' })
      );
    }
    g.append(ball);
    return g;
  }

  function buildTree() {
    const orns = $('#ornaments');
    DAYS.filter((d) => d.day >= 1 && d.day <= SLOTS.length).forEach((d) => orns.append(buildOrnament(d.day)));
    const sparkles = $('#sparkles');
    [[38, 120], [352, 138], [56, 300], [346, 282], [28, 430], [374, 402], [112, 66], [292, 78], [322, 226], [78, 214]].forEach(([x, y], i) => {
      sparkles.append(
        s('g', { transform: `translate(${x} ${y})` },
          s('path', {
            class: 'twinkle',
            d: 'M0-8Q0 0 8 0Q0 0 0 8Q0 0-8 0Q0 0 0-8Z',
            fill: '#fff', stroke: '#b9c8ec', 'stroke-width': 0.8,
            style: `animation-delay:${(i * 0.37).toFixed(2)}s`,
          }))
      );
    });
  }

  function syncOrnaments(stagger) {
    document.querySelectorAll('.orn').forEach((g, i) => {
      const on = !!state.opened[g.dataset.day];
      if (!on) { g.classList.remove('on'); return; }
      if (stagger && !reduceMotion) setTimeout(() => g.classList.add('on'), 250 + i * 70);
      else g.classList.add('on');
    });
  }

  /* ====================== CASILLAS ====================== */
  const ICONS = { message: '💌', photo: '📸', coupon: '🎟️', song: '🎵', video: '🎬', riddle: '🧩', wordsearch: '🔤', quote: '📖', puzzle: '🖼️', hangman: '🎄', bunny: '🐰', wheel: '🎡', scratch: '✨', catch: '💗', platformer: '🎮', book: '📚', stocking: '🧦', binary: '💻', letter: '✉️', snowglobe: '🔮' };
  const LOCK_SVG =
    '<svg class="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededShuffle(arr, seed) {
    const a = arr.slice(); const rnd = mulberry32(seed);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function makeDoor(data) {
    const front = h('span', { class: 'face front' }, h('span', { class: 'num', text: data.day }));
    front.insertAdjacentHTML('beforeend', LOCK_SVG);
    const back = h('span', { class: 'face back' },
      h('span', { class: 'icon', text: data.icon || ICONS[data.type] || '🎁' }),
      h('span', { class: 'mini', text: fill(data.title || '') }));
    return h('button', { class: `door tone-${(data.day - 1) % 6}`, type: 'button', 'data-day': data.day },
      h('span', { class: 'door-inner' }, front, back));
  }

  function buildDoors() {
    const list = C.shuffleDoors ? seededShuffle(DAYS, C.year) : DAYS;
    const box = $('#doors');
    list.forEach((d) => box.append(makeDoor(d)));
  }

  function updateDoorStates() {
    document.querySelectorAll('.door').forEach((el) => {
      const d = +el.dataset.day;
      const unlocked = isUnlocked(d);
      const opened = !!state.opened[d];
      el.classList.toggle('is-locked', !unlocked && !opened);
      el.classList.toggle('is-available', unlocked || opened);
      el.classList.toggle('opened', opened);
      el.setAttribute('aria-label', opened ? `Día ${d}, abierta: ${fill(byDay[d].title || '')}` : unlocked ? `Día ${d}, lista para abrir` : `Día ${d}, bloqueada hasta el ${niceDate(doorDate(d))}`);
    });
  }

  function activate(d) {
    const data = byDay[d];
    if (!data) return;
    const el = $(`.door[data-day="${d}"]`);
    if (!isUnlocked(d) && !state.opened[d]) {
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      toast(`Esta casilla se abre el ${niceDate(doorDate(d))} 💗 ¡Un poquito de paciencia!`);
      return;
    }
    if (state.opened[d]) { showModal(d); return; }
    state.opened[d] = true; save();
    updateDoorStates();
    const orn = $(`.orn[data-day="${d}"]`);
    if (orn) orn.classList.add('on');
    renderStatus();
    confetti(d === DAYS[DAYS.length - 1].day ? 2.2 : 1);
    setTimeout(() => showModal(d), reduceMotion ? 0 : 800);
  }

  /* ====================== ESTADO / CUENTA ATRÁS ====================== */
  const fmtCountdown = (ms) => {
    const t = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60;
    return `${d > 0 ? `${d} d ` : ''}${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  };

  function renderStatus() {
    const total = DAYS.length;
    const openedCount = DAYS.filter((d) => state.opened[d.day]).length;
    const pendingNow = DAYS.filter((d) => isUnlocked(d.day) && !state.opened[d.day]).length;
    const next = DAYS.find((d) => !isUnlocked(d.day));
    let label, big, sub = '';
    if (DEBUG) { label = 'Modo prueba'; big = 'Todo desbloqueado'; }
    else if (!next) {
      if (openedCount === total) { label = '¡Calendario completo!'; big = 'Feliz Navidad ❄'; }
      else { label = 'Todas las casillas están disponibles'; big = `Te quedan ${total - openedCount}`; }
    } else {
      label = next.day === DAYS[0].day ? 'El calendario se abre en' : 'La próxima casilla se abre en';
      big = fmtCountdown(doorDate(next.day) - now());
      if (pendingNow > 0) sub = pendingNow === 1 ? '✨ Tienes 1 casilla por abrir' : `✨ Tienes ${pendingNow} casillas por abrir`;
    }
    $('#stLabel').textContent = label;
    $('#stCount').textContent = big;
    $('#stSub').textContent = sub;
    $('#stBar').style.width = `${total ? (openedCount / total) * 100 : 0}%`;
    $('#stProg').textContent = `${openedCount} de ${total} casillas abiertas`;
  }

  let lastUnlocked = -1;
  function tick() {
    const n = DAYS.filter((d) => isUnlocked(d.day)).length;
    if (n !== lastUnlocked) {
      if (lastUnlocked !== -1 && n > lastUnlocked) toast('✨ ¡Hay una casilla nueva!');
      lastUnlocked = n;
      updateDoorStates();
    }
    renderStatus();
  }

  /* ====================== AVISO ====================== */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ====================== VENTANA DE LA SORPRESA ====================== */
  const dlg = $('#modal');
  const cv = $('#confetti');

  function showModal(d) {
    const data = byDay[d];
    const box = $('#content');
    box.replaceChildren();
    renderDay(data, box);
    if (!dlg.open) dlg.showModal();
    dlg.append(cv); // el confeti debe vivir dentro del diálogo para verse por encima
    $('.sheet', dlg).scrollTop = 0;
  }

  const paragraphs = (text, box, cls) =>
    fill(text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).forEach((p) => box.append(h('p', { class: cls, text: p })));

  const imageNode = (src) =>
    src
      ? h('img', {
          src, alt: '', loading: 'lazy',
          onerror: (e) => e.target.replaceWith(h('div', { class: 'placeholder', text: 'No se encontró la imagen. Revisa la ruta en content.js' })),
        })
      : h('div', { class: 'placeholder', text: 'Aquí irá una foto. Añádela en content.js' });

  function toEmbed(url) {
    if (!url || typeof url !== 'string') return null;
    url = url.trim();
    let m = url.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
    if (m) return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, style: `height:${m[1] === 'track' || m[1] === 'episode' ? 152 : 352}px` };
    m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
    if (m) return { src: `https://www.youtube.com/embed/${m[1]}`, style: 'aspect-ratio:16/9' };
    return /^https:\/\//.test(url) ? { src: url, style: 'aspect-ratio:16/9' } : null;
  }
  function embedNode(url, what) {
    const info = toEmbed(url);
    if (!info) return h('div', { class: 'placeholder', text: `Aquí irá ${what}. Pega el enlace en content.js` });
    const isSpotify = info.src.includes('spotify.com');
    return h('div', { class: 'embed-wrap' },
      h('iframe', {
        class: 'embed', src: info.src, style: info.style, loading: 'lazy', title: 'Contenido incrustado',
        referrerpolicy: 'strict-origin-when-cross-origin', // YouTube lo exige (evita el error 153)
        allowfullscreen: '',
        allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share',
      }),
      h('a', { class: 'embed-fallback', href: String(url).trim(), target: '_blank', rel: 'noopener noreferrer', text: `¿No se reproduce? Ábrelo en ${isSpotify ? 'Spotify' : 'YouTube'}` }));
  }

  const norm = (str) =>
    String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

  /* ---------- tarjeta con imagen + botón que abre un enlace (canción o vídeo) ---------- */
  function linkCard(data, box, o) {
    const url = String(data.url || '').trim();
    const ok = /^https:\/\//.test(url);
    const platform = /spotify\./i.test(url) ? 'Spotify' : /youtu/i.test(url) ? 'YouTube' : '';
    const card = h('div', { class: `song-card${o.video ? ' is-video' : ''}` });
    const ph = () => h('div', { class: 'song-cover song-cover-ph', text: o.icon });
    const pic = data.cover
      ? h('img', { class: 'song-cover', src: data.cover, alt: '', loading: 'lazy', onerror: (e) => e.target.replaceWith(ph()) })
      : ph();
    card.append(ok
      ? h('a', { class: 'cover-link', href: url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Abrir enlace' }, pic)
      : h('div', { class: 'cover-link' }, pic));
    if (data.songTitle) card.append(h('p', { class: 'song-title', text: fill(data.songTitle) }));
    if (data.artist) card.append(h('p', { class: 'song-artist', text: fill(data.artist) }));
    if (ok) {
      const base = o.label || 'Escuchar';
      card.append(h('a', {
        class: 'btn song-btn', href: url, target: '_blank', rel: 'noopener noreferrer',
        text: fill(data.buttonLabel || `▶  ${base}${platform ? ' en ' + platform : o.video ? '' : ' canción'}`),
      }));
    } else {
      card.append(h('div', { class: 'placeholder', text: `Aquí irá ${o.placeholder}. Pega el enlace en content.js` }));
    }
    box.append(card);
    paragraphs(data.text, box);
  }

  /* ---------- sopa de letras ---------- */
  const wsKey = (w) =>
    String(w).toUpperCase().normalize('NFD').replace(/Ñ/g, 'Ñ').replace(/[̀-ͯ]/g, '').replace(/[^A-ZÑ]/g, '');

  function buildWordSearch(keys, size, seed, easy) {
    const dirs = easy ? [[0, 1], [1, 0]] : [[0, 1], [1, 0], [1, 1], [-1, 1]]; // [fila, columna]
    const order = keys.slice().sort((a, b) => b.length - a.length);
    const first = Math.max(size, order[0].length);
    for (let n = first; n <= first + 6; n++) {
      const rnd = mulberry32(seed * 7919 + n);
      const grid = Array.from({ length: n }, () => Array(n).fill(''));
      const places = {};
      let ok = true;
      for (const w of order) {
        let placed = false;
        for (let t = 0; t < 400 && !placed; t++) {
          const [dr, dc] = dirs[Math.floor(rnd() * dirs.length)];
          const r0 = Math.floor(rnd() * n), c0 = Math.floor(rnd() * n);
          const r1 = r0 + dr * (w.length - 1), c1 = c0 + dc * (w.length - 1);
          if (r1 < 0 || r1 >= n || c1 < 0 || c1 >= n) continue;
          let fits = true;
          for (let i = 0; i < w.length; i++) {
            const ch = grid[r0 + dr * i][c0 + dc * i];
            if (ch && ch !== w[i]) { fits = false; break; }
          }
          if (!fits) continue;
          places[w] = [];
          for (let i = 0; i < w.length; i++) {
            grid[r0 + dr * i][c0 + dc * i] = w[i];
            places[w].push({ r: r0 + dr * i, c: c0 + dc * i });
          }
          placed = true;
        }
        if (!placed) { ok = false; break; }
      }
      if (ok) {
        const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!grid[r][c]) grid[r][c] = ABC[Math.floor(rnd() * ABC.length)];
        return { grid, size: n, places };
      }
    }
    return null;
  }

  /* ---------- piezas comunes de los regalos interactivos ---------- */
  const makeReward = (data, heading) => {
    const r = h('div', { class: 'reward' }, h('p', { class: 'ok', text: heading }));
    paragraphs(data.reward, r);
    if (data.rewardImage) r.append(imageNode(data.rewardImage));
    return r;
  };
  const missing = (msg) => h('div', { class: 'placeholder', text: msg });

  const TREE_SVG = `<svg viewBox="0 0 200 220" role="img" aria-label="Árbol de Navidad">
    <ellipse cx="100" cy="208" rx="62" ry="7" fill="#e6edfa"/>
    <rect x="90" y="176" width="20" height="28" rx="4" fill="#d8c7c4"/>
    <g fill="#fff" stroke="#cbd7ee" stroke-width="2.5" stroke-linejoin="round">
      <path d="M100 96 L150 180 Q100 192 50 180 Z"/>
      <path d="M100 58 L136 128 Q100 138 64 128 Z"/>
      <path d="M100 24 L122 82 Q100 90 78 82 Z"/>
    </g>
    <g class="hm-orns"></g>
    <polygon points="100,2 103.5,12 114,12.4 105.7,18.8 108.6,28.8 100,22.9 91.4,28.8 94.3,18.8 86,12.4 96.5,12" fill="#fbe3a5" stroke="#fbe3a5" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;

  const GLOBE_SVG = `<svg class="sg-svg" viewBox="0 0 300 350" role="img" aria-label="Bola de nieve con dos mujeres abrazadas, como figuras de porcelana">
    <defs>
      <radialGradient id="sgGlass" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e9f1fd"/><stop offset="1" stop-color="#cfdcf5"/></radialGradient>
      <linearGradient id="sgBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d6e2"/><stop offset="1" stop-color="#e3a9bf"/></linearGradient>
      <linearGradient id="sgPorc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9edf7"/></linearGradient>
      <radialGradient id="sgSkinA" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#d49a73"/><stop offset="1" stop-color="#a8704e"/></radialGradient>
      <radialGradient id="sgSkinB" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff1e8"/><stop offset="1" stop-color="#f1cdbb"/></radialGradient>
      <linearGradient id="sgDressA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbd9e5"/><stop offset="1" stop-color="#f0aac4"/></linearGradient>
      <linearGradient id="sgDressB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dbe9fb"/><stop offset="1" stop-color="#a9c6ee"/></linearGradient>
      <clipPath id="sgClip"><circle cx="150" cy="150" r="118"/></clipPath>
    </defs>
    <ellipse cx="150" cy="341" rx="122" ry="10" fill="#8aa0d6" opacity=".25"/>
    <circle cx="150" cy="150" r="120" fill="url(#sgGlass)"/>
    <g clip-path="url(#sgClip)">
      <ellipse cx="150" cy="262" rx="116" ry="24" fill="#fff"/>
      <g transform="translate(78 232)"><path d="M0 -26 L10 -8 H4 L13 6 H-13 L-4 -8 H-10Z" fill="#cfeadc" stroke="#a9d8c4" stroke-width="2" stroke-linejoin="round"/><rect x="-2" y="6" width="4" height="5" fill="#d8c7c4"/><circle cx="0" cy="-26" r="2.5" fill="#fbe3a5"/></g>
      <g transform="translate(224 236) scale(.8)"><path d="M0 -26 L10 -8 H4 L13 6 H-13 L-4 -8 H-10Z" fill="#cfeadc" stroke="#a9d8c4" stroke-width="2" stroke-linejoin="round"/><rect x="-2" y="6" width="4" height="5" fill="#d8c7c4"/><circle cx="0" cy="-26" r="2.5" fill="#fbe3a5"/></g>
      <g transform="translate(150 243) scale(1.25) translate(-150 -243)">
      <ellipse cx="150" cy="243" rx="52" ry="8" fill="url(#sgPorc)" stroke="#d4dcf0" stroke-width="1.5"/>
      <!-- cabello de atrás -->
      <g fill="#2a2030">
        <circle cx="118" cy="148" r="8"/><circle cx="120" cy="136" r="8"/><circle cx="128" cy="126" r="8"/><circle cx="139" cy="123" r="8"/><circle cx="148" cy="130" r="7"/>
        <circle cx="119" cy="160" r="7"/><circle cx="125" cy="168" r="6"/>
      </g>
      <path d="M149 150 Q148 124 166 124 Q184 124 184 150 L187 182 Q176 186 172 176 L158 176 Q150 186 142 180 Z" fill="#3a2d3c"/>
      <!-- vestidos -->
      <path d="M114 170 Q127 162 142 170 L156 238 Q127 248 98 238 Z" fill="url(#sgDressA)" stroke="#e3a3bd" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M99 233 Q127 243 155 233" fill="none" stroke="#e8cf8f" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M158 170 Q171 162 186 170 L202 238 Q173 248 144 238 Z" fill="url(#sgDressB)" stroke="#97b7e3" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M146 233 Q174 243 201 233" fill="none" stroke="#e8cf8f" stroke-width="2.5" stroke-linecap="round"/>
      <!-- cuellos y cabezas -->
      <rect x="130" y="156" width="10" height="12" rx="4" fill="#a8704e"/>
      <rect x="161" y="156" width="10" height="12" rx="4" fill="#f1cdbb"/>
      <circle cx="136" cy="146" r="15" fill="url(#sgSkinA)"/>
      <circle cx="165" cy="146" r="15" fill="url(#sgSkinB)"/>
      <!-- flequillos -->
      <g fill="#2a2030"><circle cx="126" cy="135" r="6.5"/><circle cx="134" cy="131" r="6.5"/><circle cx="143" cy="132" r="6.5"/><circle cx="149" cy="138" r="5"/></g>
      <path d="M151 142 Q152 128 165 128 Q178 128 180 142 Q171 134 163 136 Q156 137 151 142Z" fill="#3a2d3c"/>
      <!-- caras (ojos cerrados) -->
      <g fill="none" stroke="#5b3f45" stroke-width="1.6" stroke-linecap="round">
        <path d="M130 148 q3 3 6 0"/><path d="M139 148 q3 3 6 0"/>
        <path d="M157 148 q3 3 6 0"/><path d="M166 148 q3 3 6 0"/>
        <path d="M134 155 q3 2.5 6 0"/><path d="M162 155 q3 2.5 6 0"/>
      </g>
      <g fill="#f4a3b8" opacity=".6"><circle cx="128" cy="153" r="3.2"/><circle cx="172" cy="153" r="3.2"/></g>
      <!-- brazos abrazándose -->
      <path d="M134 176 Q160 190 186 178" fill="none" stroke="#f0aac4" stroke-width="9" stroke-linecap="round"/>
      <path d="M167 178 Q140 192 114 182" fill="none" stroke="#a9c6ee" stroke-width="9" stroke-linecap="round"/>
      <circle cx="188" cy="178" r="4.8" fill="#a8704e"/>
      <circle cx="112" cy="182" r="4.8" fill="#f1cdbb"/>
      <!-- brillo de porcelana -->
      <g fill="#fff" opacity=".55"><ellipse cx="130" cy="139" rx="4" ry="2.6" transform="rotate(-30 130 139)"/><ellipse cx="160" cy="139" rx="4" ry="2.6" transform="rotate(-30 160 139)"/>
        <path d="M117 178 Q119 205 123 224" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><path d="M162 178 Q164 205 168 224" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></g>
      </g>
    </g>
    <circle cx="150" cy="150" r="120" fill="none" stroke="#c4d3f0" stroke-width="2.5"/>
    <path d="M62 100 Q70 66 108 46" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".75"/>
    <!-- base y cuello: el cristal entra dentro del aro -->
    <path d="M64 280 Q150 302 236 280 L248 326 Q150 350 52 326 Z" fill="url(#sgBase)" stroke="#d891ae" stroke-width="2" stroke-linejoin="round"/>
    <path d="M59 300 Q150 324 241 300" fill="none" stroke="#e8cf8f" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="150" cy="281" rx="88" ry="13" fill="#fbe3ee" stroke="#d891ae" stroke-width="2"/>
    <path d="M86 254 Q150 276 214 254 L226 280 Q150 300 74 280 Z" fill="url(#sgBase)" stroke="#d891ae" stroke-width="2" stroke-linejoin="round"/>
    <path d="M80 268 Q150 290 220 268" fill="none" stroke="#e8cf8f" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M86 254 Q150 276 214 254" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>
    <text class="sg-label" x="150" y="326" text-anchor="middle"></text>
  </svg>`;

  const BUNNY_SVG = `<svg class="bunny-svg" viewBox="0 0 240 270" role="img" aria-label="Un conejito sosteniendo tulipanes rosados">
    <ellipse cx="120" cy="260" rx="76" ry="8" fill="#dfe6f5"/>
    <g class="bn-ear bn-ear-l">
      <ellipse cx="92" cy="54" rx="17" ry="42" transform="rotate(-10 92 54)" fill="#fff" stroke="#cbd7ee" stroke-width="2.5"/>
      <ellipse cx="92" cy="58" rx="8" ry="29" transform="rotate(-10 92 58)" fill="#f8d3df"/>
    </g>
    <g class="bn-ear bn-ear-r">
      <ellipse cx="148" cy="54" rx="17" ry="42" transform="rotate(10 148 54)" fill="#fff" stroke="#cbd7ee" stroke-width="2.5"/>
      <ellipse cx="148" cy="58" rx="8" ry="29" transform="rotate(10 148 58)" fill="#f8d3df"/>
    </g>
    <ellipse cx="120" cy="198" rx="54" ry="56" fill="#fff" stroke="#cbd7ee" stroke-width="2.5"/>
    <ellipse cx="120" cy="208" rx="34" ry="38" fill="#f8f4ff"/>
    <ellipse cx="86" cy="250" rx="22" ry="10" fill="#fff" stroke="#cbd7ee" stroke-width="2.5"/>
    <ellipse cx="154" cy="250" rx="22" ry="10" fill="#fff" stroke="#cbd7ee" stroke-width="2.5"/>
    <ellipse cx="120" cy="112" rx="50" ry="43" fill="#fff" stroke="#cbd7ee" stroke-width="2.5"/>
    <circle cx="90" cy="124" r="9" fill="#f8d3df" opacity=".75"/>
    <circle cx="150" cy="124" r="9" fill="#f8d3df" opacity=".75"/>
    <circle cx="104" cy="108" r="4.6" fill="#56608a"/>
    <circle cx="136" cy="108" r="4.6" fill="#56608a"/>
    <circle cx="105.7" cy="106.3" r="1.5" fill="#fff"/>
    <circle cx="137.7" cy="106.3" r="1.5" fill="#fff"/>
    <ellipse cx="120" cy="119" rx="5" ry="3.6" fill="#f4b6cb"/>
    <path d="M120 122.6 V127 M120 127 Q114 133 108 128 M120 127 Q126 133 132 128" fill="none" stroke="#8a93b3" stroke-width="2" stroke-linecap="round"/>
    <g fill="none" stroke-linecap="round" stroke-width="4">
      <path d="M100 200 Q108 222 120 238" stroke="#8fcfb0"/>
      <path d="M120 190 L120 238" stroke="#8fcfb0"/>
      <path d="M140 200 Q132 222 120 238" stroke="#8fcfb0"/>
    </g>
    <path d="M120 238 Q92 222 80 192 Q108 206 120 238Z" fill="#a9dcc2"/>
    <path d="M120 238 Q148 222 160 192 Q132 206 120 238Z" fill="#a9dcc2"/>
    <g stroke="#e58aad" stroke-width="2" stroke-linejoin="round" fill="#f4a6c3">
      <path transform="translate(100 202) rotate(-14)" d="M-13 -4 C-17 -18 -12 -28 -8 -34 L-3 -24 L0 -36 L3 -24 L8 -34 C12 -28 17 -18 13 -4 C8 6 -8 6 -13 -4Z"/>
      <path transform="translate(140 202) rotate(14)" d="M-13 -4 C-17 -18 -12 -28 -8 -34 L-3 -24 L0 -36 L3 -24 L8 -34 C12 -28 17 -18 13 -4 C8 6 -8 6 -13 -4Z"/>
      <path transform="translate(120 192)" d="M-13 -4 C-17 -18 -12 -28 -8 -34 L-3 -24 L0 -36 L3 -24 L8 -34 C12 -28 17 -18 13 -4 C8 6 -8 6 -13 -4Z"/>
    </g>
    <g fill="none" stroke="#fbd0e1" stroke-width="2.4" stroke-linecap="round">
      <path transform="translate(120 192)" d="M-6 -6 C-9 -16 -7 -24 -5 -28"/>
      <path transform="translate(100 202) rotate(-14)" d="M-6 -6 C-9 -16 -7 -24 -5 -28"/>
      <path transform="translate(140 202) rotate(14)" d="M-6 -6 C-9 -16 -7 -24 -5 -28"/>
    </g>
    <circle cx="94" cy="222" r="12" fill="#fff" stroke="#cbd7ee" stroke-width="2.5"/>
    <circle cx="146" cy="222" r="12" fill="#fff" stroke="#cbd7ee" stroke-width="2.5"/>
    <g transform="translate(120 232)">
      <ellipse cx="-10" cy="0" rx="10" ry="6" transform="rotate(-18 -10 0)" fill="#f4b6cb"/>
      <ellipse cx="10" cy="0" rx="10" ry="6" transform="rotate(18 10 0)" fill="#f4b6cb"/>
      <circle r="4" fill="#e58aad"/>
    </g>
  </svg>`;

  /* ====================== PIEZAS PARA LOS REGALOS 2 ====================== */

  /* ---------- mini juego de plataformas (pixel art) ---------- */
  const PF_T = 16, PF_VW = 240, PF_VH = 176;
  const pfSprite = (rows, pal) => {
    const c = document.createElement('canvas');
    c.width = Math.max(...rows.map((r) => r.length)); c.height = rows.length;
    const x = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, xx) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(xx, y, 1, 1); } }));
    return c;
  };
  const PAT_TOP = [
    '..k.kk.kk.k.',
    '.kkkkkkkkkk.',
    'kkkkkkkkkkkk',
    'kkkkkkkkkkkk',
    'kksssssssskk',
    'kksesssseskk',
    'kkssssmmsskk',
    '.kdssssssdk.',
    '..gggggggg..',
    '.cccccccccc.',
    'scccccwccccs',
    '.cccccccccc.',
    '.CCCCCCCCCC.',
  ];
  const PF_ART = {
    patA: PAT_TOP.concat(['..bbb..bbb..', '..bbb..bbb..', '.bbbb..bbbb.']),
    patB: PAT_TOP.concat(['....bbbbb...', '....bbbbb...', '...bbbbbbb..']),
    patJ: PAT_TOP.concat(['.bb......bb.', '.bb......bb.', 'bb........bb']),
    princess: [
      '...y.yy.y...', '...yyyyyy...', '..hhhhhhhh..', '.hhhhhhhhhh.',
      '.hhsssssshh.', '.hhsesseshh.', '.hhssmmsshh.', '.hhhsssshhh.',
      '.hhddddddhh.', '.hddddddddh.', 'hhddddddddhh', 'hhddDddDddhh',
      'hhddddddddhh', '.dddddddddd.', 'dddddddddddd', '..bb....bb..',
    ],
    enemy: [
      '...wwwwww...', '..wwwwwwww..', '.wwwwwwwwww.', '.wwkkwwkkww.', '.wwwkwwkwww.',
      '.wwwwoowwww.', '.wwwwwwwwww.', '.bwwwwwwwwb.', '.bbwwwwwwbb.', '..bbbbbbbb..',
    ],
    heart: ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
  };
  const PF_PAL = {
    pat: { k: '#1c1824', K: '#3b3550', s: '#9a5f3d', d: '#7d4a2e', e: '#1c1824', m: '#c0566b', c: '#b9a8f0', C: '#9a88dd', g: '#f4b6cb', w: '#ffffff', b: '#56608a' },
    princess: { h: '#2a2230', H: '#463c5c', s: '#f1cfb0', e: '#2a2230', m: '#d9708f', d: '#f4a6c3', D: '#e58aad', y: '#f6d98a', w: '#fff', b: '#e79ab5' },
    enemy: { w: '#ffffff', b: '#bcd0ee', k: '#2a2a3a', o: '#f5a25d' },
    heart: { r: '#f06292' },
  };
  let PF_SPR = null;
  const pfSprites = () => PF_SPR || (PF_SPR = {
    patA: pfSprite(PF_ART.patA, PF_PAL.pat), patB: pfSprite(PF_ART.patB, PF_PAL.pat), patJ: pfSprite(PF_ART.patJ, PF_PAL.pat),
    princess: pfSprite(PF_ART.princess, PF_PAL.princess), enemy: pfSprite(PF_ART.enemy, PF_PAL.enemy), heart: pfSprite(PF_ART.heart, PF_PAL.heart),
  });

  // 0 aire · 1 suelo · 2 bloque/plataforma · 3 pinchos de hielo
  function buildPlatformLevel() {
    const COLS = 150, ROWS = 11, T = PF_T;
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    const pits = [[19, 20], [36, 38], [56, 58], [92, 94], [108, 110], [124, 125]];
    const inPit = (c) => pits.some(([a, b]) => c >= a && c <= b);
    for (let c = 0; c < COLS; c++) if (!inPit(c)) { t[9][c] = 1; t[10][c] = 1; }
    [13, 27, 28, 44, 64, 78, 79, 100, 116, 130, 131].forEach((c) => { t[8][c] = 3; });
    [[47, 2], [84, 2], [120, 2], [142, 1]].forEach(([c, hh]) => { for (let i = 0; i < hh; i++) t[8 - i][c] = 2; });
    const plats = [[3, 6, 6], [68, 71, 6]]; // solo en tramos sin obstáculos (si no, la cabeza choca al saltar)
    plats.forEach(([a, b, r]) => { for (let c = a; c <= b; c++) t[r][c] = 2; });
    const hearts = [];
    plats.forEach(([a, b]) => { for (let c = a; c <= b; c += 2) hearts.push({ x: c * T + 4, y: 4 * T + 8, got: false }); });
    [[13, 13], [27, 28], [44, 44], [64, 64], [78, 79], [100, 100], [116, 116], [130, 131]].forEach(([a, b]) => { const m = (a + b) / 2; hearts.push({ x: m * T + 4, y: 5 * T + 6, got: false }); });
    pits.forEach(([a, b]) => { const m = Math.floor((a + b) / 2); hearts.push({ x: (a - 1) * T + 4, y: 7 * T, got: false }, { x: m * T + 4, y: 6 * T, got: false }, { x: (b + 1) * T + 4, y: 7 * T, got: false }); });
    const enemies = [17, 41, 61, 82, 104, 118, 128, 140].map((c) => ({ x0: c * T, x: c * T, y: 9 * T - 10, w: 12, h: 10, vx: -0.5, alive: true, squash: 0 }));
    return { cols: COLS, rows: ROWS, t, hearts, enemies, cps: [72 * T, 106 * T], princess: { x: 146 * T, y: 9 * T - 16 }, pits };
  }

  /* ---------- media navideña gigante ---------- */
  const STOCKING_SVG = `<svg viewBox="20 -96 240 426" role="img" aria-label="Una enorme media navideña llena de dulces">
    <defs>
      <linearGradient id="stRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6a3b5"/><stop offset=".55" stop-color="#ee7f98"/><stop offset="1" stop-color="#dd6384"/></linearGradient>
      <linearGradient id="stShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#7a1e44" stop-opacity="0"/><stop offset="1" stop-color="#7a1e44" stop-opacity=".22"/></linearGradient>
      <linearGradient id="stCuff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e6edfa"/></linearGradient>
      <pattern id="stKnit" width="7" height="8" patternUnits="userSpaceOnUse"><path d="M0.5 1 L3.5 7 L6.5 1" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".16"/></pattern>
      <pattern id="stRib" width="5" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#fff6ea"/><path d="M2.5 0 V10" stroke="#e6d2b9" stroke-width="1.7"/></pattern>
      <clipPath id="stClip"><path d="M70 60 L180 60 L180 185 C180 205 196 215 214 224 C238 236 248 262 236 284 C224 306 196 310 168 298 C132 284 100 262 82 232 C72 214 70 196 70 180 Z"/></clipPath>
    </defs>
    <!-- lazo para colgar -->
    <path d="M186 54 C192 8 236 8 228 44 C225 58 210 62 200 60" fill="none" stroke="#b84462" stroke-width="10" stroke-linecap="round"/>
    <path d="M186 54 C192 8 236 8 228 44 C225 58 210 62 200 60" fill="none" stroke="#ef8099" stroke-width="6" stroke-linecap="round"/>
    <!-- cuerpo -->
    <path class="st-body" d="M70 60 L180 60 L180 185 C180 205 196 215 214 224 C238 236 248 262 236 284 C224 306 196 310 168 298 C132 284 100 262 82 232 C72 214 70 196 70 180 Z" fill="url(#stRed)" stroke="#c4506f" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#stClip)">
      <rect x="60" y="50" width="200" height="270" fill="url(#stKnit)"/>
      <!-- franja nórdica -->
      <path d="M64 98 L71 93 L78 98 L85 93 L92 98 L99 93 L106 98 L113 93 L120 98 L127 93 L134 98 L141 93 L148 98 L155 93 L162 98 L169 93 L176 98 L183 93 L190 98" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" opacity=".95"/>
      <path d="M64 142 L71 147 L78 142 L85 147 L92 142 L99 147 L106 142 L113 147 L120 142 L127 147 L134 142 L141 147 L148 142 L155 147 L162 142 L169 147 L176 142 L183 147 L190 142" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" opacity=".95"/>
      <g fill="#fff" opacity=".95"><path d="M72 118 L80 106 L88 118 L80 130Z"/><path d="M94 118 L102 106 L110 118 L102 130Z"/><path d="M116 118 L124 106 L132 118 L124 130Z"/><path d="M138 118 L146 106 L154 118 L146 130Z"/><path d="M160 118 L168 106 L176 118 L168 130Z"/></g>
      <g fill="#cfeadc"><circle cx="91" cy="118" r="2.2"/><circle cx="113" cy="118" r="2.2"/><circle cx="135" cy="118" r="2.2"/><circle cx="157" cy="118" r="2.2"/></g>
      <path d="M64 150 H190 M64 156 H190" stroke="#fff" stroke-width="2.4" stroke-dasharray="5 4" stroke-linecap="round" opacity=".85"/>
      <path d="M90.0 176.0 L102.0 176.0 M93.0 170.8 L99.0 181.2 M99.0 170.8 L93.0 181.2 M145.0 166.0 L155.0 166.0 M147.5 161.7 L152.5 170.3 M152.5 161.7 L147.5 170.3 M119.0 190.0 L129.0 190.0 M121.5 185.7 L126.5 194.3 M126.5 185.7 L121.5 194.3 " stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".9"/>
      <!-- talón y puntera reforzados (lana crema acanalada) -->
      <path d="M70 182 Q96 190 102 216 C108 238 120 252 140 266 C152 276 164 282 178 290 C184 294 188 300 191 310 L191 340 L40 340 L40 176 Z" fill="url(#stRib)"/>
      <path d="M70 182 Q96 190 102 216 C108 238 120 252 140 266 C152 276 164 282 178 290 C184 294 188 300 191 310" fill="none" stroke="#e7a9b8" stroke-width="5" stroke-linecap="round"/>
      <path d="M70 182 Q96 190 102 216 C108 238 120 252 140 266 C152 276 164 282 178 290 C184 294 188 300 191 310" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>
      <path d="M210 214 C200 244 200 276 194 318 L290 318 L290 200 Z" fill="url(#stRib)"/>
      <path d="M210 214 C200 244 200 276 194 318" fill="none" stroke="#e7a9b8" stroke-width="5" stroke-linecap="round"/>
      <path d="M210 214 C200 244 200 276 194 318" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>
      <!-- sombra bajo el puño -->
      <rect x="60" y="76" width="130" height="14" fill="#8a2447" opacity=".22"/>
      <path d="M70 60 L180 60 L180 185 C180 205 196 215 214 224 C238 236 248 262 236 284 C224 306 196 310 168 298 C132 284 100 262 82 232 C72 214 70 196 70 180 Z" fill="url(#stShade)"/>
    </g>
    <path d="M70 60 L180 60 L180 185 C180 205 196 215 214 224 C238 236 248 262 236 284 C224 306 196 310 168 298 C132 284 100 262 82 232 C72 214 70 196 70 180 Z" fill="none" stroke="#c4506f" stroke-width="3" stroke-linejoin="round"/>
    <path d="M78 236 C98 266 134 288 168 298" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".3"/>
    <!-- dulces que asoman -->
    <g class="st-candy"><g transform="translate(0 -16)">
      <g transform="translate(128 36)"><rect x="-19" y="-32" width="38" height="34" rx="4" fill="#cfe3f7" stroke="#a9c8ee" stroke-width="2"/><rect x="-4" y="-32" width="8" height="34" fill="#f4b6cb"/><rect x="-19" y="-18" width="38" height="8" fill="#f4b6cb"/><ellipse cx="-8" cy="-36" rx="9" ry="5.5" transform="rotate(-20 -8 -36)" fill="#f9cfe0" stroke="#e58aad" stroke-width="1.8"/><ellipse cx="8" cy="-36" rx="9" ry="5.5" transform="rotate(20 8 -36)" fill="#f9cfe0" stroke="#e58aad" stroke-width="1.8"/><circle cx="0" cy="-34" r="3.5" fill="#e58aad"/></g>
      <g transform="translate(150 54) rotate(14)"><line x1="0" y1="0" x2="0" y2="-34" stroke="#e8d6a4" stroke-width="4.5" stroke-linecap="round"/><circle cx="0" cy="-54" r="22" fill="#fff" stroke="#c9b9ee" stroke-width="2.5"/><path d="M0 -54 m0 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0" fill="none" stroke="#e58aad" stroke-width="3.6" stroke-linecap="round"/><path d="M-14 -66 Q-8 -72 0 -74" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></g>
      <g transform="translate(98 54) rotate(-14) scale(.85)"><line x1="0" y1="0" x2="0" y2="-34" stroke="#e8d6a4" stroke-width="4.5" stroke-linecap="round"/><circle cx="0" cy="-54" r="22" fill="#dbe7f8" stroke="#a9c8ee" stroke-width="2.5"/><path d="M0 -54 m0 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/></g>
      <g transform="translate(78 58)"><path d="M0 0 L0 -52 Q0 -78 24 -78 Q48 -78 48 -54" fill="none" stroke="#e3a3b4" stroke-width="15" stroke-linecap="round"/><path d="M0 0 L0 -52 Q0 -78 24 -78 Q48 -78 48 -54" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/><path d="M0 0 L0 -52 Q0 -78 24 -78 Q48 -78 48 -54" fill="none" stroke="#ec6a83" stroke-width="11" stroke-linecap="butt" stroke-dasharray="7 8"/></g>
      <g transform="translate(178 58) scale(-.9 .9)"><path d="M0 0 L0 -52 Q0 -78 24 -78 Q48 -78 48 -54" fill="none" stroke="#a9d8c4" stroke-width="15" stroke-linecap="round"/><path d="M0 0 L0 -52 Q0 -78 24 -78 Q48 -78 48 -54" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/><path d="M0 0 L0 -52 Q0 -78 24 -78 Q48 -78 48 -54" fill="none" stroke="#7fc0a4" stroke-width="11" stroke-linecap="butt" stroke-dasharray="7 8"/></g>
      <g transform="translate(120 52) rotate(-6)"><rect x="-27" y="-36" width="54" height="40" rx="5" fill="#94624a" stroke="#74482f" stroke-width="2"/><path d="M-9 -36 V4 M9 -36 V4 M-27 -23 H27 M-27 -10 H27" stroke="#74482f" stroke-width="2"/><path d="M-26 -6 L-20 -12 L-14 -6 L-8 -12 L-2 -6 L4 -12 L10 -6 L16 -12 L22 -6 L26 -10 V4 H-26Z" fill="#f1d98a" stroke="#d9bd62" stroke-width="1.5" stroke-linejoin="round"/><circle cx="-18" cy="-28" r="1.6" fill="#b88566"/><circle cx="0" cy="-28" r="1.6" fill="#b88566"/></g>
      <g transform="translate(96 44) rotate(-12)"><circle cx="0" cy="-16" r="8" fill="#dca466" stroke="#b8803f" stroke-width="1.6"/><path d="M-17 -6 H17" stroke="#dca466" stroke-width="8" stroke-linecap="round"/><ellipse cx="0" cy="0" rx="9" ry="11" fill="#dca466" stroke="#b8803f" stroke-width="1.6"/><path d="M-5 9 L-8 20 M5 9 L8 20" stroke="#dca466" stroke-width="7" stroke-linecap="round"/><circle cx="-3" cy="-17" r="1.3" fill="#6b3f22"/><circle cx="3" cy="-17" r="1.3" fill="#6b3f22"/><path d="M-3 -13 Q0 -11 3 -13" fill="none" stroke="#6b3f22" stroke-width="1.2" stroke-linecap="round"/><circle cx="0" cy="-3" r="1.8" fill="#fff"/><circle cx="0" cy="3" r="1.8" fill="#f4b6cb"/><path d="M-12 -6 q-2 0 -4 0 M12 -6 q2 0 4 0" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/></g>
      <g transform="translate(58 42) rotate(-20)"><ellipse rx="15" ry="10" fill="#d3efe4" stroke="#8fcab0" stroke-width="2"/><path d="M-15 0 L-29 -10 L-29 10 Z M15 0 L29 -10 L29 10 Z" fill="#a9d8c4" stroke="#8fcab0" stroke-width="1.5" stroke-linejoin="round"/><path d="M-6 -9 L-2 9 M3 -9 L7 9" stroke="#fff" stroke-width="2.4" opacity=".8"/></g>
      <g transform="translate(196 46) rotate(18)"><ellipse rx="15" ry="10" fill="#fde4d2" stroke="#f2b98a" stroke-width="2"/><path d="M-15 0 L-29 -10 L-29 10 Z M15 0 L29 -10 L29 10 Z" fill="#f9cfae" stroke="#f2b98a" stroke-width="1.5" stroke-linejoin="round"/><path d="M-6 -9 L-2 9 M3 -9 L7 9" stroke="#fff" stroke-width="2.4" opacity=".8"/></g>
      <circle cx="108" cy="22" r="11" fill="#f8d3df" stroke="#e58aad" stroke-width="2"/><circle cx="105" cy="19" r="2.4" fill="#fff"/>
      <circle cx="138" cy="16" r="10" fill="#fbefc6" stroke="#f1d98a" stroke-width="2"/><circle cx="135" cy="13" r="2.2" fill="#fff"/>
      <polygon transform="translate(168 14)" points="0,-12 3.5,-4 12,-3.5 5.5,2 7.5,10 0,5.5 -7.5,10 -5.5,2 -12,-3.5 -3.5,-4" fill="#fbe3a5" stroke="#f1d98a" stroke-width="2" stroke-linejoin="round"/>
    </g></g>
    <!-- puño de lana -->
    <g>
      <rect x="52" y="38" width="148" height="44" rx="22" fill="url(#stCuff)" stroke="#d3dff3" stroke-width="3"/>
      <circle cx="72" cy="42" r="12" fill="#fff"/><circle cx="102" cy="37" r="12" fill="#fff"/><circle cx="132" cy="37" r="12" fill="#fff"/><circle cx="162" cy="42" r="12" fill="#fff"/><circle cx="184" cy="50" r="10" fill="#fff"/>
      <circle cx="72" cy="78" r="12" fill="#fff"/><circle cx="102" cy="83" r="12" fill="#fff"/><circle cx="132" cy="83" r="12" fill="#fff"/><circle cx="162" cy="78" r="12" fill="#fff"/>
      <rect x="60" y="43" width="132" height="34" rx="17" fill="#fff"/>
      <path d="M62 70 Q126 84 190 70" fill="none" stroke="#e3ebf8" stroke-width="5" stroke-linecap="round" opacity=".8"/>
      <!-- acebo y campanita -->
      <g transform="translate(78 62)"><ellipse cx="-9" cy="2" rx="11" ry="5" transform="rotate(-28 -9 2)" fill="#a9d8c4" stroke="#7fc0a4" stroke-width="1.6"/><ellipse cx="9" cy="2" rx="11" ry="5" transform="rotate(28 9 2)" fill="#a9d8c4" stroke="#7fc0a4" stroke-width="1.6"/><circle cx="-3" cy="-2" r="4" fill="#e8566f"/><circle cx="4" cy="-3" r="4" fill="#e8566f"/><circle cx="0" cy="4" r="4" fill="#e8566f"/><circle cx="-4" cy="-3.4" r="1.1" fill="#fff"/><circle cx="3" cy="-4.4" r="1.1" fill="#fff"/></g>
      <g transform="translate(170 64)"><path d="M0 -10 Q-12 -10 -12 4 L12 4 Q12 -10 0 -10Z" fill="#f1d98a" stroke="#d9bd62" stroke-width="2"/><path d="M-13 4 H13" stroke="#d9bd62" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="8" r="3" fill="#d9bd62"/><circle cx="-4" cy="-4" r="2" fill="#fff" opacity=".8"/></g>
    </g>
  </svg>`;

  const RENDER = {
    message(data, box) {
      if (data.image) box.append(imageNode(data.image));
      paragraphs(data.text, box);
    },
    photo(data, box) {
      box.append(imageNode(data.image));
      paragraphs(data.text, box);
    },
    song(data, box) {
      if (data.embed === true) { // reproductor incrustado (opcional): embed: true
        box.append(embedNode(data.url, 'una canción (Spotify o YouTube)'));
        paragraphs(data.text, box);
        return;
      }
      linkCard(data, box, { icon: '🎵', placeholder: 'el botón de la canción' });
    },
    video(data, box) {
      if (data.video) { // archivo propio (.mp4)
        box.append(h('video', { src: data.video, controls: '', playsinline: '', preload: 'metadata' }));
        paragraphs(data.text, box);
      } else if (data.embed === true) { // reproductor incrustado (opcional): embed: true
        box.append(embedNode(data.url, 'un vídeo (archivo .mp4 o enlace de YouTube)'));
        paragraphs(data.text, box);
      } else {
        linkCard(data, box, { icon: '🎬', placeholder: 'el botón del vídeo', video: true, label: 'Ver vídeo' });
      }
    },
    /* ---------- MINI JUEGO DE PLATAFORMAS (pixel art) ---------- */
    platformer(data, box) {
      const d = data.day, T = PF_T, VW = PF_VW, VH = PF_VH, HW = 10, HH = 15;
      const hero = fill(data.heroName || 'Pat');
      const winText = fill(data.winMessage || `Ayudaste a ${hero} a encontrar el camino de regreso hacia su princesa`);
      paragraphs(data.text, box);
      const L = buildPlatformLevel();
      const SP = pfSprites();
      const wrap = h('div', { class: 'pf', tabindex: '-1' });
      const cv = h('canvas', { class: 'pf-cv', width: VW, height: VH, role: 'img', 'aria-label': 'Mini juego de plataformas' });
      const ctx = cv.getContext('2d');
      const overlay = h('div', { class: 'pf-overlay' });
      const mk = (k, label, aria) => h('button', { class: `pf-btn pf-${k}`, type: 'button', 'data-k': k, 'aria-label': aria, text: label });
      const controls = h('div', { class: 'pf-pad' }, h('div', { class: 'pf-dir' }, mk('left', '◀', 'Izquierda'), mk('right', '▶', 'Derecha')), mk('jump', '⤒ Saltar', 'Saltar'));
      const rewardHolder = h('div');
      wrap.append(h('div', { class: 'pf-screen' }, cv, overlay), controls, h('p', { class: 'small pf-tip', text: 'Pisa a los muñecos de nieve para vencerlos · evita los pinchos y los huecos' }), rewardHolder);
      box.append(wrap);

      const solid = (c, r) => (c < 0 || c >= L.cols ? true : r < 0 || r >= L.rows ? false : L.t[r][c] === 1 || L.t[r][c] === 2);
      const blocks = (c, r) => (c < 0 || c >= L.cols ? true : r < 0 || r >= L.rows ? false : L.t[r][c] !== 0);
      let S = null;
      const fresh = () => {
        L.enemies.forEach((e) => { e.x = e.x0; e.vx = -0.5; e.alive = true; e.squash = 0; });
        L.hearts.forEach((hr) => { hr.got = false; });
        return { x: 2 * T, y: 9 * T - HH, vx: 0, vy: 0, onGround: false, face: 1, frame: 0, coy: 0, buf: 0, inv: 0, cx: 2 * T, cy: 9 * T - HH, hearts: 0, attempts: 0, won: false };
      };
      const die = () => { S.attempts++; S.x = S.cx; S.y = S.cy; S.vx = 0; S.vy = 0; S.inv = 90; };
      const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

      const step = (inp) => {
        if (S.won) return;
        S.frame++;
        if (S.inv > 0) S.inv--;
        const acc = S.onGround ? 0.22 : 0.14, MAXV = 1.8;
        if (inp.left && !inp.right) { S.vx -= acc; S.face = -1; }
        else if (inp.right && !inp.left) { S.vx += acc; S.face = 1; }
        else S.vx *= S.onGround ? 0.78 : 0.97;
        if (Math.abs(S.vx) < 0.02) S.vx = 0;
        S.vx = Math.max(-MAXV, Math.min(MAXV, S.vx));
        if (inp.pressed) S.buf = 7;
        S.coy = S.onGround ? 6 : S.coy - 1;
        if (S.buf > 0) S.buf--;
        if (S.buf > 0 && S.coy > 0) { S.vy = -7.4; S.buf = 0; S.coy = 0; S.onGround = false; }
        if (!inp.jump && S.vy < -2.8) S.vy = -2.8; // soltar el salto = salto más corto
        S.vy = Math.min(8, S.vy + 0.42);
        // movimiento horizontal
        S.x += S.vx;
        let c0 = Math.floor(S.x / T), c1 = Math.floor((S.x + HW - 0.01) / T), r0 = Math.floor(S.y / T), r1 = Math.floor((S.y + HH - 0.01) / T);
        for (let r = r0; r <= r1; r++) {
          if (S.vx > 0 && solid(c1, r)) { S.x = c1 * T - HW; S.vx = 0; break; }
          if (S.vx < 0 && solid(c0, r)) { S.x = (c0 + 1) * T; S.vx = 0; break; }
        }
        // movimiento vertical
        S.y += S.vy;
        c0 = Math.floor(S.x / T); c1 = Math.floor((S.x + HW - 0.01) / T); r0 = Math.floor(S.y / T); r1 = Math.floor((S.y + HH - 0.01) / T);
        S.onGround = false;
        for (let c = c0; c <= c1; c++) {
          if (S.vy > 0 && solid(c, r1)) { S.y = r1 * T - HH; S.vy = 0; S.onGround = true; break; }
          if (S.vy < 0 && solid(c, r0)) { S.y = (r0 + 1) * T; S.vy = 0; break; }
        }
        if (S.y > VH + 24) { die(); return; }
        // pinchos
        if (S.inv === 0) {
          c0 = Math.floor(S.x / T); c1 = Math.floor((S.x + HW - 0.01) / T); r0 = Math.floor(S.y / T); r1 = Math.floor((S.y + HH - 0.01) / T);
          for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
            if (r >= 0 && r < L.rows && c >= 0 && c < L.cols && L.t[r][c] === 3 && overlap(S.x, S.y, HW, HH, c * T + 3, r * T + 7, 10, 9)) { die(); return; }
          }
        }
        // muñecos de nieve
        for (const e of L.enemies) {
          if (!e.alive) { if (e.squash < 30) e.squash++; continue; }
          const nx = e.x + e.vx, front = e.vx > 0 ? nx + e.w : nx, fc = Math.floor(front / T);
          const wall = blocks(fc, Math.floor((e.y + e.h / 2) / T)), floor = blocks(fc, Math.floor((e.y + e.h + 1) / T));
          if (wall || !floor) e.vx = -e.vx; else e.x = nx;
          if (overlap(S.x, S.y, HW, HH, e.x, e.y, e.w, e.h)) {
            if (S.vy > 0 && S.y + HH - S.vy <= e.y + 5) { e.alive = false; S.vy = -5.2; S.onGround = false; }
            else if (S.inv === 0) { die(); return; }
          }
        }
        // corazones, puntos de control y princesa
        for (const hr of L.hearts) if (!hr.got && overlap(S.x - 2, S.y - 2, HW + 4, HH + 4, hr.x, hr.y, 7, 6)) { hr.got = true; S.hearts++; }
        for (const cp of L.cps) if (cp > S.cx && S.x + HW / 2 >= cp) { S.cx = cp; S.cy = 9 * T - HH; }
        if (overlap(S.x, S.y, HW, HH, L.princess.x + 2, L.princess.y + 2, 8, 14)) S.won = true;
      };

      /* ---- dibujo ---- */
      const sky = ctx.createLinearGradient(0, 0, 0, VH);
      sky.addColorStop(0, '#cddff4'); sky.addColorStop(1, '#f9e8ef');
      const flakes = Array.from({ length: 34 }, (_, i) => ({ x: (i * 97) % VW, y: (i * 53) % VH, s: 0.3 + ((i * 7) % 5) * 0.12, r: i % 4 === 0 ? 2 : 1 }));
      const spr = (img, x, y, flip) => {
        if (flip) { ctx.save(); ctx.translate(Math.round(x) + img.width, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
        else ctx.drawImage(img, Math.round(x), Math.round(y));
      };
      const draw = () => {
        ctx.imageSmoothingEnabled = false;
        const camX = Math.round(Math.max(0, Math.min(L.cols * T - VW, S.x - VW / 2 + 30)));
        ctx.fillStyle = sky; ctx.fillRect(0, 0, VW, VH);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        for (let i = -1; i < 6; i++) { const bx = i * 110 - ((camX * 0.3) % 110); ctx.beginPath(); ctx.moveTo(bx, 144); ctx.lineTo(bx + 55, 70 + (((i + 9) * 37) % 3) * 9); ctx.lineTo(bx + 110, 144); ctx.fill(); }
        ctx.fillStyle = '#fff';
        flakes.forEach((f) => { const fx = (((f.x - camX * 0.4 + S.frame * f.s * 0.3) % VW) + VW) % VW, fy = (f.y + S.frame * f.s) % VH; ctx.fillRect(Math.floor(fx), Math.floor(fy), f.r, f.r); });
        const first = Math.floor(camX / T), last = Math.floor((camX + VW) / T);
        for (let c = first; c <= last; c++) for (let r = 0; r < L.rows; r++) {
          const v = c >= 0 && c < L.cols ? L.t[r][c] : 0;
          if (!v) continue;
          const x = c * T - camX, y = r * T;
          if (v === 1) {
            ctx.fillStyle = '#dbe6f8'; ctx.fillRect(x, y, T, T);
            ctx.fillStyle = '#c3d3ee'; ctx.fillRect(x + 3, y + 8, 2, 2); ctx.fillRect(x + 10, y + 12, 2, 2);
            if (!solid(c, r - 1)) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, T, 4); ctx.fillStyle = '#eef3fc'; ctx.fillRect(x, y + 4, T, 1); }
          } else if (v === 2) {
            ctx.fillStyle = '#bfe3f7'; ctx.fillRect(x, y, T, T);
            ctx.fillStyle = '#8fc3e3'; ctx.fillRect(x, y + T - 2, T, 2); ctx.fillRect(x + T - 2, y, 2, T);
            ctx.fillStyle = '#e9f6fd'; ctx.fillRect(x + 2, y + 2, 5, 2); ctx.fillRect(x + 2, y + 2, 2, 5);
            if (!solid(c, r - 1)) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, T, 3); }
          } else if (v === 3) {
            ctx.fillStyle = '#eaf5ff'; ctx.strokeStyle = '#8fb8dc'; ctx.lineWidth = 1;
            for (let k = 0; k < 2; k++) { const bx = x + 1 + k * 7; ctx.beginPath(); ctx.moveTo(bx, y + T); ctx.lineTo(bx + 3.5, y + 5); ctx.lineTo(bx + 7, y + T); ctx.closePath(); ctx.fill(); ctx.stroke(); }
          }
        }
        L.cps.forEach((cp) => {
          const x = cp - camX + 4, y = 9 * T - 22;
          ctx.fillStyle = '#8a93b3'; ctx.fillRect(x, y, 2, 22);
          ctx.fillStyle = S.cx >= cp ? '#f06292' : '#b6bdd6';
          ctx.beginPath(); ctx.moveTo(x + 2, y + 1); ctx.lineTo(x + 12, y + 5); ctx.lineTo(x + 2, y + 9); ctx.fill();
        });
        const bob = Math.round(Math.sin(S.frame / 12) * 1.5);
        L.hearts.forEach((hr) => { if (!hr.got) ctx.drawImage(SP.heart, Math.round(hr.x - camX), Math.round(hr.y + bob)); });
        L.enemies.forEach((e) => {
          if (e.alive) spr(SP.enemy, e.x - camX, e.y, e.vx > 0);
          else if (e.squash < 24) { ctx.drawImage(SP.enemy, 0, 0, 12, 10, Math.round(e.x - camX), Math.round(e.y + 7), 12, 3); }
        });
        // árbol y princesa
        const tx = L.princess.x + 34 - camX;
        ctx.fillStyle = '#d8c7c4'; ctx.fillRect(tx + 9, 9 * T - 6, 4, 6);
        ctx.fillStyle = '#8fcfb0'; [[8, 40, 6], [6, 34, 10], [4, 27, 14], [2, 20, 18], [0, 13, 22]].forEach(([o, y, w]) => { ctx.fillRect(tx + o, 9 * T - y, w, 8); });
        ctx.fillStyle = '#fff'; ctx.fillRect(tx + 8, 9 * T - 40, 6, 2); ctx.fillRect(tx + 4, 9 * T - 27, 4, 2); ctx.fillRect(tx + 13, 9 * T - 20, 4, 2);
        ctx.fillStyle = '#f4b6cb'; ctx.fillRect(tx + 8, 9 * T - 31, 2, 2); ctx.fillRect(tx + 12, 9 * T - 24, 2, 2); ctx.fillRect(tx + 5, 9 * T - 17, 2, 2); ctx.fillRect(tx + 15, 9 * T - 15, 2, 2);
        ctx.fillStyle = '#fbe3a5'; ctx.fillRect(tx + 9, 9 * T - 45, 4, 5);
        spr(SP.princess, L.princess.x - camX, L.princess.y);
        ctx.drawImage(SP.heart, Math.round(L.princess.x - camX + 2), Math.round(L.princess.y - 12 + Math.sin(S.frame / 8) * 2));
        // Pat
        if (!(S.inv > 0 && Math.floor(S.frame / 4) % 2 === 0)) {
          const walking = S.onGround && Math.abs(S.vx) > 0.3;
          const img = !S.onGround ? SP.patJ : walking && Math.floor(S.frame / 7) % 2 ? SP.patB : SP.patA;
          spr(img, S.x - 1 - camX, S.y - 1, S.face < 0);
        }
        // marcador
        ctx.font = 'bold 10px monospace'; ctx.textBaseline = 'top';
        const txt = `♥ ${S.hearts}/${L.hearts.length}`;
        ctx.fillStyle = '#fff'; ctx.fillText(txt, 7, 7); ctx.fillText(txt, 9, 9);
        ctx.fillStyle = '#56608a'; ctx.fillText(txt, 8, 8);
      };

      /* ---- entrada: teclado, botones táctiles y toque en la pantalla ---- */
      const keys = { left: false, right: false, jump: false }, touch = { left: false, right: false, jump: false };
      let pressed = false;
      const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump' };
      wrap.addEventListener('keydown', (e) => {
        const k = KEYMAP[e.code]; if (!k) return;
        e.preventDefault();
        if (k === 'jump' && !keys.jump && !e.repeat) pressed = true;
        keys[k] = true;
      });
      wrap.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) { e.preventDefault(); keys[k] = false; } });
      controls.querySelectorAll('.pf-btn').forEach((b) => {
        const k = b.dataset.k;
        const on = (e) => { e.preventDefault(); touch[k] = true; if (k === 'jump') pressed = true; try { b.setPointerCapture(e.pointerId); } catch (_) {} };
        const off = () => { touch[k] = false; };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
        b.addEventListener('contextmenu', (e) => e.preventDefault());
      });
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); pressed = true; touch.jump = true; });
      cv.addEventListener('pointerup', () => { touch.jump = false; });
      cv.addEventListener('pointercancel', () => { touch.jump = false; });
      const readInput = () => { const i = { left: keys.left || touch.left, right: keys.right || touch.right, jump: keys.jump || touch.jump, pressed }; pressed = false; return i; };

      /* ---- ciclo del juego ---- */
      let running = false, raf = 0, lastT = 0, accT = 0;
      const loop = (t) => {
        if (!cv.isConnected) { running = false; return; }
        if (!lastT) lastT = t;
        const dt = t - lastT; lastT = t;
        accT += dt > 0 ? Math.min(100, dt) : 16.667; // si el navegador no avanza el reloj, cuenta un fotograma
        while (accT >= 16.667 && !S.won) { step(readInput()); accT -= 16.667; }
        draw();
        if (S.won) { running = false; win(); return; }
        if (running) raf = requestAnimationFrame(loop);
      };
      const showStart = (again) => {
        overlay.replaceChildren(
          h('p', { class: 'pf-big', text: again ? `¡${hero} ya encontró a su princesa!` : `Ayuda a ${hero}` }),
          h('p', { text: again ? winText : `${hero} quiere llegar hasta su princesa. Muévete con ◀ ▶ y salta con “Saltar” (o toca la pantalla).` }));
        const go = h('button', { class: 'btn', type: 'button', text: again ? 'Jugar otra vez' : '¡A jugar!' });
        go.addEventListener('click', start);
        overlay.append(go);
        overlay.classList.remove('off');
      };
      const win = () => {
        state.solved[d] = true; save();
        overlay.replaceChildren(
          h('p', { class: 'pf-big', text: '¡Lo lograste! 💗' }),
          h('p', { class: 'pf-win', text: winText }),
          h('p', { class: 'small', text: `Corazones: ${S.hearts} de ${L.hearts.length} · Intentos: ${S.attempts + 1}` }));
        const again = h('button', { class: 'btn', type: 'button', text: 'Jugar otra vez' });
        again.addEventListener('click', start);
        overlay.append(again);
        overlay.classList.remove('off');
        if (data.reward || data.rewardImage) rewardHolder.replaceChildren(makeReward(data, '💗'));
        confetti(1.8);
      };
      function start() {
        cancelAnimationFrame(raf);
        S = fresh(); lastT = 0; accT = 0; running = true;
        keys.left = keys.right = keys.jump = false; touch.left = touch.right = touch.jump = false;
        overlay.classList.add('off');
        wrap.focus({ preventScroll: true });
        raf = requestAnimationFrame(loop);
      }
      S = fresh(); draw();
      showStart(!!state.solved[d]);
      if (TEST) wrap.__pat = { get S() { return S; }, step, L, fresh: () => { S = fresh(); }, solid, T, HW, HH };
    },

    /* ---------- LIBRO QUE SE ABRE ---------- */
    book(data, box) {
      const d = data.day;
      const quote = fill(data.quote || '').trim();
      if (!quote) { box.append(missing('Escribe la frase en el campo quote de content.js')); return; }
      const title = fill(data.bookTitle || '').trim(), author = fill(data.author || '').trim();
      paragraphs(data.text, box);
      const len = quote.length;
      const fs = len <= 60 ? 1.15 : len <= 110 ? 1.0 : len <= 170 ? 0.88 : 0.78;
      const cover = h('span', { class: 'bk-face bk-out' });
      if (data.cover) {
        cover.style.backgroundImage = `url("${String(data.cover).replace(/"/g, '%22')}")`;
        cover.classList.add('has-img');
      } else {
        cover.append(h('span', { class: 'bk-ctitle', text: title || 'Mi libro' }), h('span', { class: 'bk-cdeco', text: '✦' }), author && h('span', { class: 'bk-cauthor', text: author }));
      }
      const inner = h('span', { class: 'bk-face bk-in' },
        title && h('span', { class: 'bk-ititle', text: title }), (title || author) && h('span', { class: 'bk-iline' }), author && h('span', { class: 'bk-iauthor', text: author }));
      const page = h('span', { class: 'bk-page' },
        h('span', { class: 'bk-quote', style: `font-size:${fs}rem`, text: data.noQuotes ? quote : `“${quote}”` }),
        (title || author) && h('span', { class: 'bk-ref' }, author && h('b', { text: author }), title && h('i', { text: title })));
      const book = h('div', { class: 'bk-book', role: 'button', tabindex: '0', 'aria-expanded': 'false', 'aria-label': 'Abrir el libro' }, page, h('span', { class: 'bk-front' }, cover, inner));
      const hint = h('p', { class: 'small bk-hint', text: 'Toca el libro para abrirlo' });
      const toggle = () => {
        const open = book.classList.toggle('open');
        book.setAttribute('aria-expanded', String(open));
        hint.textContent = open ? 'Toca otra vez para cerrarlo' : 'Toca el libro para abrirlo';
        if (open) { state.solved[d] = true; save(); confetti(0.6); }
      };
      book.addEventListener('click', toggle);
      book.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      box.append(h('div', { class: 'bk-stage' }, book), hint);
    },

    /* ---------- MEDIA NAVIDEÑA QUE EXPLOTA DE DULCES ---------- */
    stocking(data, box) {
      const d = data.day;
      const msg = fill(data.message || 'Te mereces toda la dulzura que existe en este universo y por eso seré cursi contigo todos los días de mi vida.');
      paragraphs(data.text, box);
      const stage = h('div', { class: 'st-stage' });
      const sock = h('div', { class: 'st-sock', role: 'button', tabindex: '0', 'aria-label': 'Tocar la media navideña' });
      sock.innerHTML = STOCKING_SVG;
      const cv = h('canvas', { class: 'st-cv' });
      stage.append(sock, cv);
      const hint = h('p', { class: 'small st-hint', text: 'Toca la media 🎁' });
      const holder = h('div', { class: 'st-msg-wrap' });
      const cx3 = cv.getContext('2d');
      let exploded = false, raf = 0;

      const showMsg = (animate) => {
        const refill = h('button', { class: 'link-btn', type: 'button', text: 'Volver a llenar la media' });
        refill.addEventListener('click', () => { exploded = false; sock.classList.remove('empty'); hint.textContent = 'Toca la media 🎁'; });
        holder.replaceChildren(h('div', { class: `st-msg${animate ? ' fresh' : ''}` }, h('p', { class: 'st-text', text: msg }), refill));
        hint.textContent = '';
      };
      const burst = () => {
        const sr = stage.getBoundingClientRect();
        if (!sr.width || reduceMotion) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2), Wd = sr.width, Hd = sr.height;
        cv.width = Wd * dpr; cv.height = Hd * dpr;
        cx3.setTransform(dpr, 0, 0, dpr, 0, 0);
        const cr = sock.querySelector('.st-candy').getBoundingClientRect();
        const ox = cr.left + cr.width / 2 - sr.left, oy = cr.top + cr.height * 0.55 - sr.top;
        const EMO = ['🍬', '🍫', '🍭', '🍪', '🍩', '🧁', '🍡', '🍰', '🍬', '🍭'];
        const COL = ['#f4b6cb', '#a9d8c4', '#c9b9ee', '#f9cfae', '#a9c8ee', '#f6df98', '#fff'];
        const ps = Array.from({ length: 80 }, (_, i) => {
          const a = (-165 + Math.random() * 150) * (Math.PI / 180), sp = 5 + Math.random() * 11;
          const emoji = i % 3 !== 0;
          return { x: ox + (Math.random() - 0.5) * 50, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
            size: emoji ? 20 + Math.random() * 18 : 4 + Math.random() * 5, emoji, ch: EMO[Math.floor(Math.random() * EMO.length)], c: COL[Math.floor(Math.random() * COL.length)], life: 0, max: 130 + Math.random() * 70 };
        });
        cancelAnimationFrame(raf);
        const tick = () => {
          if (!cv.isConnected) return;
          cx3.clearRect(0, 0, Wd, Hd);
          let alive = 0;
          for (const p of ps) {
            if (p.life >= p.max) continue;
            alive++; p.life++;
            p.vy += 0.38; p.vx *= 0.995; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
            if (p.y > Hd - 14) { p.y = Hd - 14; p.vy *= -0.45; p.vx *= 0.85; p.vr *= 0.8; }
            cx3.globalAlpha = 1 - Math.max(0, (p.life - p.max * 0.75) / (p.max * 0.25));
            cx3.save(); cx3.translate(p.x, p.y); cx3.rotate(p.rot);
            if (p.emoji) { cx3.font = `${p.size}px serif`; cx3.textAlign = 'center'; cx3.textBaseline = 'middle'; cx3.fillText(p.ch, 0, 0); }
            else { cx3.fillStyle = p.c; cx3.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
            cx3.restore();
          }
          cx3.globalAlpha = 1;
          if (alive) raf = requestAnimationFrame(tick); else cx3.clearRect(0, 0, Wd, Hd);
        };
        raf = requestAnimationFrame(tick);
      };
      const explode = () => {
        if (exploded) return;
        exploded = true; state.solved[d] = true; save();
        hint.textContent = '';
        sock.classList.add('shake');
        setTimeout(() => { sock.classList.remove('shake'); sock.classList.add('empty'); burst(); confetti(0.9); showMsg(true); }, reduceMotion ? 0 : 520);
      };
      sock.addEventListener('click', explode);
      sock.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); explode(); } });
      box.append(stage, hint, holder);
      if (state.solved[d]) { exploded = true; sock.classList.add('empty'); showMsg(false); }
    },

    /* ---------- MENSAJE EN CÓDIGO BINARIO ---------- */
    binary(data, box) {
      const d = data.day;
      const msg = String(data.message || 'Te amo');
      const answer = String(data.answer || msg);
      const bytes = [...msg].map((ch) => ch.charCodeAt(0)).filter((n) => n < 256);
      if (!bytes.length) { box.append(missing('Escribe el mensaje en el campo message de content.js')); return; }
      const bits = bytes.map((n) => n.toString(2).padStart(8, '0'));
      const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];
      const letterName = (n) => (n === 32 ? 'espacio' : `«${String.fromCharCode(n)}»`);
      const terms = (b) => WEIGHTS.filter((_, i) => b[i] === '1').join(' + ');
      paragraphs(data.text, box);

      // 1) el mensaje, en grupos de 8 dígitos
      const help = h('div', { class: 'bin-help', 'aria-live': 'polite' }, h('p', { class: 'small', text: 'Toca un grupo para ver cuánto vale cada posición.' }));
      const msgEl = h('div', { class: 'bin-msg', role: 'group', 'aria-label': 'Mensaje en binario' });
      bits.forEach((b, i) => {
        const btn = h('button', { class: 'bin-byte', type: 'button', 'aria-label': `Grupo ${i + 1}: ${b}` }, h('small', { text: String(i + 1) }), h('span', { text: b }));
        btn.addEventListener('click', () => {
          msgEl.querySelectorAll('.bin-byte').forEach((x) => x.classList.toggle('sel', x === btn));
          const row = (cells, cls) => h('div', { class: `bin-row ${cls}` }, cells.map((c) => h('span', { text: String(c) })));
          help.replaceChildren(
            h('div', { class: 'bin-grid' }, row(WEIGHTS, 'w'), row([...b], 'b')),
            h('p', { class: 'bin-sum', text: `Grupo ${i + 1}: ${terms(b) || '0'} = ${bytes[i]}` }),
            h('p', { class: 'small', text: 'Ahora busca ese número en la tabla de letras 👇' }));
        });
        msgEl.append(btn);
      });

      // 2) pautas paso a paso y tabla de letras
      const steps = data.steps || [
        'Cada grupo de 8 números (ceros y unos) es UNA letra. Léelos de izquierda a derecha.',
        'Las posiciones de cada grupo valen, de izquierda a derecha: 128, 64, 32, 16, 8, 4, 2 y 1.',
        'Suma solo las posiciones que tienen un 1. Las que tienen 0 no cuentan.',
        'Busca el resultado en la tabla de letras. Esa es tu letra (el 32 es un espacio entre palabras).',
        'Repite con los demás grupos, junta las letras y escribe el mensaje abajo.',
      ];
      const guide = h('details', { class: 'bin-box', open: '' }, h('summary', { text: 'Pautas para descifrarlo' }), h('ol', {}, steps.map((t) => h('li', { text: fill(t) }))));
      const table = h('details', { class: 'bin-box' }, h('summary', { text: 'Tabla de letras' }));
      const rowsOf = (from, to) => h('div', { class: 'bin-table' }, Array.from({ length: to - from + 1 }, (_, k) => h('span', {}, h('b', { text: String.fromCharCode(from + k) }), String(from + k))));
      table.append(h('p', { class: 'small', text: 'Mayúsculas' }), rowsOf(65, 90), h('p', { class: 'small', text: 'Minúsculas' }), rowsOf(97, 122), h('p', { class: 'small', text: 'Espacio = 32' }));

      // 3) pistas que se van revelando
      const letters = bytes.filter((n) => n !== 32).length, spaces = bytes.length - letters;
      const first = bytes[0];
      const clue = data.clue != null ? fill(data.clue) : norm(msg) === 'te amo' ? 'Son dos palabras cortas que nos decimos todos los días 💗' : '';
      const hints = (Array.isArray(data.hints) && data.hints.length ? data.hints.map((t) => fill(t)) : [
        `El mensaje tiene ${bytes.length} grupos: ${letters} letras${spaces ? ` y ${spaces} espacio${spaces > 1 ? 's' : ''} (también se escribe en binario)` : ''}.`,
        `Ejemplo con el primer grupo: ${bits[0]} → ${terms(bits[0])} = ${first}. En la tabla, el ${first} es ${letterName(first)}.`,
        'Recuerda: las mayúsculas van del 65 al 90 y las minúsculas del 97 al 122.',
        clue,
        `El mensaje empieza con «${msg[0]}» y termina con «${msg.slice(-1)}».`,
      ]).filter(Boolean);
      const hintList = h('ul', { class: 'bin-hints' });
      let shown = 0;
      const hintBtn = h('button', { class: 'link-btn', type: 'button' });
      const paintHint = () => { hintBtn.textContent = shown >= hints.length ? 'No hay más pistas' : `Dame una pista (${shown}/${hints.length})`; hintBtn.disabled = shown >= hints.length; };
      hintBtn.addEventListener('click', () => { if (shown < hints.length) { hintList.append(h('li', { text: hints[shown++] })); paintHint(); } });
      paintHint();

      // 4) respuesta
      const holder = h('div');
      const input = h('input', { type: 'text', placeholder: 'Escribe el mensaje descifrado…', 'aria-label': 'Mensaje descifrado', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
      const msgLine = h('p', { class: 'msg', role: 'status' });
      const form = h('form', { class: 'riddle-form' }, h('div', { class: 'row' }, input, h('button', { class: 'btn', type: 'submit', text: 'Comprobar' })), msgLine);
      const compact = (t) => norm(t).replace(/\s+/g, '');
      const solved = (celebrate) => {
        state.solved[d] = true; save();
        const r = h('div', { class: 'reward' }, h('p', { class: 'ok', text: '¡Lo descifraste! ✨' }), h('p', { class: 'bin-decoded', text: `${fill(data.decoded || msg)} 💗` }));
        paragraphs(data.reward, r);
        if (data.rewardImage) r.append(imageNode(data.rewardImage));
        holder.replaceChildren(r);
        form.remove(); hintBtn.remove();
        if (celebrate) confetti(1.5);
      };
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!compact(input.value)) return;
        if (compact(input.value) === compact(answer)) solved(true);
        else { msgLine.textContent = 'Mmm, todavía no… revisa las sumas o pide una pista 💡'; input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); }
      });
      box.append(msgEl, help, guide, table, hintList, hintBtn, form, holder);
      if (state.solved[d]) solved(false);
    },

    /* ---------- ROMPECABEZAS ---------- */
    puzzle(data, box) {
      const d = data.day;
      if (!data.image) { box.append(missing('Añade la imagen en el campo image de content.js')); return; }
      paragraphs(data.text, box);
      const n = Math.min(5, Math.max(2, Math.round(+data.size) || 3));
      const total = n * n;
      const ids = Array.from({ length: total }, (_, i) => i);
      if (!state.found) state.found = {};
      let done = !!state.solved[d];
      let order = ids.slice();
      const saved = state.found[d];
      if (!done) {
        if (Array.isArray(saved) && saved.length === total && saved.every(Number.isInteger) && new Set(saved).size === total) order = saved.slice();
        else { let t = 0; do { order = seededShuffle(ids, d * 131 + 17 + t++); } while (order.every((v, i) => v === i) && t < 20); }
      }
      const board = h('div', { class: 'pz-board', style: `--n:${n}`, role: 'group', 'aria-label': 'Rompecabezas' });
      const probe = new Image();
      probe.onload = () => { if (probe.naturalWidth && probe.naturalHeight) board.style.aspectRatio = String(Math.min(1.8, Math.max(0.75, probe.naturalWidth / probe.naturalHeight))); };
      probe.onerror = () => board.replaceWith(missing('No se encontró la imagen. Revisa la ruta en content.js'));
      probe.src = data.image;
      const url = `url("${String(data.image).replace(/"/g, '%22')}")`;
      const tiles = ids.map((pos) => h('button', { class: 'pz-tile', type: 'button', 'data-pos': pos, 'aria-label': `Pieza ${pos + 1}` }));
      tiles.forEach((t) => board.append(t));
      const info = h('p', { class: 'small pz-info' });
      const holder = h('div');
      let sel = -1;
      const paint = () => {
        tiles.forEach((t, pos) => {
          const id = order[pos], r = Math.floor(id / n), c = id % n;
          t.style.backgroundImage = url;
          t.style.backgroundSize = `${n * 100}% ${n * 100}%`;
          t.style.backgroundPosition = `${(c / (n - 1)) * 100}% ${(r / (n - 1)) * 100}%`;
          t.classList.toggle('sel', sel === pos);
        });
        const ok = order.filter((v, i) => v === i).length;
        info.textContent = done ? '' : `Toca dos piezas para intercambiarlas · ${ok} de ${total} en su lugar`;
      };
      const finish = (celebrate) => {
        done = true; sel = -1;
        state.solved[d] = true; save();
        board.classList.add('done');
        paint();
        holder.replaceChildren(makeReward(data, '¡Lo lograste! ✨'));
        if (celebrate) confetti(1.5);
      };
      board.addEventListener('click', (e) => {
        const t = e.target.closest('.pz-tile');
        if (!t || done) return;
        const p = +t.dataset.pos;
        if (sel === -1) sel = p;
        else if (sel === p) sel = -1;
        else { [order[sel], order[p]] = [order[p], order[sel]]; sel = -1; state.found[d] = order.slice(); save(); }
        paint();
        if (order.every((v, i) => v === i)) finish(true);
      });
      box.append(board, info, holder);
      if (done) finish(false); else paint();
    },

    /* ---------- AHORCADO NAVIDEÑO ---------- */
    hangman(data, box) {
      const d = data.day;
      const phrase = fill(data.phrase || '').trim();
      if (!phrase) { box.append(missing('Escribe la frase a adivinar en el campo phrase de content.js')); return; }
      paragraphs(data.text, box);
      if (data.hint) box.append(h('p', { class: 'small hm-hint', text: `Pista: ${fill(data.hint)}` }));
      const lives = Math.min(8, Math.max(3, Math.round(+data.lives) || 6));
      const needed = new Set([...phrase].map((c) => wsKey(c)).filter(Boolean));
      const guessed = new Set();
      let wrong = 0, over = false, won = !!state.solved[d];

      const wrap = h('div', { class: 'hm', tabindex: '-1' });
      const tree = h('div', { class: 'hm-tree' });
      tree.innerHTML = TREE_SVG;
      const orns = [[100, 56], [90, 76], [112, 78], [86, 108], [116, 114], [74, 160], [100, 150], [126, 164]]
        .slice(0, lives)
        .map(([x, y], i) => {
          const c = s('circle', { class: 'hm-orn', cx: x, cy: y, r: 7, fill: ORN_COLORS[i % ORN_COLORS.length], stroke: '#fff', 'stroke-width': 1.5 });
          $('.hm-orns', tree).append(c);
          return c;
        });

      const phraseEl = h('div', { class: 'hm-phrase', role: 'status' });
      phrase.split(/\s+/).forEach((word) => {
        const w = h('span', { class: 'hm-word' });
        [...word].forEach((ch) => {
          const k = wsKey(ch);
          w.append(k ? h('span', { class: 'hm-slot', 'data-l': k, 'data-ch': ch.toUpperCase() }) : h('span', { class: 'hm-punct', text: ch }));
        });
        phraseEl.append(w);
      });
      const slots = [...phraseEl.querySelectorAll('.hm-slot')];

      const keysEl = h('div', { class: 'hm-keys' });
      const keyBtn = {};
      [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'].forEach((l) => {
        const b = h('button', { class: 'hm-key', type: 'button', text: l, 'data-l': l });
        keyBtn[l] = b; keysEl.append(b);
      });
      const status = h('p', { class: 'small hm-status', role: 'status' });
      const holder = h('div');
      const setStatus = () => { status.textContent = won || over ? '' : `Adornos en el árbol: ${lives - wrong} de ${lives}`; };

      const win = (celebrate) => {
        won = true;
        state.solved[d] = true; save();
        slots.forEach((el) => { el.textContent = el.dataset.ch; el.classList.add('hit'); });
        holder.replaceChildren(makeReward(data, '¡Lo adivinaste! ✨'));
        if (celebrate) confetti(1.5);
        setStatus();
      };
      const lose = () => {
        over = true;
        const retry = h('button', { class: 'btn', type: 'button', text: 'Intentar de nuevo' });
        retry.addEventListener('click', reset);
        holder.replaceChildren(h('div', { class: 'hm-lose' }, h('p', { text: 'Se cayeron todos los adornos 🎄 ¡No pasa nada, inténtalo otra vez!' }), retry));
        setStatus();
      };
      function reset() {
        guessed.clear(); wrong = 0; over = false;
        slots.forEach((el) => { el.textContent = ''; el.classList.remove('hit'); });
        Object.values(keyBtn).forEach((b) => { b.disabled = false; b.className = 'hm-key'; });
        orns.forEach((o) => o.classList.remove('fallen'));
        holder.replaceChildren(); setStatus();
        wrap.focus({ preventScroll: true });
      }
      const guess = (l) => {
        if (over || won || !keyBtn[l] || guessed.has(l)) return;
        guessed.add(l);
        keyBtn[l].disabled = true;
        if (needed.has(l)) {
          keyBtn[l].classList.add('right');
          slots.forEach((el) => { if (el.dataset.l === l) el.textContent = el.dataset.ch; });
          if ([...needed].every((x) => guessed.has(x))) win(true);
        } else {
          keyBtn[l].classList.add('wrong');
          if (orns[wrong]) orns[wrong].classList.add('fallen');
          wrong++;
          if (wrong >= lives) lose();
        }
        setStatus();
      };
      keysEl.addEventListener('click', (e) => { const b = e.target.closest('.hm-key'); if (b) guess(b.dataset.l); });
      wrap.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
        const l = wsKey(e.key);
        if (l) guess(l);
      });
      wrap.append(tree, phraseEl, status, keysEl, holder);
      box.append(wrap);
      if (won) { needed.forEach((l) => { guessed.add(l); if (keyBtn[l]) { keyBtn[l].disabled = true; keyBtn[l].classList.add('right'); } }); win(false); }
      else setStatus();
    },

    /* ---------- CONEJITO CON TULIPANES + CARTA ---------- */
    bunny(data, box) {
      const d = data.day;
      const art = h('div', { class: 'bunny' });
      art.innerHTML = BUNNY_SVG;
      box.append(art);
      paragraphs(data.text, box);
      const slot = h('div', { class: 'letter-slot' });
      box.append(slot);
      const letter = () => {
        const L = h('div', { class: 'letter' });
        L.append(h('p', { class: 'letter-greet', text: fill(data.greeting != null ? data.greeting : '{forName},') }));
        paragraphs(data.letter, L);
        L.append(h('p', { class: 'letter-close', text: fill(data.closing != null ? data.closing : 'Con todo mi amor,') }));
        const from = data.from != null ? data.from : C.fromName;
        if (from) L.append(h('p', { class: 'letter-from', text: fill(from) }));
        return L;
      };
      const reveal = (fresh) => { const L = letter(); if (fresh) L.classList.add('fresh'); slot.replaceChildren(L); };
      if (data.envelope === false || state.solved[d]) { reveal(false); return; }
      const env = h('button', { class: 'envelope', type: 'button', 'aria-label': 'Abrir la carta' },
        h('span', { class: 'env-body' }), h('span', { class: 'env-flap' }),
        h('span', { class: 'env-seal', text: '💗' }), h('span', { class: 'env-cap', text: 'Toca para abrir tu carta' }));
      env.addEventListener('click', () => {
        if (env.classList.contains('opening')) return;
        env.classList.add('opening');
        state.solved[d] = true; save();
        confetti(0.7);
        setTimeout(() => reveal(true), reduceMotion ? 0 : 550);
      });
      slot.append(env);
    },

    /* ---------- BOLA DE NIEVE ---------- */
    snowglobe(data, box) {
      paragraphs(data.text, box);
      const wrap = h('div', { class: 'sg' });
      const art = h('div', { class: 'sg-art' });
      art.innerHTML = GLOBE_SVG;
      const label = art.querySelector('.sg-label');
      label.textContent = data.label != null ? fill(data.label) : 'Feliz Navidad';
      const cv = h('canvas', { class: 'sg-snow', 'aria-hidden': 'true' });
      const gloss = h('div', { class: 'sg-gloss', 'aria-hidden': 'true' });
      art.append(cv, gloss);
      const btn = h('button', { class: 'btn sg-btn', type: 'button', text: data.buttonLabel || 'Agitar la bola ❄' });
      wrap.append(art, btn);
      if (data.message) wrap.append(h('p', { class: 'sg-msg', text: fill(data.message) }));
      box.append(wrap);

      const W = 240, R = 114, CX = 120, CY = 120;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = W * dpr;
      const ctx = cv.getContext('2d');
      const N = Math.max(30, Math.min(260, Math.round(+data.flakes) || 120));
      const ground = (x) => 222 - 26 * Math.sqrt(Math.max(0, 1 - Math.pow((x - CX) / 110, 2)));
      const flakes = [];
      for (let i = 0; i < N; i++) {
        const x = 24 + Math.random() * 192;
        flakes.push({ x, y: ground(x) + Math.random() * 6, vx: 0, vy: 0, r: 1.2 + Math.random() * 1.9, ph: Math.random() * 6.28, rest: true });
      }
      let energy = 0;
      const shake = (power) => {
        energy = Math.min(1.4, Math.max(energy, power));
        flakes.forEach((f) => { f.rest = false; f.vx += (Math.random() - .5) * 110 * power; f.vy -= (70 + Math.random() * 190) * power; });
      };
      let last = 0;
      const frame = (now) => {
        if (!cv.isConnected) return;
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, W);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 224); ctx.clip();
        energy = Math.max(0, energy - 0.28 * dt);
        for (const f of flakes) {
          if (!f.rest) {
            const dx = f.x - CX, dy = f.y - CY;
            f.vx += (-dy * 0.9) * energy * dt * 1.2 + (Math.random() - .5) * 60 * energy * dt;
            f.vy += (dx * 0.9) * energy * dt * 1.2 + 55 * dt;
            f.vx *= Math.pow(0.5, dt * 1.6);
            f.vy = Math.min(f.vy, 26 + f.r * 6);
            f.vy *= Math.pow(0.7, dt);
            f.x += (f.vx + Math.sin(now / 520 + f.ph) * 9) * dt;
            f.y += f.vy * dt;
            const ex = f.x - CX, ey = f.y - CY, dist = Math.hypot(ex, ey);
            if (dist > R - f.r) { const k = (R - f.r) / dist; f.x = CX + ex * k; f.y = CY + ey * k; f.vx *= -0.3; f.vy *= -0.3; }
            const g = ground(f.x);
            if (f.y >= g && f.vy >= 0) { f.y = g + Math.random() * 6; f.vx = 0; f.vy = 0; f.rest = true; }
          }
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.shadowColor = 'rgba(150,175,225,.7)'; ctx.shadowBlur = 3; ctx.fill();
        }
        ctx.restore();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      const first = setTimeout(() => shake(1), reduceMotion ? 0 : 450);
      btn.addEventListener('click', () => { clearTimeout(first); shake(1); });
      let down = false, px = 0, py = 0;
      art.addEventListener('pointerdown', (e) => { down = true; px = e.clientX; py = e.clientY; shake(0.7); });
      art.addEventListener('pointermove', (e) => {
        if (!down) return;
        const m = Math.hypot(e.clientX - px, e.clientY - py); px = e.clientX; py = e.clientY;
        if (m > 6) shake(Math.min(1, 0.4 + m / 60));
      });
      const up = () => { down = false; };
      art.addEventListener('pointerup', up); art.addEventListener('pointerleave', up); art.addEventListener('pointercancel', up);
    },

    /* ---------- CARTA NAVIDEÑA (texto largo) ---------- */
    letter(data, box) {
      const d = data.day;
      paragraphs(data.text, box);
      const slot = h('div', { class: 'letter-slot' });
      box.append(slot);
      const paper = () => {
        const L = h('article', { class: 'letter xmas' });
        L.append(h('div', { class: 'xm-top', 'aria-hidden': 'true', text: '❄ 🎄 ❄' }));
        if (data.heading) L.append(h('p', { class: 'xm-heading', text: fill(data.heading) }));
        L.append(h('p', { class: 'letter-greet', text: fill(data.greeting != null ? data.greeting : '{forName},') }));
        paragraphs(data.letter, L);
        if (data.image) { const im = imageNode(data.image, data.title || ''); if (im) { im.classList.add('xm-photo'); L.append(im); } }
        L.append(h('p', { class: 'letter-close', text: fill(data.closing != null ? data.closing : 'Feliz Navidad, con todo mi amor,') }));
        const from = data.from != null ? data.from : C.fromName;
        if (from) L.append(h('p', { class: 'letter-from', text: fill(from) }));
        if (data.ps) L.append(h('p', { class: 'xm-ps', text: fill(data.ps) }));
        L.append(h('div', { class: 'xm-bottom', 'aria-hidden': 'true', text: '✨ 🎁 ✨' }));
        return L;
      };
      const reveal = (fresh) => { const L = paper(); if (fresh) L.classList.add('fresh'); slot.replaceChildren(L); };
      if (data.envelope === false || state.solved[d]) { reveal(false); return; }
      const env = h('button', { class: 'envelope xmas-env', type: 'button', 'aria-label': 'Abrir la carta' },
        h('span', { class: 'env-body' }), h('span', { class: 'env-flap' }),
        h('span', { class: 'env-seal', text: '🎄' }), h('span', { class: 'env-cap', text: 'Toca para abrir tu carta de Navidad' }));
      env.addEventListener('click', () => {
        if (env.classList.contains('opening')) return;
        env.classList.add('opening');
        state.solved[d] = true; save();
        confetti(1);
        setTimeout(() => reveal(true), reduceMotion ? 0 : 550);
      });
      slot.append(env);
    },

    /* ---------- RUEDA DEL AMOR ---------- */
    wheel(data, box) {
      const d = data.day;
      const prizes = (data.prizes || []).map((p) => (typeof p === 'string' ? { label: p } : p)).filter((p) => p && p.label).slice(0, 12)
        .map((p) => ({ label: fill(p.label), detail: p.detail ? fill(p.detail) : '' }));
      if (prizes.length < 2) { box.append(missing('Añade al menos 2 premios en el campo prizes de content.js')); return; }
      paragraphs(data.text, box);
      const N = prizes.length, seg = 360 / N, R = 150;
      const maxSpins = Math.max(1, Math.round(+data.spins) || 1);
      if (!state.found) state.found = {};
      const results = Array.isArray(state.found[d]) ? state.found[d].filter((i) => Number.isInteger(i) && i >= 0 && i < N) : [];
      const COL = ['#f8d8e3', '#d3efe4', '#e5ddf8', '#fde4d2', '#dbe7f8', '#fbefc6'];
      const pt = (a) => { const r = (a * Math.PI) / 180; return `${(R * Math.sin(r)).toFixed(2)} ${(-R * Math.cos(r)).toFixed(2)}`; };
      const splitLabel = (t) => {
        if (t.length <= 10 || !t.includes(' ')) return [t];
        let best = -1, bd = 1e9;
        [...t].forEach((c, i) => { if (c === ' ' && Math.abs(i - t.length / 2) < bd) { bd = Math.abs(i - t.length / 2); best = i; } });
        return [t.slice(0, best), t.slice(best + 1)];
      };

      const svg = s('svg', { class: 'wheel-svg', viewBox: '-170 -178 340 348', role: 'img', 'aria-label': 'Rueda del amor' });
      const rot = s('g', { class: 'wheel-rot' });
      prizes.forEach((p, i) => {
        const ci = N % 6 === 1 && i === N - 1 ? 3 : i % 6;
        rot.append(s('path', { d: `M0 0 L${pt(i * seg)} A${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${pt((i + 1) * seg)} Z`, fill: COL[ci], stroke: '#fff', 'stroke-width': 2.5 }));
        const lines = splitLabel(p.label);
        const fs = Math.max(...lines.map((l) => l.length)) > 12 ? 10.5 : 12.5;
        const mid = (i + 0.5) * seg, flip = mid > 180 && mid < 360; // mitad izquierda: texto girado para leerse derecho
        const g = s('g', { transform: `rotate(${flip ? mid + 90 : mid - 90})` });
        const t = s('text', { 'text-anchor': flip ? 'start' : 'end', 'dominant-baseline': 'central', 'font-size': fs, 'font-weight': 700, fill: '#56608a', 'font-family': 'Quicksand, sans-serif' });
        lines.forEach((ln, k) => t.append(s('tspan', { x: flip ? -(R - 15) : R - 15, y: (k - (lines.length - 1) / 2) * (fs + 2) }, document.createTextNode(ln))));
        g.append(t); rot.append(g);
      });
      svg.append(
        rot,
        s('circle', { r: R + 4, fill: 'none', stroke: '#fff', 'stroke-width': 9 }),
        s('circle', { r: R + 9, fill: 'none', stroke: '#e5ddf8', 'stroke-width': 3 }),
        s('circle', { r: 27, fill: '#fff', stroke: '#f1d4e2', 'stroke-width': 3 }),
        s('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 22 }, document.createTextNode('💗')),
        s('polygon', { points: '-12,-170 12,-170 0,-141', fill: '#e79ab5', stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round' })
      );

      const result = h('div', { class: 'wheel-result', role: 'status' });
      const btn = h('button', { class: 'btn', type: 'button' });
      let angle = 0, spinning = false;
      const showResult = () => {
        if (!results.length) { result.replaceChildren(); return; }
        const p = prizes[results[results.length - 1]];
        result.replaceChildren(h('p', { class: 'wheel-won', text: p.label }), p.detail && h('p', { class: 'small', text: p.detail }));
      };
      const label = () => {
        const left = maxSpins - results.length;
        btn.disabled = spinning || left <= 0;
        btn.textContent = left <= 0 ? 'Ya giraste ✓' : spinning ? 'Girando…' : fill(data.buttonLabel || '¡Girar la rueda!') + (maxSpins > 1 ? ` (${left})` : '');
      };
      if (results.length) { angle = -((results[results.length - 1] + 0.5) * seg); rot.style.transition = 'none'; rot.style.transform = `rotate(${angle}deg)`; }
      btn.addEventListener('click', () => {
        if (spinning || results.length >= maxSpins) return;
        spinning = true; label();
        let idx = Math.floor(Math.random() * N);
        if (data.result != null) { // resultado fijado: número (1 = primer premio) o texto del premio
          const want = typeof data.result === 'number' ? data.result - 1 : prizes.findIndex((p) => norm(p.label) === norm(fill(String(data.result))));
          if (want >= 0 && want < N) idx = want;
        }
        const target = -((idx + 0.5) * seg + (Math.random() - 0.5) * seg * 0.7);
        const delta = (((target - angle) % 360) + 360) % 360;
        angle += 360 * (5 + Math.floor(Math.random() * 3)) + delta;
        rot.style.transition = `transform ${reduceMotion ? 60 : 4600}ms cubic-bezier(.12,.6,.08,1)`;
        rot.style.transform = `rotate(${angle}deg)`;
        setTimeout(() => {
          spinning = false;
          results.push(idx); state.found[d] = results.slice(); save();
          showResult(); label(); confetti(1);
        }, reduceMotion ? 120 : 4750);
      });
      box.append(h('div', { class: 'wheel-wrap' }, svg, btn, result));
      showResult(); label();
    },

    /* ---------- RASPA Y GANA ---------- */
    scratch(data, box) {
      const d = data.day;
      const prize = fill(data.prize || '').trim();
      if (!prize) { box.append(missing('Escribe el premio en el campo prize de content.js')); return; }
      paragraphs(data.text, box);
      const card = h('div', { class: 'scratch' });
      card.append(h('div', { class: 'scratch-prize' },
        h('div', { class: 'scratch-icon', text: data.icon || '🎁' }),
        h('div', { class: 'scratch-text', text: prize }),
        data.detail && h('p', { class: 'small', text: fill(data.detail) })));
      const hint = h('p', { class: 'small scratch-hint', text: 'Raspa con el dedo (o el ratón) para descubrir tu premio' });
      if (!state.solved[d]) {
        const W = 640, H = 400;
        const cv = h('canvas', { class: 'scratch-cover', width: W, height: H, 'aria-label': 'Zona para raspar' });
        const cx2 = cv.getContext('2d');
        const g = cx2.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#e6d8f6'); g.addColorStop(0.35, '#f7d6e4'); g.addColorStop(0.7, '#d6e6f8'); g.addColorStop(1, '#f1d9ee');
        cx2.fillStyle = g; cx2.fillRect(0, 0, W, H);
        const rnd = mulberry32(d * 977 + 5);
        for (let i = 0; i < 70; i++) {
          cx2.globalAlpha = 0.25 + rnd() * 0.45; cx2.fillStyle = '#fff';
          cx2.beginPath(); cx2.arc(rnd() * W, rnd() * H, 2 + rnd() * 5, 0, 6.283); cx2.fill();
        }
        cx2.globalAlpha = 1; cx2.textAlign = 'center'; cx2.textBaseline = 'middle';
        cx2.fillStyle = 'rgba(86,96,138,.55)'; cx2.font = '700 58px "Dancing Script", cursive';
        cx2.fillText('✨ Raspa aquí ✨', W / 2, H / 2);
        card.append(cv);
        let drawing = false, last = null, moves = 0, finished = false;
        const at = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }; };
        const scratchTo = (p) => {
          cx2.globalCompositeOperation = 'destination-out';
          cx2.lineCap = 'round'; cx2.lineJoin = 'round'; cx2.lineWidth = 58;
          cx2.beginPath(); cx2.moveTo(last.x, last.y); cx2.lineTo(p.x + 0.01, p.y + 0.01); cx2.stroke();
          last = p;
        };
        const cleared = () => {
          const px = cx2.getImageData(0, 0, W, H).data;
          let c = 0, t = 0;
          for (let i = 3; i < px.length; i += 64) { t++; if (px[i] < 40) c++; }
          return c / t;
        };
        const check = () => {
          if (finished || cleared() < 0.5) return;
          finished = true;
          cv.classList.add('gone');
          state.solved[d] = true; save();
          hint.textContent = '¡Es tuyo! 💗';
          confetti(1.5);
        };
        cv.addEventListener('pointerdown', (e) => { if (finished) return; e.preventDefault(); drawing = true; last = at(e); scratchTo(last); try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
        cv.addEventListener('pointermove', (e) => { if (!drawing || finished) return; e.preventDefault(); scratchTo(at(e)); if (++moves % 8 === 0) check(); });
        const stopDraw = () => { if (!drawing) return; drawing = false; check(); };
        cv.addEventListener('pointerup', stopDraw);
        cv.addEventListener('pointercancel', stopDraw);
      } else hint.textContent = '¡Es tuyo! 💗';
      box.append(card, hint);
    },

    /* ---------- ATRAPA MI AMOR (juego de reflejos) ---------- */
    catch(data, box) {
      const d = data.day;
      const items = (Array.isArray(data.items) && data.items.length ? data.items : ['💗', '💖', '⭐', '💕']).map(String);
      const msgs = (Array.isArray(data.messages) && data.messages.length ? data.messages : ['¡Eres increíble!', '¡Te amo!', '¡Qué rapidez!', '¡Sigue así!', '¡Mi corazón es tuyo!']).map((m) => fill(m));
      const total = Math.min(60, Math.max(8, Math.round(+data.duration) || 20));
      paragraphs(data.text, box);
      if (!state.found) state.found = {};
      let best = Number.isFinite(state.found[d]) ? state.found[d] : 0;
      let score = 0, left = total, running = false, tick2 = 0, spawner = 0;
      const scoreEl = h('b', { text: '0' }), timeEl = h('b', { text: String(total) }), bestEl = h('b', { text: String(best) });
      const hud = h('div', { class: 'cg-hud' }, h('span', {}, 'Puntos: ', scoreEl), h('span', {}, 'Tiempo: ', timeEl, ' s'), h('span', {}, 'Mejor: ', bestEl));
      const area = h('div', { class: 'cg-area' });
      const overlay = h('div', { class: 'cg-overlay' });
      area.append(overlay);

      const stop = () => { clearInterval(tick2); clearTimeout(spawner); running = false; };
      const popMsg = (x, y) => {
        const w = area.clientWidth;
        const m = h('div', { class: 'cg-pop', text: msgs[Math.floor(Math.random() * msgs.length)] });
        m.style.left = `${Math.min(Math.max(x - 30, 4), Math.max(4, w - 150))}px`;
        m.style.top = `${Math.max(y - 8, 4)}px`;
        area.append(m);
        setTimeout(() => m.remove(), 950);
      };
      const spawn = () => {
        if (!area.isConnected) { stop(); return; }
        if (!running) return;
        const size = 48, w = area.clientWidth, hh = area.clientHeight;
        const life = 1100 + Math.random() * 700;
        const it = h('button', { class: 'cg-item', type: 'button', 'aria-label': 'Atrapar', text: items[Math.floor(Math.random() * items.length)] });
        it.style.left = `${Math.random() * Math.max(10, w - size)}px`;
        it.style.top = `${Math.random() * Math.max(10, hh - size)}px`;
        it.style.animationDuration = `${life}ms`;
        let gone = false;
        it.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (gone || !running) return;
          gone = true; score++; scoreEl.textContent = String(score);
          popMsg(it.offsetLeft, it.offsetTop);
          it.classList.add('caught');
          setTimeout(() => it.remove(), 220);
        });
        area.append(it);
        setTimeout(() => { if (!gone) { gone = true; it.remove(); } }, life);
        spawner = setTimeout(spawn, 380 + Math.random() * 380);
      };
      const showOverlay = (ended) => {
        overlay.replaceChildren();
        const go = h('button', { class: 'btn', type: 'button', text: ended ? 'Jugar otra vez' : '¡Empezar!' });
        go.addEventListener('click', start);
        if (ended) {
          overlay.append(h('p', { class: 'cg-big', text: `¡Atrapaste ${score}! 💗` }),
            h('p', { text: fill(data.endMessage || '¡Eres la mejor! Gracias por jugar conmigo.') }));
        } else {
          overlay.append(h('p', { class: 'cg-big', text: 'Atrapa mi amor' }), h('p', { text: `Toca los corazones antes de que desaparezcan. Tienes ${total} segundos.` }));
        }
        overlay.append(go);
        overlay.classList.remove('off');
      };
      function start() {
        stop();
        area.querySelectorAll('.cg-item,.cg-pop').forEach((n) => n.remove());
        score = 0; left = total; scoreEl.textContent = '0'; timeEl.textContent = String(total);
        overlay.classList.add('off');
        running = true;
        tick2 = setInterval(() => {
          if (!area.isConnected) { stop(); return; }
          left -= 0.25;
          timeEl.textContent = String(Math.max(0, Math.ceil(left)));
          if (left <= 0) {
            stop();
            area.querySelectorAll('.cg-item').forEach((n) => n.remove());
            if (score > best) { best = score; state.found[d] = best; save(); bestEl.textContent = String(best); if (score > 0) confetti(1.2); }
            showOverlay(true);
          }
        }, 250);
        spawn();
      }
      showOverlay(false);
      box.append(hud, area);
    },

    coupon(data, box) {
      const d = data.day;
      box.append(h('div', { class: 'coupon' },
        h('div', { class: 'coupon-tag', text: 'CUPÓN' }),
        h('div', { class: 'coupon-offer', text: fill(data.offer) }),
        data.conditions && h('p', { class: 'small', text: fill(data.conditions) })));
      const btn = h('button', { class: 'btn', type: 'button' });
      const paint = () => {
        if (state.redeemed[d]) { btn.disabled = true; btn.textContent = `Canjeado el ${niceDate(new Date(state.redeemed[d]))} ✓`; }
        else btn.textContent = 'Canjear cupón';
      };
      btn.addEventListener('click', () => { state.redeemed[d] = Date.now(); save(); paint(); confetti(0.7); });
      paint();
      box.append(h('div', { class: 'coupon-actions' }, btn));
      paragraphs(data.text, box);
    },
    quote(data, box) {
      const card = h('div', { class: 'quote-card' });
      if (data.background) card.style.setProperty('--bg', `url("${String(data.background).replace(/"/g, '%22')}")`);
      if (data.overlay != null) card.style.setProperty('--ov', String(data.overlay));
      card.append(h('blockquote', { class: 'quote-text', text: fill(data.quote) }));
      if (data.author || data.source) {
        card.append(h('p', { class: 'quote-by' },
          data.author && h('span', { class: 'quote-author', text: `— ${fill(data.author)}` }),
          data.source && h('em', { class: 'quote-source', text: fill(data.source) })));
      }
      box.append(card);
      paragraphs(data.text, box);
    },
    wordsearch(data, box) {
      const d = data.day;
      paragraphs(data.text, box);
      const seen = new Set();
      const words = (data.words || [])
        .map((w) => {
          const obj = typeof w === 'object' && w !== null;
          const word = obj ? w.word : w;
          return { label: fill(word).trim(), clue: obj && w.clue ? fill(w.clue) : '', key: wsKey(word) };
        })
        .filter((w) => w.key.length > 1 && !seen.has(w.key) && seen.add(w.key));
      const built = words.length ? buildWordSearch(words.map((w) => w.key), data.size || 10, d, !!data.easy) : null;
      if (!built) { box.append(h('div', { class: 'placeholder', text: 'Añade palabras en el campo words de content.js' })); return; }
      const { grid, size, places } = built;
      if (!state.found) state.found = {};
      const found = new Set(state.found[d] || []);
      let finished = false;

      const gridEl = h('div', { class: 'ws-grid', style: `--n:${size}`, role: 'group', 'aria-label': 'Sopa de letras' });
      const cells = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const cell = h('div', { class: 'ws-cell', 'data-r': r, 'data-c': c, text: grid[r][c] });
          cells.push(cell); gridEl.append(cell);
        }
      }
      const HIT = ['--pink', '--mint', '--lavender', '--peach', '--sky', '--butter'];
      const hasClues = words.some((w) => w.clue);
      const list = h('ul', { class: `ws-words${hasClues ? ' clues' : ''}` }, words.map((w) => (w.clue
        ? h('li', { class: 'has-clue', 'data-key': w.key }, h('span', { class: 'ws-clue', text: w.clue }), h('span', { class: 'ws-ans', text: w.label }))
        : h('li', { 'data-key': w.key, text: w.label.toUpperCase() }))));
      const count = h('p', { class: 'small ws-count' });
      const rewardHolder = h('div');
      const updateCount = () => { count.textContent = `${found.size} de ${words.length} palabras encontradas`; };
      const showReward = () => {
        const r = h('div', { class: 'reward' }, h('p', { class: 'ok', text: '¡Las encontraste todas! ✨' }));
        paragraphs(data.reward, r);
        if (data.rewardImage) r.append(imageNode(data.rewardImage));
        rewardHolder.replaceChildren(r);
      };
      const paintWord = (key, pts) => {
        const idx = words.findIndex((w) => w.key === key);
        pts.forEach((p) => {
          const el = cells[p.r * size + p.c];
          el.classList.add('hit');
          el.style.setProperty('--hit', `var(${HIT[idx % HIT.length]})`);
        });
        const li = list.querySelector(`[data-key="${key}"]`);
        if (li) li.classList.add('found');
      };

      // restaurar progreso
      found.forEach((k) => { if (places[k]) paintWord(k, places[k]); });
      if (found.size === words.length) { finished = true; showReward(); }
      updateCount();

      // selección: arrastrar, o tocar la primera y la última letra
      let start = null, end = null, dragging = false;
      const cellOf = (e) => {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const c = el && el.closest ? el.closest('.ws-cell') : null;
        return c && gridEl.contains(c) ? c : null;
      };
      const pos = (c) => ({ r: +c.dataset.r, c: +c.dataset.c });
      const line = (a, b) => {
        const dr = b.r - a.r, dc = b.c - a.c;
        if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
        const n = Math.max(Math.abs(dr), Math.abs(dc));
        return Array.from({ length: n + 1 }, (_, i) => ({ r: a.r + Math.sign(dr) * i, c: a.c + Math.sign(dc) * i }));
      };
      const paintSel = () => {
        cells.forEach((c) => c.classList.remove('sel'));
        if (start && end) (line(start, end) || [start]).forEach((p) => cells[p.r * size + p.c].classList.add('sel'));
      };
      const clearSel = () => { start = end = null; dragging = false; paintSel(); };
      const finish = () => {
        const pts = line(start, end) || [];
        const str = pts.map((p) => grid[p.r][p.c]).join('');
        const rev = [...str].reverse().join('');
        const hit = pts.length > 1 ? words.find((w) => !found.has(w.key) && (w.key === str || w.key === rev)) : null;
        clearSel();
        if (hit) {
          found.add(hit.key); state.found[d] = [...found]; save();
          paintWord(hit.key, pts); updateCount();
          if (found.size === words.length) { finished = true; showReward(); confetti(1.6); }
          else confetti(0.35);
        } else {
          gridEl.classList.remove('shake'); void gridEl.offsetWidth; gridEl.classList.add('shake');
        }
      };
      gridEl.addEventListener('pointerdown', (e) => {
        if (finished) return;
        const c = cellOf(e);
        if (!c) return;
        e.preventDefault();
        const p = pos(c);
        if (start && !dragging) { end = p; paintSel(); finish(); return; } // segundo toque
        start = end = p; dragging = true; paintSel();
      });
      gridEl.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const c = cellOf(e);
        if (!c) return;
        const p = pos(c);
        if (line(start, p)) { end = p; paintSel(); }
      });
      gridEl.addEventListener('pointerup', () => {
        if (!dragging) return;
        dragging = false;
        if (end.r === start.r && end.c === start.c) return; // fue un toque: se espera el segundo
        finish();
      });
      gridEl.addEventListener('pointercancel', clearSel);

      box.append(gridEl, list, count, rewardHolder);
    },
    riddle(data, box) {
      const d = data.day;
      paragraphs(data.question || data.text, box, 'question');
      const rewardBox = () => {
        const r = h('div', { class: 'reward' }, h('p', { class: 'ok', text: '¡Correcto! ✨' }));
        paragraphs(data.reward, r);
        if (data.rewardImage) r.append(imageNode(data.rewardImage));
        return r;
      };
      if (state.solved[d]) { box.append(rewardBox()); return; }
      const input = h('input', { type: 'text', placeholder: 'Tu respuesta…', 'aria-label': 'Tu respuesta', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
      const msg = h('p', { class: 'msg', role: 'status' });
      const form = h('form', { class: 'riddle-form' }, h('div', { class: 'row' }, input, h('button', { class: 'btn', type: 'submit', text: 'Comprobar' })), msg);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = norm(input.value);
        if (!val) return;
        if ((data.answers || []).map(norm).includes(val)) {
          state.solved[d] = true; save();
          form.replaceWith(rewardBox());
          if (hint) hint.remove();
          confetti(1);
        } else {
          msg.textContent = 'Mmm, casi… ¡inténtalo otra vez!';
          input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
        }
      });
      box.append(form);
      let hint = null;
      if (data.hint) {
        hint = h('button', { class: 'link-btn', type: 'button', text: 'Dame una pista' });
        hint.addEventListener('click', () => { msg.textContent = `Pista: ${fill(data.hint)}`; });
        box.append(hint);
      }
    },
  };

  function renderDay(data, box) {
    const type = RENDER[data.type] ? data.type : 'message';
    box.append(h('p', { class: 'eyebrow-day', text: `Día ${data.day}` }));
    if (data.title) box.append(h('h2', { text: fill(data.title) }));
    RENDER[type](data, box);
    if (data.signature === true && C.fromName) box.append(h('p', { class: 'sig', text: `— ${fill(C.fromName)}` }));
  }

  /* ====================== CONFETI ====================== */
  const cx = cv.getContext('2d');
  const COLORS = ['#f4b6cb', '#a9d8c4', '#c9b9ee', '#f9cfae', '#a9c8ee', '#f6df98', '#ffffff'];
  let W = 0, H = 0, parts = [], raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    for (const c of [cv, $('#snow')]) { c.width = W * dpr; c.height = H * dpr; }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initSnow();
  }

  function confetti(power = 1) {
    if (reduceMotion) return;
    const n = Math.round(110 * power);
    for (let i = 0; i < n; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.35, y: H * 0.6,
        vx: (Math.random() - 0.5) * 13, vy: -(6 + Math.random() * 11), g: 0.28,
        r: 4 + Math.random() * 5, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
        c: COLORS[Math.floor(Math.random() * COLORS.length)], circ: Math.random() < 0.45,
        life: 0, max: 110 + Math.random() * 70,
      });
    }
    if (!raf) raf = requestAnimationFrame(confettiLoop);
  }
  function confettiLoop() {
    cx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => p.life < p.max && p.y < H + 40);
    for (const p of parts) {
      p.vy += p.g; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      cx.globalAlpha = 1 - Math.max(0, (p.life - p.max * 0.7) / (p.max * 0.3));
      cx.fillStyle = p.c;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
      if (p.circ) { cx.beginPath(); cx.arc(0, 0, p.r / 2, 0, 6.283); cx.fill(); }
      else cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      cx.restore();
    }
    cx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(confettiLoop);
    else { raf = 0; cx.clearRect(0, 0, W, H); }
  }

  /* ====================== NIEVE ====================== */
  const sc = $('#snow');
  const sx = sc.getContext('2d');
  let flakes = [];
  const newFlake = (anywhere) => ({
    x: Math.random() * W, y: anywhere ? Math.random() * H : -10,
    r: 1 + Math.random() * 2.8, vy: 0.3 + Math.random() * 0.9,
    ph: Math.random() * 6.28, amp: 0.3 + Math.random() * 0.7, a: 0.55 + Math.random() * 0.45,
  });
  function initSnow() {
    if (reduceMotion) return;
    flakes = Array.from({ length: Math.min(120, Math.round(W / 9)) }, () => newFlake(true));
  }
  function snowLoop() {
    sx.clearRect(0, 0, W, H);
    sx.shadowColor = 'rgba(150,170,220,.55)'; sx.shadowBlur = 3;
    for (const fl of flakes) {
      fl.y += fl.vy; fl.ph += 0.012; fl.x += Math.sin(fl.ph) * fl.amp;
      if (fl.y > H + 6) Object.assign(fl, newFlake(false), { x: Math.random() * W });
      sx.fillStyle = `rgba(255,255,255,${fl.a})`;
      sx.beginPath(); sx.arc(fl.x, fl.y, fl.r, 0, 6.283); sx.fill();
    }
    requestAnimationFrame(snowLoop);
  }

  /* ====================== MODO PRUEBA ====================== */
  function buildDebugBar() {
    const bar = h('div', { class: 'debug' },
      h('span', { text: `Modo prueba${simBase ? ` · fecha simulada: ${niceDate(now())}` : ''}` }),
      h('button', {
        type: 'button', text: 'Reiniciar progreso',
        onclick: () => { state = emptyState(); save(); updateDoorStates(); syncOrnaments(false); renderStatus(); toast('Progreso de prueba reiniciado'); },
      }));
    document.body.append(bar);
  }

  /* ====================== ARRANQUE ====================== */
  buildTree();
  buildDoors();

  $('#doors').addEventListener('click', (e) => {
    const el = e.target.closest('.door');
    if (el) activate(+el.dataset.day);
  });
  $('#ornaments').addEventListener('click', (e) => {
    const g = e.target.closest('.orn');
    if (g && g.classList.contains('on')) showModal(+g.dataset.day);
  });
  $('.close', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { $('#content').replaceChildren(); document.body.append(cv); });
  window.addEventListener('resize', resize);

  if (TEST) buildDebugBar();
  resize();
  updateDoorStates();
  syncOrnaments(true);
  tick();
  setInterval(tick, 1000);
  if (!reduceMotion) requestAnimationFrame(snowLoop);
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ready')));
})();
