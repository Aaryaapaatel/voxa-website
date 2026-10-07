(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced) root.classList.add('reduced');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const wait = ms => new Promise(r => setTimeout(r, ms));

  $('.year').textContent = new Date().getFullYear();

  /* ---------- shared voice level (drives the demo waveform) ---------- */
  // env: loudness of the playing clip, 60 samples per second (see main demo code)
  const voice = { cur: 0, target: 0, env: null, player: null };
  const voiceLevel = () => {
    const p = voice.player;
    if (voice.env && p && !p.paused) {
      const v = voice.env[Math.floor(p.currentTime * 60)] || 0;
      voice.target = Math.max(voice.target, Math.min(1, v * 3));
    }
    voice.cur += (voice.target - voice.cur) * 0.25;
    voice.target *= 0.92;
    return voice.cur;
  };
  // Fake speech envelope for the hero: syllable-like bursts with pauses.
  const talk = t => {
    const s = Math.sin(t * 5.3) * Math.sin(t * 1.7 + 0.6) * Math.sin(t * 0.47 + 1.2);
    return Math.min(1, Math.max(0, s) * 1.6 + 0.12);
  };

  /* ---------- ridgeline waveform renderer ---------- */
  function ridge(canvas, o) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, visible = true;
    let mx = -1e4, my = -1e4, sx = -1e4, sy = -1e4;

    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(2.4);
    };

    if (o.mouse && finePointer) {
      const host = canvas.parentElement;
      host.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
        if (sx < -5e3) { sx = mx; sy = my; }
      });
      host.addEventListener('pointerleave', () => { mx = my = -1e4; });
    }

    function draw(t) {
      ctx.fillStyle = o.bg;
      ctx.fillRect(0, 0, w, h);
      if (!w) return;
      const n = w < 700 ? o.linesMobile : o.lines;
      const top = h * o.top, gap = (h * (w < 700 ? o.bottomMobile ?? o.bottom : o.bottom) - top) / (n - 1);
      const amp = h * o.amp;
      const lvl = o.level(t);
      sx += (mx - sx) * 0.08; sy += (my - sy) * 0.08;
      if (mx < -5e3) { sx = sy = -1e4; }
      const step = w < 700 ? 5 : 6;

      for (let i = 0; i < n; i++) {
        const y0 = top + i * gap;
        const line = new Path2D();
        for (let x = 0; x <= w + step; x += step) {
          const nx = x / w - o.cx;
          const env = Math.exp(-(nx * nx) / o.spread);
          const dx = x - sx, dy = (y0 - sy) * 1.6;
          const near = Math.exp(-(dx * dx + dy * dy) / 39200);
          const wv = Math.sin(x * 0.012 + t * 1.1 + i * 0.9) * 0.5
                   + Math.sin(x * 0.027 - t * 1.9 + i * 1.7) * 0.3
                   + Math.sin(x * 0.061 + t * 3.3 + i * 2.3) * 0.2;
          const p = 0.5 + 0.5 * wv;
          const y = y0 - p * p * amp * (env * (0.22 + lvl) + near * 1.3);
          x === 0 ? line.moveTo(x, y) : line.lineTo(x, y);
        }
        // Fill underneath so nearer lines hide the ones behind them.
        const fill = new Path2D(line);
        fill.lineTo(w + step, h); fill.lineTo(0, h); fill.closePath();
        ctx.fillStyle = o.bg; ctx.fill(fill);
        ctx.strokeStyle = o.stroke;
        ctx.globalAlpha = 0.3 + 0.7 * (i / (n - 1));
        ctx.lineWidth = o.width;
        ctx.stroke(line);
        ctx.globalAlpha = 1;
      }
    }

    new ResizeObserver(fit).observe(canvas);
    fit();
    if (reduced) return;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    const loop = now => { if (visible) draw(now / 1000); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  ridge($('.hero__canvas'), {
    bg: '#2236F5', stroke: '#ffffff', width: 1.3,
    lines: 30, linesMobile: 16, top: 0.16, bottom: 0.6, bottomMobile: 0.42, amp: 0.2,
    cx: 0.62, spread: 0.05, level: talk, mouse: true,
  });
  ridge($('.cta__canvas'), {
    bg: '#2236F5', stroke: '#B9B6FF', width: 1.1,
    lines: 22, linesMobile: 14, top: 0.08, bottom: 1.02, amp: 0.16,
    cx: 0.78, spread: 0.06, level: t => talk(t + 11), mouse: true,
  });
  ridge($('.console__wave'), {
    bg: '#121A4D', stroke: '#B9B6FF', width: 1.2,
    lines: 9, linesMobile: 7, top: 0.35, bottom: 0.92, amp: 0.55,
    cx: 0.5, spread: 0.07, level: voiceLevel, mouse: false,
  });

  /* ---------- call demo ---------- */
  // Lines live in scenes.js; audio/<id>-<n>.mp3 is rendered by tools/voices.py.
  const SCENES = window.VOXA_SCENES || [];
  const consoleEl = $('.console');
  const pickWrap = $('.console__pick');
  pickWrap.setAttribute('role', 'group');
  const transcript = $('.console__transcript');
  const actions = $('.console__actions');
  const playBtn = $('.console__play');
  const soundBox = $('.console__sound');
  const timerEl = $('.console__timer');

  let scene = SCENES[0], run = 0, playing = false, seconds = 0, timer = null;
  let current = null;
  // Sound plays through one plain <audio> element (the most reliable path on every
  // browser and output device). The waveform reads a loudness envelope decoded separately.
  const player = new Audio();
  player.preload = 'auto';
  voice.player = player;
  const fetched = new Map(), envs = new Map();
  const src = (s, i) => `audio/${s.id}-${i}.m4a`;

  function envelope(url) {
    if (!envs.has(url)) envs.set(url, (async () => {
      const ab = await fetched.get(url);
      const OAC = window.OfflineAudioContext;
      if (!ab || !OAC) return null;
      const buf = await new OAC(1, 1, 24000).decodeAudioData(ab);
      const d = buf.getChannelData(0), step = Math.floor(buf.sampleRate / 60);
      const env = new Float32Array(Math.ceil(d.length / step));
      for (let i = 0; i < env.length; i++) {
        let sum = 0;
        const end = Math.min(d.length, (i + 1) * step);
        for (let j = i * step; j < end; j++) sum += d[j] * d[j];
        env[i] = Math.sqrt(sum / step);
      }
      return env;
    })().catch(() => null));
    return envs.get(url);
  }
  const prefetch = s => s.lines.forEach((_, i) => {
    const url = src(s, i);
    if (!fetched.has(url)) fetched.set(url, fetch(url).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null));
    envelope(url);
  });

  // Starts one clip. Resolves to { ms, ended } or null when the browser won't play it.
  async function startClip(url) {
    prefetch(scene);
    voice.env = null;
    envelope(url).then(env => { if (player.src.endsWith(url)) voice.env = env; });
    player.muted = false;
    player.volume = 1;
    player.src = url;
    const ended = new Promise(r => { player.onended = player.onerror = () => r(); });
    try { await player.play(); } catch { return null; }
    if (!isFinite(player.duration)) await new Promise(r => player.addEventListener('durationchange', r, { once: true }));
    current = { stop: () => { player.pause(); player.onended?.(); } };
    return { ms: player.duration * 1000, ended };
  }

  // iOS only lets an element play after it has been started inside a tap.
  function unlockAudio() {
    player.muted = true;
    player.src = src(scene, 0);
    player.play().catch(() => {});
  }

  SCENES.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pick';
    b.setAttribute('aria-pressed', i === 0);
    b.innerHTML = `<span class="pick__name"></span><span class="pick__kind"></span>`;
    b.firstChild.textContent = s.name; b.lastChild.textContent = s.kind;
    b.addEventListener('click', () => {
      stop();
      scene = s;
      prefetch(s);
      $$('.pick', pickWrap).forEach(p => p.setAttribute('aria-pressed', p === b));
      showScene();
      resetPanel();
    });
    pickWrap.append(b);
  });
  new IntersectionObserver(([e], io) => {
    if (e.isIntersecting) { prefetch(scene); io.disconnect(); }
  }, { rootMargin: '800px' }).observe(consoleEl);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  function showScene(empty = true) {
    $('.console__biz').textContent = scene.name;
    $('.console__kind').textContent = scene.dir;
    timerEl.textContent = '00:00';
    actions.innerHTML = '';
    if (empty) transcript.innerHTML = '<p class="console__empty">Press play to start the call.</p>';
  }
  showScene();

  /* call log: one row per call + the live caller record on the right.
     Cells fill (and flash) the moment the agent hears each detail. */
  const COLS = [['time', 'Time'], ['business', 'Business'], ['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['reason', 'Reason for call'], ['outcome', 'Outcome'], ['notes', 'Notes']];
  const sheetBody = $('.sheet__table tbody');
  const dlBtn = $('.sheet__dl');
  const panel = {
    status: $('.rec__status'), avatar: $('.rec .rec__avatar'),
    name: $('.rec__name'), phone: $('.rec__phone'),
    f: Object.fromEntries($$('.rec__fields dd').map(dd => [dd.dataset.f, dd])),
  };
  const records = [];
  let rec = null;

  const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const flash = (el, text) => {
    el.textContent = text;
    el.classList.remove('flash');
    void el.offsetWidth; // restart the animation
    el.classList.add('flash');
  };
  const setStatus = (state, text) => { panel.status.dataset.state = state; panel.status.textContent = text; };

  function resetPanel() {
    setStatus('idle', 'Waiting for a call');
    panel.avatar.textContent = '?';
    panel.avatar.classList.remove('is-known');
    panel.name.textContent = 'Unknown caller';
    panel.phone.textContent = 'No number yet';
    Object.values(panel.f).forEach(dd => { dd.textContent = ''; dd.classList.remove('is-muted'); });
  }

  function setCell(r, key, value) {
    r[key] = value;
    flash(r.cells[key], value);
    if (key === 'name') {
      [r.avatar, ...(r === rec ? [panel.avatar] : [])].forEach(av => { av.textContent = initials(value); av.classList.add('is-known'); });
    }
    if (r !== rec) return;
    if (key === 'name' || key === 'phone') flash(panel[key], value);
    else if (panel.f[key]) flash(panel.f[key], value);
  }

  function addRecord() {
    if (!records.length) sheetBody.innerHTML = '';
    const tr = document.createElement('tr');
    tr.className = 'is-live';
    tr.innerHTML = `
      <td class="sheet__time"></td>
      <td class="sheet__callercell"><div class="sheet__caller"><span class="rec__avatar">?</span><div><span class="sheet__name"></span><span class="sheet__phone"></span></div></div></td>
      <td data-label="Business"><span class="sheet__biz"></span></td>
      <td data-label="Email"></td>
      <td data-label="Reason"></td>
      <td data-label="Outcome"><span class="sheet__chip"></span></td>
      <td data-label="Notes" class="sheet__notes"></td>`;
    const q = sel => tr.querySelector(sel), td = tr.children;
    const r = {
      tr, avatar: q('.rec__avatar'),
      cells: { time: td[0], name: q('.sheet__name'), phone: q('.sheet__phone'), business: q('.sheet__biz'), email: td[3], reason: td[4], outcome: q('.sheet__chip'), notes: td[6] },
    };
    COLS.forEach(([k]) => { r[k] = ''; });
    sheetBody.append(tr);
    records.push(r);
    rec = r;
    resetPanel();
    setStatus('live', `Writing to row ${records.length + 1}`);
    setCell(r, 'time', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setCell(r, 'business', scene.name);
    setCell(r, 'phone', scene.phone);
    window.gsap?.from(tr, { opacity: 0, y: -12, duration: 0.6, ease: 'power3.out' });
    return r;
  }

  function closeRecord() {
    if (!rec) return;
    if (!rec.outcome) setCell(rec, 'outcome', 'Call ended early');
    COLS.forEach(([k]) => {
      if (rec[k]) return;
      rec.cells[k].textContent = k === 'name' ? 'Unknown caller' : '—';
      const dd = panel.f[k];
      if (dd) { dd.textContent = 'Not needed on this call'; dd.classList.add('is-muted'); }
    });
    rec.tr.classList.remove('is-live');
    setStatus('saved', `Saved to row ${records.indexOf(rec) + 2}`);
    $('.sheet__count').textContent = `${records.length} call${records.length === 1 ? '' : 's'} logged`;
    dlBtn.disabled = false;
    rec = null;
  }

  dlBtn.addEventListener('click', () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [COLS.map(([, h]) => esc(h)).join(','), ...records.map(r => COLS.map(([k]) => esc(r[k])).join(','))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })); // BOM so Excel reads UTF-8
    a.download = 'voxa-call-log.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  async function say({ who, text, action, log }, i, my) {
    const el = document.createElement('div');
    el.className = `line line--${who === 'a' ? 'agent' : 'caller'} is-speaking`;
    el.innerHTML = `<span class="line__who">${who === 'a' ? 'Ava, Voxa agent' : 'Caller'}</span><span class="line__text"></span>`;
    const span = el.lastChild;
    transcript.append(el);
    transcript.scrollTop = transcript.scrollHeight;

    $('.console__kind').textContent = who === 'a' ? 'Ava is speaking' : 'Ava is listening…';
    const clip = soundBox.checked ? await startClip(src(scene, i)) : null;
    if (soundBox.checked && !clip) $('.console__kind').textContent = 'Your browser blocked the sound. Press End call, then Play again.';
    if (my !== run) { current?.stop(); return; }
    const ms = clip ? clip.ms : text.length * 30 + 300;
    let done = false;
    (clip ? clip.ended : wait(ms)).then(() => { done = true; });

    // Type in step with the audio; speech front-loads, so finish a touch early.
    const per = (ms * 0.9) / text.length;
    const t0 = performance.now();
    while (!done && my === run) {
      const n = Math.min(text.length, Math.ceil((performance.now() - t0) / per));
      if (span.textContent.length !== n) {
        span.textContent = text.slice(0, n);
        transcript.scrollTop = transcript.scrollHeight;
      }
      if (!clip || !voice.env) voice.target = 0.45 + Math.random() * 0.55;
      await wait(clip ? 40 : 90);
    }
    if (my !== run) return;
    span.textContent = text;
    el.classList.remove('is-speaking');
    transcript.scrollTop = transcript.scrollHeight;
    if (action) {
      const li = document.createElement('li');
      li.className = 'act';
      li.innerHTML = `<span><span class="act__text"></span><span class="act__time">${fmt(seconds)}</span></span>`;
      li.querySelector('.act__text').textContent = action;
      actions.append(li);
      window.gsap?.from(li, { opacity: 0, x: 16, duration: 0.5, ease: 'power3.out' });
    }
    if (log && rec) Object.entries(log).forEach(([k, v]) => setCell(rec, k, v));
  }

  async function play() {
    const my = ++run;
    playing = true;
    playBtn.textContent = 'End call';
    consoleEl.classList.add('is-live');
    transcript.innerHTML = '';
    showScene(false);
    $('.console__kind').textContent = `${scene.dir}, connected`;
    seconds = 0;
    clearInterval(timer);
    timer = setInterval(() => { seconds++; timerEl.textContent = fmt(seconds); }, 1000);
    addRecord();
    await wait(500); // ring connects
    for (let i = 0; i < scene.lines.length; i++) {
      if (my !== run) return;
      await say(scene.lines[i], i, my);
      const next = scene.lines[i + 1];
      // Real turn-taking: same speaker continues fast, a reply has a short beat.
      // Human turn-taking: a breath between her own sentences, a short varied beat before replying.
      await wait(!next ? 0 : next.who === scene.lines[i].who ? 220 : next.who === 'a' ? 280 + Math.random() * 380 : 450);
    }
    if (my !== run) return;
    finish('Call ended');
  }

  function finish(label) {
    playing = false;
    closeRecord();
    clearInterval(timer);
    playBtn.textContent = 'Play again';
    consoleEl.classList.remove('is-live');
    $('.console__kind').textContent = `${scene.dir}, ${label.toLowerCase()}`;
  }

  function stop() {
    if (!playing) return;
    run++;
    current?.stop();
    finish('Call ended');
  }

  playBtn.addEventListener('click', () => {
    if (playing) return stop();
    if (soundBox.checked) unlockAudio(); // must happen inside the click for Safari/iOS
    play();
  });
  soundBox.addEventListener('change', () => {
    if (!soundBox.checked) current?.stop();
  });

  /* ---------- missed-call calculator ---------- */
  const calcForm = $('.calc__inputs');
  const calcBig = $('.calc__big');
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const shown = { v: 0 };
  function calc() {
    const v = Object.fromEntries([...new FormData(calcForm)].map(([k, x]) => [k, +x]));
    $$('input', calcForm).forEach(i => i.style.setProperty('--fill', `${(i.value - i.min) / (i.max - i.min) * 100}%`));
    $('[data-for="calls"]').textContent = v.calls;
    $('[data-for="miss"]').textContent = `${v.miss}%`;
    $('[data-for="book"]').textContent = `${v.book}%`;
    $('[data-for="value"]').textContent = money(v.value);
    const missed = v.calls * 30 * v.miss / 100;
    const lost = missed * v.book / 100;
    const revenue = lost * v.value;
    $('[data-out="missed"]').textContent = Math.round(missed).toLocaleString('en-US');
    $('[data-out="lost"]').textContent = Math.round(lost).toLocaleString('en-US');
    $('[data-out="year"]').textContent = money(revenue * 12);
    if (window.gsap && !reduced) {
      gsap.to(shown, { v: revenue, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: () => { calcBig.textContent = money(shown.v); } });
    } else calcBig.textContent = money(revenue);
  }
  calcForm.addEventListener('input', calc);
  calcForm.addEventListener('submit', e => e.preventDefault());
  calc();

  /* ---------- pause looping CSS animations while their section is off-screen ---------- */
  const pauser = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-off', !e.isIntersecting)));
  $$('.busy, .integrations, .hero').forEach(sec => pauser.observe(sec));

  /* ---------- mobile menu ---------- */
  let lenis = null;
  const menu = $('#mobile-menu'), menuBtn = $('.nav__menu');
  const setMenu = open => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open);
    $('.nav').classList.toggle('is-open', open);
    $('.nav').classList.remove('is-hidden');
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

  /* ---------- never-busy grid ---------- */
  const TILES = 48;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  const board = $('.busy__board');
  const svg = el('svg', { viewBox: '0 0 600 600' });
  const RINGS = [[130, 12, 0.2], [200, 16, 0.5], [270, 20, 0.05]]; // radius, callers, angle offset
  RINGS.forEach(([r], k) => svg.append(el('circle', { class: `orbit${k === 1 ? ' orbit--spin' : k === 2 ? ' orbit--spin rev' : ''}`, cx: 300, cy: 300, r })));

  const callers = [];
  RINGS.forEach(([r, count, off]) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + off - Math.PI / 2;
      const x = 300 + Math.cos(a) * r, y = 300 + Math.sin(a) * r;
      const g = el('g', { class: 'caller' });
      g.style.cssText = `--d:${(-Math.random() * 3).toFixed(2)}s;--bx:${(Math.random() * 8 - 4).toFixed(1)}px;--by:${(Math.random() * 8 - 4).toFixed(1)}px`;
      const line = { x1: x, y1: y, x2: 300, y2: 300, pathLength: 1 };
      g.append(el('line', { class: 'caller__line', ...line }), el('line', { class: 'caller__sig', ...line }),
        el('circle', { class: 'caller__ring', cx: x, cy: y, r: 8 }), el('circle', { class: 'caller__dot', cx: x, cy: y, r: 8 }));
      svg.append(g);
      callers.push({ g, x, y, a });
    }
  });
  const hub = el('g', { class: 'hub' });
  hub.append(el('circle', { class: 'hub__glow', cx: 300, cy: 300, r: 92 }),
    el('circle', { class: 'hub__pulse', cx: 300, cy: 300, r: 58 }), el('circle', { class: 'hub__pulse', cx: 300, cy: 300, r: 58 }),
    el('circle', { class: 'hub__core', cx: 300, cy: 300, r: 58 }));
  const bars = el('g', { class: 'hub__bars' });
  [[274, 290, 20], [287, 274, 52], [300, 283, 34], [313, 293, 14]].forEach(([x, y, h]) => bars.append(el('rect', { x, y, width: 9, height: h, rx: 4.5 })));
  hub.append(bars);
  svg.append(hub);
  board.append(svg);

  // Light order: the front-desk caller first (top of the inner ring), then scattered.
  const order = [0, ...callers.map((_, i) => i).slice(1).sort((p, q) => (p * 29) % 47 - (q * 29) % 47)];
  callers[0].g.classList.add('is-first');

  // A few callers say what they want, on the middle ring.
  const CHIPS = [[12, 'Booking a cleaning'], [15, '2 large pepperoni'], [18, 'No heat, urgent'], [21, "Where's my order?"], [24, 'Hablo español']];
  const chips = CHIPS.map(([i, text]) => {
    const c = document.createElement('span');
    c.className = 'chip'; c.textContent = text;
    c.style.left = `${callers[i].x / 6}%`; c.style.top = `${callers[i].y / 6}%`;
    board.append(c);
    return { c, i };
  });

  let busyN = -1;
  const setBusy = n => {
    if (n === busyN) return;
    busyN = n;
    const lit = new Set(order.slice(0, n));
    callers.forEach((c, i) => c.g.classList.toggle('on', lit.has(i)));
    chips.forEach(({ c, i }) => c.classList.toggle('on', lit.has(i)));
    board.style.setProperty('--load', (n / TILES).toFixed(3));
    $('.busy__count').textContent = n;
  };
  setBusy(reduced || !window.gsap ? TILES : 1);

  /* ---------- everything below needs GSAP ---------- */
  const loader = $('.loader');
  if (!window.gsap || !window.ScrollTrigger) { loader.remove(); return; }
  gsap.registerPlugin(ScrollTrigger, ...(window.SplitText ? [SplitText] : []));
  if (!reduced) root.classList.add('anim');

  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains('skip')) return;
    const target = a.getAttribute('href') === '#top' ? 0 : $(a.getAttribute('href'));
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else (target || document.body).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });

  /* nav: theme follows the section underneath, hides on scroll down */
  const nav = $('.nav');
  $$('[data-nav]').forEach(sec => ScrollTrigger.create({
    trigger: sec, start: 'top 36px', end: 'bottom 36px',
    onToggle: s => { if (s.isActive) nav.dataset.theme = sec.dataset.nav; },
  }));
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: s => {
      const y = s.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', s.direction === 1 && y > 300);
    },
  });

  /* cursor + magnetic buttons */
  if (finePointer && !reduced) {
    const cur = $('.cursor'), label = $('.cursor__label');
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); cur.classList.add('is-on'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('a, button, summary, label, .ind__row, [data-cursor]');
      const text = t?.dataset.cursor;
      cur.classList.toggle('is-link', !!t && !text);
      cur.classList.toggle('is-label', !!text);
      if (text) label.textContent = text;
    });

    $$('[data-magnetic]').forEach(el => {
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.3);
        y((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(2500)]);

  fontsReady.then(() => {
    const hasSplit = !!window.SplitText;
    const padMasks = self => self.masks?.forEach(m => m.classList.add('mask-line'));

    /* hero: split letters, they stretch like a level meter */
    let chars = [];
    if (hasSplit) {
      const split = SplitText.create('.hero__row', { type: 'lines,chars', mask: 'lines', charsClass: 'ch' });
      padMasks(split);
      chars = split.chars;
    }

    /* loader → hero intro */
    const intro = gsap.timeline({ paused: true });
    if (chars.length && !reduced) intro.from(chars, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.025 });
    intro.from('.hero__side > *, .hero__status', { opacity: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, '-=0.9');

    if (reduced) {
      loader.remove();
    } else {
      document.body.classList.add('is-loading');
      lenis?.stop();
      const count = { v: 0 };
      gsap.timeline({
        onComplete: () => { loader.remove(); document.body.classList.remove('is-loading'); lenis?.start(); },
      })
        .to(count, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { $('.loader__num').textContent = Math.round(count.v); } })
        .to('.loader__line span', { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
        .fromTo('.loader__word', { '--w': 62 }, { '--w': 125, duration: 1.3, ease: 'power2.inOut' }, 0)
        .to('.loader__word, .loader__line, .loader__count', { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' }, '+=0.1')
        .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' })
        .add(() => intro.play(), '-=0.45');
    }

    if (chars.length && !reduced && finePointer) { // follows the cursor; no point burning battery on touch
      const title = $('.hero__title');
      let centers = [], mx = -1e4, my = -1e4, heroOn = true;
      const measure = () => {
        centers = chars.map(c => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2 + scrollY]; });
      };
      measure();
      addEventListener('resize', measure);
      $('.hero').addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY + scrollY; });
      $('.hero').addEventListener('pointerleave', () => { mx = my = -1e4; });
      new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(title);
      const stretch = chars.map(() => 72);
      gsap.ticker.add(time => {
        if (!heroOn) return;
        const lvl = talk(time);
        chars.forEach((c, i) => {
          const [cx, cy] = centers[i];
          const d = Math.hypot(mx - cx, (my - cy) * 1.4);
          const near = Math.max(0, 1 - d / 320);
          const target = 72 + near * near * 53 + Math.sin(time * 3 - i * 0.45) * 5 * lvl;
          stretch[i] += (target - stretch[i]) * 0.12;
          c.style.fontStretch = `${Math.min(125, stretch[i]).toFixed(1)}%`;
        });
      });
      ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onLeaveBack: measure });
    }

    if (reduced) return;

    /* hero folds away: inset with rounded bottom corners */
    gsap.fromTo('.hero', { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)' }, {
      clipPath: 'inset(0% 2.5% 8% 2.5% round 0px 0px 48px 48px)', ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    /* hero parallax out */
    gsap.to('.hero__inner', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* heading line reveals */
    if (hasSplit) {
      $$('[data-reveal]').forEach(el => SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          padMasks(self);
          return gsap.from(self.lines, {
            yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          });
        },
      }));

      /* statement fills in word by word as you scroll */
      const st = SplitText.create('[data-scrub]', { type: 'words', wordsClass: 'word' });
      gsap.to(st.words, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: '.statement', start: 'top 70%', end: 'bottom 60%', scrub: true },
      });
    }

    /* agent cards rise into place as you scroll, in a soft left-to-right wave */
    const cards = $$('.agent');
    const colOf = c => Math.round((c.offsetLeft - cards[0].offsetLeft) / (c.offsetWidth + 16));
    cards.forEach(card => {
      gsap.fromTo(card, { y: 140, scale: 0.94, opacity: 0 }, {
        y: 0, scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: {
          trigger: card, scrub: 0.6, invalidateOnRefresh: true,
          start: () => `top ${100 - colOf(card) * 6}%`,
          end: () => `top ${64 - colOf(card) * 6}%`,
        },
      });
      gsap.from(card.querySelectorAll('.say, .agent__result'), {
        opacity: 0, y: 14, duration: 0.6, ease: 'power3.out', stagger: 0.3,
        scrollTrigger: { trigger: card, start: 'top 78%', once: true }, // card is measured 140px low (rise tween start)
      });
    });

    /* process: progress line + active step */
    const PHASES = [[2, 'Mapping your calls'], [6, 'Building your agent'], [9, 'Trying to break it'], [10, 'Live and tuning']];
    const dayN = $('.days__n'), dayNow = $('.days__now'), dayCells = $$('.days__strip span');
    let day = 0;
    const setDay = d => {
      if (d === day) return;
      day = d;
      dayN.textContent = d;
      gsap.fromTo(dayN, { '--w': 110 }, { '--w': 70, duration: 0.6, ease: 'expo.out' });
      dayCells.forEach((c, i) => { c.classList.toggle('done', i < d - 1); c.classList.toggle('now', i === d - 1); });
      const phase = PHASES.find(([last]) => d <= last)[1];
      if (dayNow.textContent !== phase) {
        dayNow.textContent = phase;
        gsap.from(dayNow, { y: 10, opacity: 0, duration: 0.4, ease: 'power3.out' });
      }
    };
    setDay(1);
    gsap.to('.steps-wrap, .steps', {
      '--p': 1, ease: 'none',
      scrollTrigger: {
        trigger: '.steps', start: 'top 60%', end: 'bottom 60%', scrub: true,
        onUpdate: s => setDay(Math.min(10, 1 + Math.floor(s.progress * 10))),
      },
    });
    $$('.step > div').forEach(d => gsap.from(d, {
      x: () => innerWidth < 900 ? 36 : 90, ease: 'none',
      scrollTrigger: { trigger: d, start: 'top 95%', end: 'top 60%', scrub: 0.5 },
    }));
    $$('.step').forEach(step => ScrollTrigger.create({
      trigger: step, start: 'top 62%',
      onEnter: () => step.classList.add('is-active'),
      onLeaveBack: () => step.classList.remove('is-active'),
    }));

    /* facts: numbers count up while the type stretches open */
    const factsIn = { trigger: '.facts', start: 'top 80%', once: true };
    gsap.fromTo('.fact dd', { '--w': 60, opacity: 0, y: 40 }, { '--w': 78, opacity: 1, y: 0, duration: 1.6, ease: 'expo.out', stagger: 0.08, scrollTrigger: factsIn });
    $$('[data-count]').forEach(el => {
      const o = { v: 0 }, to = +el.dataset.count;
      el.textContent = 0;
      gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', scrollTrigger: factsIn, onUpdate: () => { el.textContent = Math.round(o.v); } });
    });

    /* never busy: callers ring in and wire up to the hub as you scroll (pinned on desktop) */
    gsap.matchMedia().add({ desk: '(min-width: 900px)', mob: '(max-width: 899px)' }, ctx => {
      const desk = ctx.conditions.desk;
      ScrollTrigger.create({
        trigger: desk ? '.busy__pin' : '.busy__board',
        start: desk ? 'top top' : 'top 75%',
        end: desk ? '+=130%' : 'bottom 35%',
        pin: desk, scrub: true,
        refreshPriority: 1, // its pin spacing must exist before later sections measure
        onUpdate: s => setBusy(Math.max(1, Math.round(s.progress * TILES))),
      });
    });

    /* demo console opens up as it arrives */
    gsap.fromTo('.console',
      { clipPath: 'inset(10% 8% 10% 8% round 40px)', scale: 0.94 },
      { clipPath: 'inset(-3% -3% -3% -3% round 0px)', scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.console', start: 'top 95%', end: 'top 40%', scrub: true } });

    /* industries sweep in */
    gsap.from('.ind__row', {
      xPercent: -6, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: '.ind', start: 'top 80%', once: true },
    });

    /* calculator panels rise, total counts up from zero */
    gsap.from('.calc__inputs, .calc__result', {
      y: 90, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '.calc__body', start: 'top 85%', once: true, onEnter: () => { shown.v = 0; calc(); } },
    });

    /* faq */
    gsap.from('.faq details', {
      y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: '.faq__list', start: 'top 85%', once: true },
    });

    /* closing headline stretches open */
    gsap.fromTo('.cta__title', { '--w': 60 }, {
      '--w': 80, ease: 'none',
      scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true },
    });

    /* marquee speeds up with scroll velocity */
    const mq = $('.marquee__track').getAnimations?.()[0];
    if (mq && lenis) {
      lenis.on('scroll', ({ velocity }) => {
        mq.playbackRate = 1 + Math.min(Math.abs(velocity) * 0.25, 5);
      });
    }

    /* footer wordmark stretches open */
    gsap.fromTo('.footer__word', { '--w': 62 }, {
      '--w': 125, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });

    ScrollTrigger.refresh();
  });
})();
