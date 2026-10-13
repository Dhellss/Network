/* =========================================================
   Dhellskieee Portfolio  |  script.js
   Lahat ng galaw nandito: boot loader, animated background,
   terminal, project network (naka-connect sa GitHub),
   contact handshake at mga maliliit na effects.
   ========================================================= */
(function () {
  'use strict';

  // Sinasabi sa CSS na gumagana ang JavaScript (para sa reveal animations).
  document.documentElement.classList.add('js');

  /* ---------- 1. Helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  // Seeded random: pare-pareho ang layout tuwing bubuksan ang page.
  function mulberry32(seed) {
    let a = seed;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const DATE_LONG = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
  const fmtDate = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', DATE_LONG);

  function flash(node, cls) {
    const c = cls || 'is-pinged';
    node.classList.remove(c);
    void node.offsetWidth; // para mag-restart ang CSS animation
    node.classList.add(c);
    clearTimeout(node.flashTimer);
    node.flashTimer = setTimeout(() => node.classList.remove(c), 850);
  }

  /* ---------- 2. Colors (galing sa CSS variables ng style.css) ---------- */
  const rootStyle = getComputedStyle(document.documentElement);
  const token = (name, fallback) => rootStyle.getPropertyValue(name).trim() || fallback;
  const COLOR = {
    bg: token('--bg', '#030403'),
    panel: token('--panel', '#090c0a'),
    text: token('--text', '#e8ede4'),
    signal: token('--signal', '#c8f560'),
    deploy: token('--deploy', '#e8ede4'),
    stream: token('--stream-2', '#6fcff6'),
  };

  function rgba(hex, alpha) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  /* ---------- 3. Data ---------- */
  const GITHUB = 'https://github.com/Dhellss';
  const PAGES = 'https://dhellss.github.io/';
  let publicRepos = 28; // na-save noong Oct 13, 2026; ina-update ng refreshGitHub() kapag may internet

  // Mga folder sa network. anchor = puwesto sa map (0 hanggang 1).
  const GROUPS = [
    { id: 'games', label: 'games/', name: 'Games', tag: 'Game Dev', anchor: [0.78, 0.66] },
    { id: 'web', label: 'web-apps/', name: 'Web apps', tag: 'Web Dev', anchor: [0.76, 0.18] },
    { id: 'software', label: 'software/', name: 'Software', tag: 'Software Dev', anchor: [0.24, 0.2] },
    { id: 'designs', label: 'portfolios/', name: 'Portfolio designs', tag: 'Web Dev', anchor: [0.22, 0.72] },
  ];

  // Lahat ng projects. Para magdagdag: kopyahin ang isang item at palitan ang laman.
  //   repo   : pangalan ng repo sa github.com/Dhellss/
  //   live   : link ng GitHub Pages (null kung code lang)
  //   pushed : huling push (YYYY-MM-DD)
  const PROJECTS = [
    // Software
    { id: 'linux-system-observatory', group: 'software', title: 'Linux System Observatory', year: '2026', repo: 'linux-system-observatory', live: null, pushed: '2026-10-05', stack: ['Python', 'Qt', 'Linux'],
      desc: 'A desktop system monitor for Linux: CPU, GPU, memory, storage, sensors, services and processes in one Qt interface. Runs fully offline, with no telemetry.' },
    { id: 'lifeos', group: 'software', title: 'LifeOS', year: '2026', repo: 'LifeOS', live: null, pushed: '2026-10-05', stack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL'],
      desc: 'A personal operating system for tasks, projects, habits, study, fitness, calendar and journalling, with XP, achievements and analytics computed from your own records. Real auth, real database, 253 tests.' },
    { id: 'student-management-system', group: 'software', title: 'Student Management System', year: '2026', repo: 'student-management-system', live: null, pushed: '2026-09-21', stack: ['Python', 'Flask', 'SQLite'],
      desc: 'A Flask and SQLite web app for students, subjects, enrollment and grades, including GWA on the Philippine 1.00 to 5.00 scale.' },

    // Web apps
    { id: 'sqdhell', group: 'web', title: 'SQDhell', year: '2026', repo: 'SQL-Learning', live: PAGES + 'SQL-Learning/', pushed: '2026-09-21', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'An interactive SQL tutorial you work through in the browser, lesson by lesson.' },
    { id: 'mysql-playground', group: 'web', title: 'MySQL Playground', year: '2026', repo: 'SQL-Practice', live: PAGES + 'SQL-Practice/MYSQL%20WEB/', pushed: '2026-09-22', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'A terminal-themed sandbox for practising MySQL queries without installing a database.' },
    { id: 'notely', group: 'web', title: 'Notely', year: '2026', repo: 'Notely', live: null, pushed: '2026-10-05', stack: ['React', 'Vite', 'JavaScript', 'CSS'],
      desc: 'A notes app with a proper design system: pin, tag, archive, search and sort, plus light and dark themes built as two separate palettes. No backend and no accounts; everything lives in your browser.' },

    // Games
    { id: 'dash-break', group: 'games', title: 'DASH//BREAK', year: '2026', repo: 'dash-break', live: PAGES + 'dash-break/', pushed: '2026-10-08', stack: ['TypeScript', 'Three.js', 'Vite'],
      desc: 'An isometric 3D bullet-hell arena. Four dashes with no cooldown and one attack dash; press them together for eleven combos, up to the ZERO//BREAK ultimate. Seven enemy types, a three-phase boss, and music generated in code.' },
    { id: 'below-100m', group: 'games', title: 'Below 100m', year: '2026', repo: 'Below_100m', live: null, pushed: '2026-10-07', isNew: true, stack: ['HTML', 'CSS', 'JavaScript', 'Web Audio'],
      desc: 'A small underwater diving game. Swim down into a blue hole, find treasure and get back up before your air runs out. Sell what you bring up, upgrade your gear and go deeper. Something is waiting at 100 metres.' },
    { id: 'the-last-room', group: 'games', title: 'The Last Room', year: '2026', repo: 'the-last-room', live: PAGES + 'the-last-room/', pushed: '2026-10-05', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: "A mystery set in one room. It's always 11:43, and whenever you look away something changes: the photograph, the chair, the street outside. Three endings, decided by what you notice." },
    { id: 'zombie-night', group: 'games', title: 'Zombie Night', year: '2026', repo: 'zombie-night', live: PAGES + 'zombie-night/', pushed: '2026-10-05', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'A top-down zombie survival shooter. Hold a dark intersection against waves of walkers, runners and tanks, then spend your coins on upgrades between waves.' },
    { id: 'tetris', group: 'games', title: 'Tetris', year: '2026', repo: 'tetris', live: PAGES + 'tetris/', pushed: '2026-10-02', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'A modern Tetris with full SRS wall kicks and T-spins, plus an animated guide that teaches how spins actually work.' },
    { id: 'projectbato', group: 'games', title: 'ProjectBato', year: '2026', repo: 'ProjectBato', live: PAGES + 'ProjectBato/', pushed: '2026-09-21', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'An underwater arcade game where you play a crocodile that eats money to survive while dodging harmful obstacles.' },
    { id: 'pulse', group: 'games', title: 'pulse', year: '2026', repo: 'pulse', live: PAGES + 'pulse/', pushed: '2026-09-21', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'Rings collapse toward the centre. Hit each one the moment it crosses the lock ring.' },
    { id: 'keycrack', group: 'games', title: 'keycrack', year: '2026', repo: 'keycrack', live: PAGES + 'keycrack/', pushed: '2026-09-21', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'Every lock holds a key of four different symbols. Guess, read the feedback, and cut down what is left.' },
    { id: 'handshake', group: 'games', title: 'handshake', year: '2026', repo: 'handshake', live: PAGES + 'handshake/', pushed: '2026-09-21', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'A signal flashes across nine nodes. Then the whole board turns a quarter, and you repeat it.' },
    { id: 'inject', group: 'games', title: 'inject', year: '2026', repo: 'inject', live: PAGES + 'inject/', pushed: '2026-09-21', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'Processes are dropping into the kernel. Type a name to kill it before it lands.' },
    { id: 'kernel-route', group: 'games', title: 'kernel-route', year: '2026', repo: 'kernel-route', live: PAGES + 'kernel-route/', pushed: '2026-09-21', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'Every node on the grid is dead except the core. Turn the links until the signal reaches all of them.' },
    { id: 'patrol', group: 'games', title: 'patrol', year: '2026', repo: 'patrol', live: PAGES + 'patrol/', pushed: '2026-09-23', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'Grab every file and reach the stairs. The cameras turn a quarter every time you move.' },

    // Portfolio designs
    { id: 'dragon', group: 'designs', title: 'Dragon', year: '2026', repo: 'Dragon', live: PAGES + 'Dragon/', pushed: '2026-09-23', stack: ['HTML', 'CSS', 'JavaScript', 'Three.js'],
      desc: 'A one-page portfolio with a 3D dragon guarding a glowing orb, with terminal windows layered on top.' },
    { id: 'os', group: 'designs', title: 'OS', year: '2026', repo: 'OS', live: PAGES + 'OS/', pushed: '2026-09-23', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'A fake desktop OS as a portfolio: icons, draggable windows and a dock instead of a normal page.' },
    { id: 'terminal', group: 'designs', title: 'Terminal', year: '2026', repo: 'Terminal', live: PAGES + 'Terminal/', pushed: '2026-09-23', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'A portfolio you navigate by typing commands into a working terminal.' },
    { id: 'readme', group: 'designs', title: 'Readme', year: '2026', repo: 'Readme', live: PAGES + 'Readme/', pushed: '2026-09-23', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'A quiet, text-first portfolio styled like a project README file.' },
    { id: 'grid', group: 'designs', title: 'Grid', year: '2026', repo: 'Grid', live: PAGES + 'Grid/', pushed: '2026-09-23', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'A dashboard-style portfolio: bordered cells laid out in a grid with a sidebar nav.' },
    { id: 'prompt', group: 'designs', title: 'Prompt', year: '2026', repo: 'Prompt', live: PAGES + 'Prompt/', pushed: '2026-09-23', stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'A minimal command-prompt portfolio that types itself out, navigated with keyboard shortcuts.' },
  ];
  PROJECTS.forEach((p) => {
    p.img = 'assets/projects/' + p.id + '.webp';
  });

  const groupOf = (p) => GROUPS.find((g) => g.id === p.group);
  const latestProject = () => PROJECTS.slice().sort((a, b) => (a.pushed < b.pushed ? 1 : a.pushed > b.pushed ? -1 : 0))[0];

  /* ---------- 4. Icons ---------- */
  const ICONS = {
    branch: '<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="8" r="2.2"/><path d="M6 7.2v9.6M18 10.2c0 4-4 4.2-9.8 6.4"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    play: '<path d="M8 5.5l10 6.5-10 6.5z"/>',
    code: '<path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5.5"/>',
    left: '<path d="M14.5 6l-6 6 6 6"/>',
    right: '<path d="M9.5 6l6 6-6 6"/>',
  };
  const svg = (name) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    ICONS[name] +
    '</svg>';

  function linkBtn(href, label, variant, iconName) {
    const a = el('a', 'btn btn--sm btn--' + variant);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = svg(iconName);
    a.append(document.createTextNode(label));
    return a;
  }

  /* ---------- 5. Background: particle network + light stream ---------- */
  const bg = (function () {
    const canvas = $('#bg');
    const ctx = canvas.getContext('2d');
    const spot = $('#spot');
    const rnd = mulberry32(42);
    const mouse = { x: -9999, y: -9999, nx: 0, ny: 0, sx: -9999, sy: -9999, on: false };
    const packets = [];
    let W = 0;
    let H = 0;
    let lastW = 0;
    let small = false;
    let pts = [];
    let strong = [];
    let lines = 32;
    let seg = 110;
    const seeds = Array.from({ length: 40 }, (_, i) => {
      const x = Math.sin(i * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      small = W < 700;
      lines = small ? 18 : 32;
      seg = small ? 60 : 110;
      // Bagong points lang kapag nagbago ang lapad (iwas "talon" sa mobile scroll).
      if (Math.abs(W - lastW) > 40 || !pts.length) {
        lastW = W;
        const n = small ? 44 : Math.round(clamp((W * H) / 14500, 70, 140));
        pts = Array.from({ length: n }, () => ({
          x: rnd() * W,
          y: rnd() * (H + 120) - 60,
          z: 0.3 + rnd() * 0.7,
          vx: (rnd() - 0.5) * 0.22,
          vy: (rnd() - 0.5) * 0.22,
          lime: rnd() < 0.24,
          ph: rnd() * 6.28,
          sx: 0,
          sy: 0,
        }));
      }
    }

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.nx = e.clientX / W - 0.5;
      mouse.ny = e.clientY / H - 0.5;
      if (!mouse.on) {
        mouse.sx = mouse.x;
        mouse.sy = mouse.y;
      }
      mouse.on = true;
    }, { passive: true });
    window.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget) mouse.on = false;
    });

    // Light stream: isang ribbon ng ilaw na tumatawid sa screen.
    const centre = (t, time, s) =>
      H * (0.9 - 0.66 * t) +
      H * 0.09 * Math.sin(t * Math.PI * 2 + time * 0.00014 + s * 4.2) +
      mouse.ny * H * 0.08 * Math.sin(Math.PI * t);
    const spread = (t, time, s) =>
      H * 0.13 * Math.pow(Math.sin(Math.PI * t), 1.2) * Math.cos(t * 3.3 - time * 0.00028 + s * 3.4);

    function drawStream(time, s) {
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createLinearGradient(0, H, W, 0);
      grad.addColorStop(0, rgba(COLOR.signal, 0));
      grad.addColorStop(0.28, rgba(COLOR.signal, 1));
      grad.addColorStop(0.62, rgba(COLOR.stream, 1));
      grad.addColorStop(1, rgba(COLOR.text, 0));
      ctx.strokeStyle = grad;
      ctx.lineCap = 'round';

      [[56, 0.04], [20, 0.06]].forEach((pass) => {
        ctx.globalAlpha = pass[1];
        ctx.lineWidth = pass[0];
        ctx.beginPath();
        for (let k = 0; k <= seg; k++) {
          const t = k / seg;
          const x = -0.1 * W + t * 1.2 * W;
          const y = centre(t, time, s);
          if (k) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      });

      ctx.lineWidth = 1;
      for (let i = 0; i < lines; i++) {
        const u = i / (lines - 1) - 0.5;
        ctx.globalAlpha = 0.09 + 0.26 * seeds[i];
        ctx.beginPath();
        for (let k = 0; k <= seg; k++) {
          const t = k / seg;
          const x = -0.1 * W + t * 1.2 * W;
          const y = centre(t, time, s) + u * 2 * spread(t, time, s) + Math.sin(t * 9 + i * 0.8 + time * 0.0007) * 2;
          if (k) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function draw(time, dt, scrollY, scrollP) {
      ctx.clearRect(0, 0, W, H);
      drawStream(time, scrollP);

      // Points: gumagalaw, may depth (z), at may parallax kapag nag-scroll.
      const span = H + 120;
      const move = dt * 60;
      for (const p of pts) {
        p.x += p.vx * move;
        p.y += p.vy * move;
        if (p.x < -40) p.x += W + 80;
        else if (p.x > W + 40) p.x -= W + 80;
        p.sx = p.x + mouse.nx * 24 * p.z;
        let sy = (p.y - scrollY * 0.28 * p.z) % span;
        if (sy < 0) sy += span;
        p.sy = sy - 60 + mouse.ny * 16 * p.z;
      }

      // Mga linya sa pagitan ng magkakalapit na points
      strong = [];
      const maxD = small ? 110 : 145;
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const lim = maxD * (a.z + b.z) * 0.5;
          const d2 = dx * dx + dy * dy;
          if (d2 > lim * lim) continue;
          const k = 1 - Math.sqrt(d2) / lim;
          const alpha = k * 0.3 * Math.min(a.z, b.z);
          ctx.strokeStyle = a.lime || b.lime ? rgba(COLOR.signal, alpha * 1.2) : rgba(COLOR.text, alpha * 0.55);
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
          if (k > 0.3) strong.push(i, j);
        }
      }

      // Ang mouse ay nagiging isang node din: kumokonekta sa mga malapit na points.
      if (mouse.on) {
        for (const p of pts) {
          const dx = p.sx - mouse.x;
          const dy = p.sy - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > 190) continue;
          const k = 1 - d / 190;
          ctx.strokeStyle = rgba(COLOR.signal, k * 0.55);
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.sx, p.sy);
          ctx.stroke();
          p.near = k;
        }
      }

      // Packets na tumatakbo sa mga linya
      if (strong.length && Math.random() < dt * (small ? 4 : 9)) {
        const k = (Math.floor(Math.random() * (strong.length / 2)) * 2);
        const flip = Math.random() < 0.5;
        packets.push({ a: strong[flip ? k : k + 1], b: strong[flip ? k + 1 : k], t: 0, v: rand(0.7, 1.4) });
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i];
        pk.t += pk.v * dt;
        if (pk.t >= 1) {
          packets.splice(i, 1);
          continue;
        }
        const a = pts[pk.a];
        const b = pts[pk.b];
        if (!a || !b) {
          packets.splice(i, 1);
          continue;
        }
        const x = lerp(a.sx, b.sx, pk.t);
        const y = lerp(a.sy, b.sy, pk.t);
        ctx.fillStyle = rgba(COLOR.signal, 0.16);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLOR.signal;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Points
      for (const p of pts) {
        const tw = 0.5 + 0.5 * Math.sin(time * 0.002 + p.ph);
        const near = mouse.on ? p.near || 0 : 0;
        const alpha = clamp(0.16 + p.z * 0.5 + tw * 0.15 + near * 0.5, 0, 1);
        ctx.fillStyle = p.lime || near > 0.2 ? rgba(COLOR.signal, alpha) : rgba(COLOR.text, alpha * 0.8);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 0.6 + p.z * 1.5 + near * 1.2, 0, Math.PI * 2);
        ctx.fill();
        p.near = 0;
      }
    }

    function spotlight() {
      if (!mouse.on) {
        if (mouse.sx !== -9999) {
          mouse.sx = -9999;
          spot.style.setProperty('--mx', '-999px');
          spot.style.setProperty('--my', '-999px');
        }
        return;
      }
      mouse.sx = lerp(mouse.sx, mouse.x, 0.22);
      mouse.sy = lerp(mouse.sy, mouse.y, 0.22);
      spot.style.setProperty('--mx', mouse.sx.toFixed(1) + 'px');
      spot.style.setProperty('--my', mouse.sy.toFixed(1) + 'px');
    }

    return { resize, draw, spotlight, mouse };
  })();

  /* ---------- 6. Text scramble ---------- */
  const GLYPHS = '01<>/_#$%&*+=?';

  function scramble(node, duration) {
    const final = node.dataset.text || node.textContent;
    node.dataset.text = final;
    if (reduceMotion || node.scrambling) return;
    node.scrambling = true;
    const t0 = performance.now();
    const dur = duration || 750;
    node.setAttribute('aria-label', final);
    function frame(now) {
      const k = clamp((now - t0) / dur, 0, 1);
      const shown = Math.floor(k * final.length);
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const c = final[i];
        out += i < shown || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.textContent = out;
      if (k < 1) {
        requestAnimationFrame(frame);
      } else {
        node.textContent = final;
        node.removeAttribute('aria-label');
        node.scrambling = false;
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 7. Hero terminal ---------- */
  const termBody = $('#termBody');
  const caret = el('span', 'caret');
  let heroVisible = true;

  const TERM_SCRIPT = () => [
    { cmd: 'whoami', out: [['Dhellmar Feliciano Mahilum', '']] },
    { cmd: 'cat role.txt', out: [['"Computer Science Student" @ University of the Cordilleras', 'str']] },
    { cmd: 'ls interests/', out: [['vibe-coding/  programming/  ethical-hacking/', 'dir'], ['cyber-security/  game-dev/  web-dev/', 'dir'], ['software-dev/  ui-ux/  system-dev/  ai/', 'dir']] },
    { cmd: 'git remote -v', out: [['origin  github.com/Dhellss  (' + publicRepos + ' public repos)', 'ok']] },
  ];
  const TERM_LOOP = [
    ['sudo make coffee', '[ok] brewing... done', 'ok'],
    ['npm run build', '[ok] built in 0.4s', 'ok'],
    ['ping dhellmar', "reply: let's talk!", ''],
    ['git commit -m "it works"', '[ok] 1 file changed', 'ok'],
    ['cat motto.txt', '"I love the creation"', 'str'],
    ['ls ~/projects | wc -l', String(PROJECTS.length), ''],
  ];

  function termLine() {
    const line = el('div', 't-line is-new');
    termBody.append(line);
    // Tanggalin ang pinakaunang linya kapag puno na ang terminal.
    while (termBody.scrollHeight > termBody.clientHeight + 2 && termBody.children.length > 1) {
      termBody.firstElementChild.remove();
    }
    return line;
  }

  function promptLine() {
    const line = termLine();
    line.append(el('span', 't-user', 'dhell@github'), el('span', 't-path', ':~$ '));
    return line;
  }

  async function typeCommand(cmd) {
    const line = promptLine();
    const cmdEl = el('span', 't-cmd', '');
    line.append(cmdEl, caret);
    if (reduceMotion) {
      cmdEl.textContent = cmd;
      return;
    }
    for (const ch of cmd) {
      cmdEl.textContent += ch;
      await wait(rand(26, 66));
    }
    await wait(170);
  }

  function printOut(text, kind) {
    const line = termLine();
    line.append(el('span', 't-out' + (kind ? ' is-' + kind : ''), text));
  }

  async function runTerminal() {
    for (const step of TERM_SCRIPT()) {
      await typeCommand(step.cmd);
      step.out.forEach((o) => printOut(o[0], o[1]));
      await wait(reduceMotion ? 0 : 380);
    }
    let idle = promptLine();
    idle.append(caret);
    if (reduceMotion) return;
    let i = 0;
    for (;;) {
      await wait(4200);
      if (!heroVisible || document.hidden) continue;
      idle.remove();
      const item = TERM_LOOP[i++ % TERM_LOOP.length];
      await typeCommand(item[0]);
      printOut(item[1], item[2]);
      idle = promptLine();
      idle.append(caret);
    }
  }

  /* ---------- 8. Project network (lahat naka-connect sa GitHub) ---------- */
  const net = (function () {
    const wrap = $('#net');
    const stage = $('.net__stage', wrap);
    const map = $('#netMap');
    const canvas = $('#netCanvas');
    const ctx = canvas.getContext('2d');
    const inspector = $('#inspector');
    const list = $('#netList');
    const backdrop = $('#sheetBackdrop');
    const filtersEl = $('#filters');
    const pauseBtn = $('#toolPause');
    const sheetMQ = window.matchMedia('(max-width: 760px)');

    const S = {
      W: 0,
      H: 0,
      scale: 1,
      mode: 'graph',
      filter: 'all',
      active: null,
      selected: null,
      paused: false,
      visible: false,
      entered: false,
      ready: false,
      view: 'map',
      drag: null,
      tween: null,
      lastWidth: 0,
      sheetOpen: false,
      returnFocus: null,
    };
    const nodes = [];
    const edges = [];
    const packets = [];
    let hotEdges = new Set();
    let selEdges = new Set();

    /* --- Build nodes and edges --- */
    function makeNode(type, data) {
      const n = { type, data, id: type === 'hub' ? 'hub' : data.id, x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, ex: 0, ey: 0, children: [], dim: false, hidden: false, dragging: false };
      const b = el('button', 'gnode gnode--' + type);
      b.type = 'button';
      if (type === 'hub') {
        b.innerHTML = '<span class="gnode__icon">' + svg('branch') + '</span>';
        const text = el('span', 'gnode__hubtext');
        n.subEl = el('span', 'gnode__hubsub', publicRepos + ' public repos');
        text.append(el('span', 'gnode__hubname', 'github.com/Dhellss'), n.subEl);
        b.append(text);
        b.setAttribute('aria-label', 'GitHub profile github.com/Dhellss. Show details');
      } else if (type === 'group') {
        b.innerHTML = svg('folder');
        const count = PROJECTS.filter((p) => p.group === data.id).length;
        b.append(el('span', 'gnode__label', data.label), el('span', 'gnode__count', String(count)));
        b.setAttribute('aria-label', 'Show only ' + data.name + ', ' + count + ' projects');
      } else {
        b.append(el('i', 'ldot' + (data.live ? ' is-live' : '')), el('span', 'gnode__label', data.title));
        if (data.isNew) b.append(el('span', 'gnode__new', 'new'));
        b.setAttribute('aria-label', data.title + ', ' + groupOf(data).name + '. Show details');
      }
      n.el = b;
      map.append(b);
      nodes.push(n);
      attachPointer(n);
      return n;
    }

    const hub = makeNode('hub', null);
    const groupNodes = {};
    GROUPS.forEach((g) => {
      groupNodes[g.id] = makeNode('group', g);
    });
    const projNodes = PROJECTS.map((p) => makeNode('project', p));

    GROUPS.forEach((g) => {
      const e = { a: hub, b: groupNodes[g.id], kind: 'trunk', bend: 1 };
      edges.push(e);
      groupNodes[g.id].edge = e;
    });
    projNodes.forEach((pn, i) => {
      const gn = groupNodes[pn.data.group];
      pn.parent = gn;
      gn.children.push(pn);
      const e = { a: gn, b: pn, kind: 'branch', bend: i % 2 ? 1 : -1 };
      edges.push(e);
      pn.edge = e;
    });

    /* --- Pointer: hover, drag, click --- */
    function attachPointer(n) {
      const b = n.el;
      b.addEventListener('pointerenter', () => setActive(n));
      b.addEventListener('pointerleave', () => {
        if (S.active === n) setActive(null);
      });
      b.addEventListener('focus', () => setActive(n));
      b.addEventListener('blur', () => {
        if (S.active === n) setActive(null);
      });
      b.addEventListener('pointerdown', (e) => {
        if (S.mode !== 'graph' || e.button !== 0 || S.tween) return;
        const r = map.getBoundingClientRect();
        S.drag = { n, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: n.x - (e.clientX - r.left), oy: n.y - (e.clientY - r.top), moved: false, lx: e.clientX, ly: e.clientY, vx: 0, vy: 0 };
        try {
          b.setPointerCapture(e.pointerId);
        } catch (err) {
          /* ignore */
        }
      });
      b.addEventListener('pointermove', (e) => {
        const d = S.drag;
        if (!d || d.n !== n || d.id !== e.pointerId) return;
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5) {
          d.moved = true;
          n.dragging = true;
          b.classList.add('is-dragging');
        }
        if (d.moved) {
          const r = map.getBoundingClientRect();
          n.x = clamp(e.clientX - r.left + d.ox, n.w / 2, S.W - n.w / 2);
          n.y = clamp(e.clientY - r.top + d.oy, n.h / 2, S.H - n.h / 2);
          d.vx = e.clientX - d.lx;
          d.vy = e.clientY - d.ly;
          d.lx = e.clientX;
          d.ly = e.clientY;
        }
      });
      const end = () => {
        const d = S.drag;
        if (!d || d.n !== n) return;
        S.drag = null;
        if (d.moved) {
          n.dragging = false;
          b.classList.remove('is-dragging');
          // Ihagis: may konting bilis pagkabitaw
          n.vx = clamp(d.vx, -30, 30) * 0.6;
          n.vy = clamp(d.vy, -30, 30) * 0.6;
          n.justDragged = true;
          setTimeout(() => {
            n.justDragged = false;
          }, 0);
        }
      };
      b.addEventListener('pointerup', end);
      b.addEventListener('pointercancel', end);
      b.addEventListener('click', (e) => {
        if (n.justDragged) {
          e.preventDefault();
          return;
        }
        activate(n);
      });
    }

    function chainEdges(n) {
      const s = new Set();
      if (!n) return s;
      if (n.type === 'project') {
        s.add(n.edge);
        s.add(n.parent.edge);
      } else if (n.type === 'group') {
        s.add(n.edge);
        n.children.forEach((c) => s.add(c.edge));
      } else {
        edges.forEach((e) => s.add(e));
      }
      return s;
    }

    function chainNodes(n) {
      if (!n) return [];
      if (n.type === 'project') return [n.parent, hub];
      if (n.type === 'group') return [hub].concat(n.children);
      return [];
    }

    function setActive(n) {
      chainNodes(S.active).forEach((c) => c.el.classList.remove('is-hot'));
      S.active = n;
      hotEdges = chainEdges(n);
      chainNodes(n).forEach((c) => c.el.classList.add('is-hot'));
    }

    function activate(n) {
      if (n.type === 'group') {
        setFilter(S.filter === n.id ? 'all' : n.id);
        return;
      }
      select(n, { open: true, burst: true });
    }

    /* --- Selection + inspector --- */
    function select(n, opts) {
      const o = opts || {};
      if (S.selected) S.selected.el.classList.remove('is-selected');
      S.selected = n;
      n.el.classList.add('is-selected');
      selEdges = n.type === 'project' ? chainEdges(n) : new Set();
      renderInspector(n, !o.quiet);
      if (o.burst && n.type === 'project' && !reduceMotion) {
        sendPush(n, true);
        if (n.data.live) setTimeout(() => sendDeploy(n, true), 260);
      }
      if (o.open && sheetMQ.matches) openSheet(n.el);
    }

    function visibleProjects() {
      return projNodes.filter((p) => !p.dim);
    }

    function step(dir) {
      const pool = visibleProjects();
      if (!pool.length) return;
      const idx = S.selected && S.selected.type === 'project' ? pool.indexOf(S.selected) : -1;
      const next = pool[(idx + dir + pool.length) % pool.length];
      select(next, { burst: true });
    }

    function renderInspector(n, animate) {
      inspector.replaceChildren();
      const close = el('button', 'insp__close btn btn--ghost btn--sm', 'Close');
      close.type = 'button';
      close.addEventListener('click', closeSheet);
      inspector.append(close);

      const media = el('div', 'insp__media' + (animate ? ' is-new' : ''));
      const meta = el('p', 'insp__meta mono');
      const git = el('dl', 'insp__git mono');
      const actions = el('div', 'insp__actions');
      let title;
      let desc;
      let chips = null;

      if (n.type === 'hub') {
        const art = el('div', 'insp__hub');
        art.innerHTML = svg('branch');
        media.append(art);
        meta.append(el('span', 'tag', 'GitHub'), el('span', null, 'profile'));
        title = el('h3', 'insp__title', 'github.com/Dhellss');
        desc = el('p', 'insp__desc', 'Where every project on this page lives: browser games, web apps, portfolio designs and desktop software. ' + publicRepos + ' public repositories so far.');
        const latest = latestProject();
        [['user', 'Dhellss'], ['public repos', String(publicRepos)], ['latest push', latest.repo + ', ' + fmtDate(latest.pushed)], ['on this page', PROJECTS.length + ' projects']].forEach((row) => {
          git.append(el('dt', null, row[0]), el('dd', null, row[1]));
        });
        actions.append(linkBtn(GITHUB, 'Open GitHub profile', 'lime', 'ext'));
      } else {
        const p = n.data;
        const img = el('img');
        img.src = p.img;
        img.alt = 'Screenshot of ' + p.title;
        img.width = 960;
        img.height = 540;
        img.decoding = 'async';
        media.append(img);
        meta.append(el('span', 'tag', groupOf(p).tag), el('span', null, p.year), el('span', null, p.live ? 'live on GitHub Pages' : 'source on GitHub'));
        title = el('h3', 'insp__title', p.title);
        desc = el('p', 'insp__desc', p.desc);
        chips = el('ul', 'chips');
        p.stack.forEach((s) => chips.append(el('li', null, s)));
        [['remote', 'github.com/Dhellss/' + p.repo], ['last push', fmtDate(p.pushed)]].forEach((row) => {
          git.append(el('dt', null, row[0]), el('dd', null, row[1]));
        });
        if (p.live) actions.append(linkBtn(p.live, p.group === 'games' ? 'Play live' : 'Open live', 'lime', 'play'));
        actions.append(linkBtn(GITHUB + '/' + p.repo, 'Code on GitHub', p.live ? 'ghost' : 'lime', 'code'));
      }

      const nav = el('div', 'insp__nav');
      const prev = el('button', 'insp__step');
      prev.type = 'button';
      prev.innerHTML = svg('left');
      prev.append(document.createTextNode('prev'));
      prev.setAttribute('aria-label', 'Previous project');
      prev.addEventListener('click', () => step(-1));
      const next = el('button', 'insp__step');
      next.type = 'button';
      next.append(document.createTextNode('next'));
      next.insertAdjacentHTML('beforeend', svg('right'));
      next.setAttribute('aria-label', 'Next project');
      next.addEventListener('click', () => step(1));
      const pool = visibleProjects();
      const idx = n.type === 'project' ? pool.indexOf(n) + 1 : 0;
      nav.append(prev, el('span', null, idx ? idx + ' of ' + pool.length : pool.length + ' projects'), next);

      inspector.append(media, meta, title, desc);
      if (chips) inspector.append(chips);
      inspector.append(git, actions, nav);

      if (animate && !reduceMotion) {
        inspector.classList.remove('is-swap');
        void inspector.offsetWidth;
        inspector.classList.add('is-swap');
        requestAnimationFrame(() => media.style.setProperty('--h', media.clientHeight + 'px'));
      }
    }

    function openSheet(from) {
      S.sheetOpen = true;
      S.returnFocus = from || null;
      inspector.inert = false;
      inspector.classList.add('is-open');
      backdrop.hidden = false;
      const c = $('.insp__close', inspector);
      if (c) setTimeout(() => c.focus({ preventScroll: true }), 60);
    }

    function closeSheet() {
      if (!S.sheetOpen) return;
      S.sheetOpen = false;
      inspector.classList.remove('is-open');
      backdrop.hidden = true;
      if (sheetMQ.matches) inspector.inert = true;
      if (S.returnFocus) S.returnFocus.focus({ preventScroll: true });
    }

    // Sa phone, inililipat ang inspector sa <body> para lumabas bilang bottom sheet
    // (hindi ito natatakpan o napuputol ng glass window).
    const inspectorHome = inspector.parentElement;
    function syncSheetMode() {
      if (sheetMQ.matches) {
        if (inspector.parentElement !== document.body) document.body.append(inspector);
        inspector.inert = !S.sheetOpen;
      } else {
        if (inspector.parentElement !== inspectorHome) inspectorHome.append(inspector);
        S.sheetOpen = false;
        inspector.classList.remove('is-open');
        backdrop.hidden = true;
        inspector.inert = false;
      }
    }

    backdrop.addEventListener('click', closeSheet);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSheet();
    });
    if (sheetMQ.addEventListener) sheetMQ.addEventListener('change', syncSheetMode);

    /* --- Filters --- */
    function buildFilters() {
      const items = [{ id: 'all', name: 'All', count: PROJECTS.length }].concat(
        GROUPS.map((g) => ({ id: g.id, name: g.name, count: PROJECTS.filter((p) => p.group === g.id).length }))
      );
      items.forEach((it) => {
        const b = el('button', 'filter');
        b.type = 'button';
        b.dataset.filter = it.id;
        b.setAttribute('aria-pressed', String(it.id === 'all'));
        b.append(document.createTextNode(it.name), el('b', null, String(it.count)));
        b.addEventListener('click', () => setFilter(it.id));
        filtersEl.append(b);
      });
    }

    function applyFilterFlags() {
      const f = S.filter;
      projNodes.forEach((p) => {
        const match = f === 'all' || p.data.group === f;
        p.dim = !match;
        p.hidden = S.mode === 'tree' && !match;
      });
      GROUPS.forEach((g) => {
        const gn = groupNodes[g.id];
        const match = f === 'all' || g.id === f;
        gn.dim = !match;
        gn.hidden = S.mode === 'tree' && !match;
        gn.el.classList.toggle('is-active', f === g.id);
      });
      nodes.forEach((n) => {
        n.el.classList.toggle('is-dim', n.dim && S.mode === 'graph');
        n.el.hidden = n.hidden;
      });
    }

    function setFilter(id) {
      S.filter = id;
      $$('.filter', filtersEl).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === id)));
      applyFilterFlags();
      PROJECTS.forEach((p) => {
        if (p.card) p.card.hidden = !(id === 'all' || p.group === id);
      });
      if (S.view === 'list') animateCards();
      if (S.mode === 'tree') layout(true);
      if (S.selected && S.selected.type === 'project' && S.selected.dim) {
        const first = visibleProjects()[0];
        if (first) select(first, { quiet: true });
      } else if (S.selected) {
        renderInspector(S.selected, false);
      }
      // Maliit na "sync" burst sa mga napiling projects
      if (!reduceMotion && S.view === 'map') {
        visibleProjects().forEach((p, i) => setTimeout(() => sendPush(p, false), i * 45));
      }
    }

    /* --- Layout --- */
    function measure() {
      nodes.forEach((n) => {
        if (n.hidden) return;
        n.w = n.el.offsetWidth;
        n.h = n.el.offsetHeight;
      });
    }

    function sizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(S.W * dpr);
      canvas.height = Math.round(S.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seedPositions() {
      const r = mulberry32(1234);
      const hx = S.W * 0.5;
      const hy = S.H * 0.47;
      hub.x = hx;
      hub.y = hy;
      GROUPS.forEach((g) => {
        const gn = groupNodes[g.id];
        gn.x = hx + (g.anchor[0] - 0.5) * S.W;
        gn.y = hy + (g.anchor[1] - 0.47) * S.H;
        const kids = gn.children;
        const base = Math.atan2(gn.y - hy, gn.x - hx);
        const spanA = Math.min(Math.PI * 1.5, 0.55 * kids.length);
        kids.forEach((k, i) => {
          const a = base + (kids.length > 1 ? (i / (kids.length - 1) - 0.5) * spanA : 0);
          k.x = gn.x + Math.cos(a) * gn.rest + (r() - 0.5) * 10;
          k.y = gn.y + Math.sin(a) * gn.rest * 0.8 + (r() - 0.5) * 10;
        });
      });
      nodes.forEach((n) => {
        n.vx = 0;
        n.vy = 0;
      });
    }

    function physicsStep(jitter) {
      const W = S.W;
      const H = S.H;
      // GitHub hub: bumabalik sa gitna
      if (!hub.dragging) {
        hub.vx += (W * 0.5 - hub.x) * 0.03;
        hub.vy += (H * 0.47 - hub.y) * 0.03;
      }
      // Folders: hinihila papunta sa kanilang puwesto (relative sa hub)
      GROUPS.forEach((g) => {
        const n = groupNodes[g.id];
        if (n.dragging) return;
        n.vx += (hub.x + (g.anchor[0] - 0.5) * W - n.x) * 0.014;
        n.vy += (hub.y + (g.anchor[1] - 0.47) * H - n.y) * 0.014;
      });
      // Springs: project <-> folder
      projNodes.forEach((p) => {
        const g = p.parent;
        const dx = p.x - g.x;
        const dy = p.y - g.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const f = (d - g.rest) * 0.012;
        const ux = dx / d;
        const uy = dy / d;
        if (!p.dragging) {
          p.vx -= ux * f;
          p.vy -= uy * f;
        }
        if (!g.dragging) {
          g.vx += ux * f * 0.2;
          g.vy += uy * f * 0.2;
        }
      });
      // Repulsion: nagtutulakan ang mga node
      const R = 1500 * S.scale * S.scale;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let d2 = dx * dx + dy * dy;
          if (d2 > 90000) continue;
          if (d2 < 1) {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            d2 = 1;
          }
          const d = Math.sqrt(d2);
          const f = R / d2;
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          const wa = a === hub ? 0.25 : 1;
          const wb = b === hub ? 0.25 : 1;
          if (!a.dragging) {
            a.vx -= fx * wa;
            a.vy -= fy * wa;
          }
          if (!b.dragging) {
            b.vx += fx * wb;
            b.vy += fy * wb;
          }
        }
      }
      // Konting "hinga" para buhay ang network
      if (jitter) {
        nodes.forEach((n) => {
          if (n === hub) return;
          n.vx += (Math.random() - 0.5) * 0.07;
          n.vy += (Math.random() - 0.5) * 0.07;
        });
      }
      nodes.forEach((n) => {
        if (n.dragging) {
          n.vx = 0;
          n.vy = 0;
          return;
        }
        n.vx *= 0.84;
        n.vy *= 0.84;
        const sp = Math.hypot(n.vx, n.vy);
        if (sp > 24) {
          n.vx *= 24 / sp;
          n.vy *= 24 / sp;
        }
        n.x += n.vx;
        n.y += n.vy;
      });
      collide();
      keepInside();
    }

    // Walang magkakapatong na node (rectangle collision)
    function collide() {
      const pad = 9;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const ox = (a.w + b.w) / 2 + pad - Math.abs(dx);
            const oy = (a.h + b.h) / 2 + pad - Math.abs(dy);
            if (ox <= 0 || oy <= 0) continue;
            const wa = a.dragging ? 0 : a === hub ? 0.25 : 1;
            const wb = b.dragging ? 0 : b === hub ? 0.25 : 1;
            const sum = wa + wb;
            if (!sum) continue;
            if (ox < oy) {
              const s = (dx < 0 ? -1 : 1) * ox;
              a.x -= (s * wa) / sum;
              b.x += (s * wb) / sum;
            } else {
              const s = (dy < 0 ? -1 : 1) * oy;
              a.y -= (s * wa) / sum;
              b.y += (s * wb) / sum;
            }
          }
        }
      }
    }

    function keepInside() {
      nodes.forEach((n) => {
        const mx = n.w / 2 + 8;
        const my = n.h / 2 + 8;
        if (n.x < mx) {
          n.x = mx;
          n.vx *= -0.3;
        } else if (n.x > S.W - mx) {
          n.x = S.W - mx;
          n.vx *= -0.3;
        }
        if (n.y < my) {
          n.y = my;
          n.vy *= -0.3;
        } else if (n.y > S.H - my) {
          n.y = S.H - my;
          n.vy *= -0.3;
        }
      });
    }

    function settle() {
      seedPositions();
      for (let k = 0; k < 600; k++) physicsStep(false);
      nodes.forEach((n) => {
        n.ex = n.x;
        n.ey = n.y;
        n.vx = 0;
        n.vy = 0;
      });
    }

    function layoutTree() {
      const pad = 10;
      const gap = 8;
      let y = pad;
      const row = (n, indent) => {
        n.ex = pad + indent + n.w / 2;
        n.ey = y + n.h / 2;
        y += n.h + gap;
      };
      row(hub, 0);
      GROUPS.forEach((g) => {
        const gn = groupNodes[g.id];
        if (gn.hidden) return;
        row(gn, 22);
        gn.children.forEach((p) => {
          if (!p.hidden) row(p, 44);
        });
      });
      map.style.height = Math.round(y - gap + pad) + 'px';
    }

    function layout(animate) {
      const width = stage.clientWidth;
      if (!width || S.view !== 'map') return;
      const mode = width < 680 ? 'tree' : 'graph';
      if (mode !== S.mode) {
        S.mode = mode;
        map.classList.toggle('is-tree', mode === 'tree');
        packets.length = 0;
      }
      applyFilterFlags();
      if (mode === 'graph') map.style.height = '';
      measure();
      if (mode === 'tree') layoutTree();
      S.W = map.clientWidth;
      S.H = map.clientHeight;
      S.scale = clamp(Math.min(S.W / 1000, S.H / 620), 0.7, 1.3);
      GROUPS.forEach((g) => {
        const gn = groupNodes[g.id];
        gn.rest = (60 + 24 * Math.sqrt(gn.children.length)) * S.scale;
      });
      sizeCanvas();
      if (mode === 'graph') settle();

      if (!S.entered && !reduceMotion) {
        // Bago lumabas: lahat ng node nakatago sa loob ng GitHub hub
        nodes.forEach((n) => {
          n.x = mode === 'graph' ? hub.ex : n.ex - 24;
          n.y = mode === 'graph' ? hub.ey : n.ey;
          n.el.style.opacity = n === hub ? '' : '0';
        });
        hub.x = hub.ex;
        hub.y = hub.ey;
      } else if (animate && !reduceMotion) {
        tweenTo(620, false);
      } else {
        nodes.forEach((n) => {
          n.x = n.ex;
          n.y = n.ey;
        });
      }
      applyPositions();
      draw();
    }

    function tweenTo(dur, entry) {
      const now = performance.now();
      S.tween = {
        t0: now,
        dur,
        entry,
        items: nodes.map((n, i) => {
          let delay = 0;
          if (entry) delay = n === hub ? 0 : n.type === 'group' ? 60 + i * 50 : 280 + (i % 28) * 26;
          return { n, fx: n.x, fy: n.y, delay };
        }),
      };
      S.tween.end = now + dur + Math.max.apply(null, S.tween.items.map((it) => it.delay));
    }

    const easeOutBack = (k) => {
      const c1 = 1.5;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    };
    const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);

    function updateTween(now) {
      const tw = S.tween;
      tw.items.forEach((it) => {
        const k = clamp((now - tw.t0 - it.delay) / tw.dur, 0, 1);
        const e = tw.entry && S.mode === 'graph' ? easeOutBack(k) : easeOutCubic(k);
        it.n.x = lerp(it.fx, it.n.ex, e);
        it.n.y = lerp(it.fy, it.n.ey, e);
        if (tw.entry && k > 0) it.n.el.style.opacity = '';
      });
      if (now >= tw.end) {
        S.tween = null;
        nodes.forEach((n) => {
          n.x = n.ex;
          n.y = n.ey;
          n.vx = 0;
          n.vy = 0;
          n.el.style.opacity = '';
        });
      }
    }

    function applyPositions() {
      nodes.forEach((n) => {
        if (n.hidden) return;
        n.el.style.transform = 'translate3d(' + (n.x - n.w / 2).toFixed(1) + 'px,' + (n.y - n.h / 2).toFixed(1) + 'px,0)';
      });
    }

    function startEntry() {
      if (S.entered) return;
      S.entered = true;
      if (reduceMotion) return;
      nodes.forEach((n) => {
        if (n !== hub) n.el.style.opacity = '0';
      });
      tweenTo(S.mode === 'graph' ? 950 : 520, true);
      flash(hub.el);
    }

    /* --- Edges: geometry and drawing --- */
    function edgeGeom(e) {
      const a = e.a;
      const b = e.b;
      if (S.mode === 'tree') {
        const x0 = a.x - a.w / 2 + 14;
        const y0 = a.y + a.h / 2;
        const x1 = b.x - b.w / 2;
        const y1 = b.y;
        return { tree: true, x0, y0, x1, y1, v: Math.max(0, y1 - y0), len: Math.max(1, y1 - y0 + (x1 - x0)) };
      }
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const bend = (e.kind === 'trunk' ? 0.08 : 0.16) * e.bend;
      return { tree: false, ax: a.x, ay: a.y, cx: (a.x + b.x) / 2 - dy * bend, cy: (a.y + b.y) / 2 + dx * bend, bx: b.x, by: b.y };
    }

    function pointOn(g, t) {
      if (g.tree) {
        const s = t * g.len;
        return s < g.v ? [g.x0, g.y0 + s] : [g.x0 + (s - g.v), g.y1];
      }
      const m = 1 - t;
      return [m * m * g.ax + 2 * m * t * g.cx + t * t * g.bx, m * m * g.ay + 2 * m * t * g.cy + t * t * g.by];
    }

    function tracePath(g) {
      ctx.beginPath();
      if (g.tree) {
        const r = Math.max(0, Math.min(8, g.v / 2, (g.x1 - g.x0) / 2));
        ctx.moveTo(g.x0, g.y0);
        ctx.lineTo(g.x0, g.y1 - r);
        ctx.quadraticCurveTo(g.x0, g.y1, g.x0 + r, g.y1);
        ctx.lineTo(g.x1, g.y1);
      } else {
        ctx.moveTo(g.ax, g.ay);
        ctx.quadraticCurveTo(g.cx, g.cy, g.bx, g.by);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, S.W, S.H);
      edges.forEach((e) => {
        if (e.b.hidden) return;
        const g = (e.g = edgeGeom(e));
        const hot = hotEdges.has(e);
        const sel = selEdges.has(e);
        const dim = e.b.dim;
        ctx.save();
        tracePath(g);
        if (hot) {
          ctx.strokeStyle = rgba(COLOR.signal, 0.9);
          ctx.lineWidth = 1.6;
          ctx.shadowColor = rgba(COLOR.signal, 0.7);
          ctx.shadowBlur = 10;
        } else if (sel) {
          ctx.strokeStyle = rgba(COLOR.signal, 0.55);
          ctx.lineWidth = 1.3;
        } else if (e.kind === 'trunk') {
          ctx.strokeStyle = rgba(COLOR.signal, dim ? 0.1 : 0.34);
          ctx.lineWidth = 1.3;
        } else {
          ctx.strokeStyle = rgba(COLOR.text, dim ? 0.05 : 0.17);
          ctx.lineWidth = 1;
        }
        ctx.stroke();
        ctx.restore();
      });
      drawPackets();
    }

    /* --- Packets: push (lime, papuntang GitHub) at deploy (puti, papunta sa live site) --- */
    function spawn(e, dir, col, done, fast) {
      if (!e || e.b.hidden || !e.g) {
        if (done) done();
        return;
      }
      if (!fast && packets.length > 140) return;
      packets.push({ e, dir, col, done: done || null, t: 0, v: fast ? rand(1.6, 1.9) : rand(0.6, 0.9), r: fast ? 2.1 : rand(1.4, 1.9) });
    }

    function sendPush(p, fast) {
      spawn(p.edge, -1, COLOR.signal, () => spawn(p.parent.edge, -1, COLOR.signal, fast ? () => flash(hub.el) : null, fast), fast);
    }

    function sendDeploy(p, fast) {
      spawn(p.parent.edge, 1, COLOR.deploy, () => spawn(p.edge, 1, COLOR.deploy, fast ? () => flash(p.el) : null, fast), fast);
    }

    function updatePackets(dt, active) {
      if (active && !S.paused && !S.tween && !reduceMotion) {
        projNodes.forEach((p) => {
          if (p.dim || p.hidden) return;
          if (Math.random() < 0.07 * dt) sendPush(p, false);
          if (p.data.live && Math.random() < 0.05 * dt) sendDeploy(p, false);
        });
      }
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i];
        if (!S.paused || pk.done) pk.t += pk.v * dt;
        if (pk.t >= 1) {
          packets.splice(i, 1);
          if (pk.done) pk.done();
        }
      }
    }

    function drawPackets() {
      if (!packets.length) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      packets.forEach((pk) => {
        const g = pk.e.g;
        if (!g || pk.e.b.hidden) return;
        const head = pk.dir > 0 ? pk.t : 1 - pk.t;
        const tail = pk.dir > 0 ? Math.max(0, head - 0.1) : Math.min(1, head + 0.1);
        const hp = pointOn(g, head);
        const mp = pointOn(g, (head + tail) / 2);
        const tp = pointOn(g, tail);
        const grad = ctx.createLinearGradient(tp[0], tp[1], hp[0], hp[1]);
        grad.addColorStop(0, rgba(pk.col, 0));
        grad.addColorStop(1, rgba(pk.col, 0.9));
        ctx.strokeStyle = grad;
        ctx.lineWidth = pk.r;
        ctx.beginPath();
        ctx.moveTo(tp[0], tp[1]);
        ctx.lineTo(mp[0], mp[1]);
        ctx.lineTo(hp[0], hp[1]);
        ctx.stroke();
        ctx.fillStyle = rgba(pk.col, 0.16);
        ctx.beginPath();
        ctx.arc(hp[0], hp[1], pk.r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pk.col;
        ctx.beginPath();
        ctx.arc(hp[0], hp[1], pk.r * 0.9, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    /* --- Tools --- */
    function shake() {
      if (S.mode !== 'graph' || reduceMotion) return;
      nodes.forEach((n) => {
        if (n === hub) return;
        n.vx += rand(-16, 16);
        n.vy += rand(-16, 16);
      });
      flash(hub.el);
    }

    $('#toolShake').addEventListener('click', shake);
    $('#toolReset').addEventListener('click', () => {
      // settle() resets positions, so keep the current ones for a smooth tween
      const cur = nodes.map((n) => [n.x, n.y]);
      if (S.mode === 'graph') settle();
      nodes.forEach((n, i) => {
        n.x = cur[i][0];
        n.y = cur[i][1];
      });
      if (reduceMotion) {
        nodes.forEach((n) => {
          n.x = n.ex;
          n.y = n.ey;
        });
      } else {
        tweenTo(700, false);
      }
    });
    pauseBtn.addEventListener('click', () => {
      S.paused = !S.paused;
      const label = S.paused ? 'Resume packets' : 'Pause packets';
      pauseBtn.setAttribute('aria-pressed', String(S.paused));
      pauseBtn.setAttribute('aria-label', label);
      pauseBtn.title = label;
      pauseBtn.classList.toggle('is-on', S.paused);
    });

    /* --- List view --- */
    function buildList() {
      PROJECTS.forEach((p) => {
        const card = el('article', 'pcard');
        const media = el('div', 'pcard__media');
        const img = el('img');
        img.src = p.img;
        img.alt = 'Screenshot of ' + p.title;
        img.width = 960;
        img.height = 540;
        img.loading = 'lazy';
        img.decoding = 'async';
        media.append(img);
        const body = el('div', 'pcard__body');
        const meta = el('p', 'insp__meta mono');
        meta.append(el('span', 'tag', groupOf(p).tag), el('span', null, 'pushed ' + fmtDate(p.pushed)));
        const chips = el('ul', 'chips');
        p.stack.forEach((s) => chips.append(el('li', null, s)));
        const links = el('div', 'pcard__links');
        if (p.live) links.append(linkBtn(p.live, p.group === 'games' ? 'Play live' : 'Open live', 'lime', 'play'));
        links.append(linkBtn(GITHUB + '/' + p.repo, 'Code', p.live ? 'ghost' : 'lime', 'code'));
        body.append(meta, el('h3', 'pcard__title', p.title), el('p', 'pcard__desc', p.desc), chips, links);
        card.append(media, body);
        list.append(card);
        p.card = card;
      });
    }

    function animateCards() {
      if (reduceMotion) return;
      let i = 0;
      PROJECTS.forEach((p) => {
        const c = p.card;
        c.classList.remove('is-in');
        if (c.hidden) return;
        void c.offsetWidth;
        c.style.animationDelay = Math.min(i++, 12) * 40 + 'ms';
        c.classList.add('is-in');
      });
    }

    function setView(v) {
      if (v === S.view) return;
      S.view = v;
      wrap.classList.toggle('is-list', v === 'list');
      map.hidden = v === 'list';
      list.hidden = v !== 'list';
      $$('.viewtoggle__btn', wrap).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
      closeSheet();
      if (v === 'list') {
        animateCards();
      } else {
        layout(false);
      }
    }

    $$('.viewtoggle__btn', wrap).forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

    /* --- Frame + init --- */
    function frame(now, dt) {
      const active = S.view === 'map' && S.visible && S.ready;
      if (!active) {
        updatePackets(dt, false);
        return;
      }
      if (S.tween) updateTween(now);
      else if (S.mode === 'graph' && S.entered) physicsStep(!S.paused && !reduceMotion);
      updatePackets(dt, S.entered);
      applyPositions();
      draw();
    }

    function onBootDone() {
      S.ready = true;
      if (S.visible) startEntry();
    }

    function init() {
      buildFilters();
      buildList();
      layout(false);
      const first = projNodes[0] ? projNodes.find((p) => p.data.id === latestProject().id) || projNodes[0] : hub;
      select(first, { quiet: true });
      syncSheetMode();

      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          S.visible = entries[entries.length - 1].isIntersecting;
          if (S.visible && S.ready) startEntry();
        }, { threshold: 0.15 }).observe(wrap);
      } else {
        S.visible = true;
      }

      if ('ResizeObserver' in window) {
        let raf = 0;
        new ResizeObserver((entries) => {
          const w = Math.round(entries[0].contentRect.width);
          if (w === S.lastWidth) return;
          S.lastWidth = w;
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => layout(S.entered));
        }).observe(wrap);
      }
    }

    function refreshData() {
      hub.subEl.textContent = publicRepos + ' public repos';
      if (S.selected) renderInspector(S.selected, false);
      if (S.mode === 'graph') {
        measure();
      }
    }

    return {
      init,
      frame,
      onBootDone,
      relayout: () => layout(false),
      refreshData,
      fontsReady: () => {
        measure();
        layout(false);
      },
    };
  })();

  /* ---------- 9. Contact handshake ---------- */
  const hs = (function () {
    const stage = $('#hsStage');
    const canvas = $('#hsCanvas');
    const ctx = canvas.getContext('2d');
    const logEl = $('#hsLog');
    const btn = $('#hsReplay');
    const you = $('#hsYou');
    const me = $('#hsMe');
    const packets = [];
    let W = 0;
    let H = 0;
    let visible = false;
    let running = false;
    let played = false;
    let connected = false;
    let g = null;

    function resize() {
      W = stage.clientWidth;
      H = stage.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = stage.getBoundingClientRect();
      const a = you.getBoundingClientRect();
      const b = me.getBoundingClientRect();
      g = { x0: a.right - r.left, x1: b.left - r.left, y: H / 2 };
    }

    function point(t) {
      const x = lerp(g.x0, g.x1, t);
      const y = g.y - Math.sin(Math.PI * t) * H * 0.22;
      return [x, y];
    }

    function send(dir, done, col, slow) {
      packets.push({ dir, t: 0, v: slow ? 0.45 : 1.15, col: col || COLOR.signal, done: done || null, r: slow ? 1.5 : 2.2 });
    }

    function line(parts, cls) {
      const li = el('li', cls || null);
      parts.forEach((p) => li.append(typeof p === 'string' ? document.createTextNode(p) : p));
      logEl.append(li);
    }

    async function run() {
      if (running) return;
      running = true;
      connected = false;
      played = true;
      btn.disabled = true;
      logEl.replaceChildren();
      line(['$ ping dhellmar'], 'is-cmd');
      await wait(reduceMotion ? 0 : 380);
      line(['connecting to felicianomahilum@gmail.com ...']);
      await wait(reduceMotion ? 0 : 420);
      const steps = [
        [1, 'SYN', 'you → dhellmar'],
        [-1, 'SYN-ACK', 'dhellmar → you'],
        [1, 'ACK', 'you → dhellmar'],
      ];
      for (const s of steps) {
        if (!reduceMotion) await new Promise((res) => send(s[0], res));
        flash(s[0] > 0 ? me : you);
        line([s[0] > 0 ? '→ ' : '← ', el('b', null, s[1].padEnd(8, ' ')), s[2]]);
        await wait(reduceMotion ? 0 : 140);
      }
      line(['[ok] connection established. say hi!'], 'is-ok');
      connected = true;
      running = false;
      btn.disabled = false;
    }

    function frame(now, dt) {
      if (!visible || !g) return;
      ctx.clearRect(0, 0, W, H);
      // link
      ctx.save();
      ctx.beginPath();
      for (let k = 0; k <= 40; k++) {
        const p = point(k / 40);
        if (k) ctx.lineTo(p[0], p[1]);
        else ctx.moveTo(p[0], p[1]);
      }
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = reduceMotion ? 0 : -now * 0.02;
      ctx.strokeStyle = rgba(COLOR.signal, connected ? 0.55 : 0.25);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // keep-alive packets kapag connected na
      if (connected && !reduceMotion && Math.random() < dt * 0.9) send(Math.random() < 0.5 ? 1 : -1, null, Math.random() < 0.5 ? COLOR.signal : COLOR.deploy, true);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i];
        pk.t += pk.v * dt;
        if (pk.t >= 1) {
          packets.splice(i, 1);
          if (pk.done) pk.done();
          continue;
        }
        const u = pk.dir > 0 ? pk.t : 1 - pk.t;
        const p = point(u);
        ctx.fillStyle = rgba(pk.col, 0.18);
        ctx.beginPath();
        ctx.arc(p[0], p[1], pk.r * 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pk.col;
        ctx.beginPath();
        ctx.arc(p[0], p[1], pk.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function init() {
      resize();
      btn.addEventListener('click', run);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          visible = entries[entries.length - 1].isIntersecting;
          if (visible) {
            resize();
            if (!played) run();
          }
        }, { threshold: 0.35 }).observe(stage);
      } else {
        visible = true;
        run();
      }
    }

    return { init, frame, resize };
  })();

  /* ---------- 10. Boot loader, reveals, nav, small effects ---------- */
  const nav = $('#nav');
  const navProgress = $('#navProgress');
  const brandMark = $('#brandMark');
  const hero = $('#home');
  const heroTerm = $('#heroTerm');

  function runBoot(done) {
    const boot = $('#boot');
    if (!boot) {
      done();
      return;
    }
    if (reduceMotion || typeof boot.animate !== 'function') {
      boot.hidden = true;
      done();
      return;
    }
    const ring = $('#bootRing');
    const bar = $('#bootBar');
    const num = $('#bootNum');
    const logLines = $$('#bootLog li');
    const circ = 2 * Math.PI * 28;
    bar.style.strokeDasharray = String(circ);
    bar.style.strokeDashoffset = String(circ);
    const t0 = performance.now();
    const dur = 1250;
    let skip = false;
    boot.addEventListener('pointerdown', () => {
      skip = true;
    }, { once: true });

    function tick(now) {
      const k = skip ? 1 : clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      bar.style.strokeDashoffset = String(circ * (1 - e));
      num.textContent = String(Math.round(e * 100));
      logLines.forEach((li, i) => li.classList.toggle('is-on', e > 0.12 + i * 0.32));
      if (k < 1) requestAnimationFrame(tick);
      else setTimeout(fly, 140);
    }
    requestAnimationFrame(tick);

    // Lilipad ang ring papunta sa logo sa nav.
    function fly() {
      const a = ring.getBoundingClientRect();
      const b = brandMark.getBoundingClientRect();
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const s = b.width / a.width;
      $('#bootLog').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
      num.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
      boot.animate([{ backgroundColor: rgba(COLOR.bg, 1) }, { backgroundColor: rgba(COLOR.bg, 0) }], { duration: 700, delay: 80, easing: 'ease-out', fill: 'forwards' });
      const move = ring.animate(
        [{ transform: 'translate(0px, 0px) scale(1)' }, { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + s + ')' }],
        { duration: 760, easing: 'cubic-bezier(.7, 0, .2, 1)', fill: 'forwards' }
      );
      setTimeout(done, 200);
      move.onfinish = () => {
        brandMark.classList.add('is-lit');
        const fade = ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
        fade.onfinish = () => {
          boot.hidden = true;
        };
      };
    }
  }

  function revealHero() {
    $$('.hero .reveal, .reveal-stage').forEach((n) => n.classList.add('is-in'));
    tilt.ready = true;
    setTimeout(() => scramble($('#heroName'), 900), reduceMotion ? 0 : 160);
    setTimeout(() => brandMark.classList.add('is-lit'), reduceMotion ? 0 : 1100);
    net.onBootDone();
    runTerminal();
  }

  function setupReveals() {
    const later = $$('.reveal').filter((n) => !n.closest('.hero'));
    const show = (n) => {
      n.classList.add('is-in');
      const sc = n.classList.contains('scramble') ? [n] : $$('.scramble', n);
      sc.forEach((s) => scramble(s, 700));
    };
    if ('IntersectionObserver' in window && !reduceMotion) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            show(en.target);
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
      later.forEach((n) => io.observe(n));
    } else {
      later.forEach(show);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        heroVisible = entries[entries.length - 1].isIntersecting;
      }).observe(heroTerm);
    }
  }

  function setupNav() {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const links = $$('[data-nav]');
    const setActiveLink = (id) => links.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
    setActiveLink('home');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActiveLink(en.target.id === 'about' ? 'home' : en.target.id);
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ['home', 'about', 'projects', 'contact'].forEach((id) => io.observe($('#' + id)));
    }

    $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
    $('#year').textContent = String(new Date().getFullYear());
  }

  // Magnetic buttons: bahagyang sumusunod sa mouse
  function setupMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + (x * 0.18).toFixed(1) + 'px,' + (y * 0.3).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', () => {
        b.style.transform = '';
      });
    });
  }

  // Copy buttons + toast
  const toast = $('#toast');
  let toastTimer = 0;

  function say(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 1800);
  }

  function setupCopy() {
    $$('[data-copy]').forEach((b) => {
      b.addEventListener('click', async () => {
        const value = b.dataset.copy;
        const label = $('span', b);
        try {
          await navigator.clipboard.writeText(value);
          b.classList.add('is-done');
          if (label) label.textContent = 'copied';
          say('Copied ' + value);
          setTimeout(() => {
            b.classList.remove('is-done');
            if (label) label.textContent = 'copy';
          }, 1600);
        } catch (err) {
          const target = b.previousElementSibling;
          if (target) window.getSelection().selectAllChildren(target);
          say('Selected. Press Ctrl+C to copy');
        }
      });
    });
  }

  // Footer signature: bawat letra lumalabas isa-isa
  function setupSignature() {
    const sig = $('#sig');
    const ok = $('#sigOk');
    const text = sig.textContent.trim();
    sig.textContent = '';
    let i = 0;
    text.split(' ').forEach((word, wi) => {
      if (wi) sig.append(document.createTextNode(' '));
      const w = el('span', 'w');
      w.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach((c) => {
        const ch = el('span', 'ch', c);
        ch.style.setProperty('--i', String(i++));
        w.append(ch);
      });
      sig.append(w);
    });
    sig.append(el('span', 'sr-only', text));
    if (reduceMotion || !('IntersectionObserver' in window)) {
      ok.classList.add('is-on');
      return;
    }
    sig.classList.add('is-armed');
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          sig.classList.remove('is-play');
          void sig.offsetWidth;
          sig.classList.add('is-play');
          ok.classList.add('is-on');
        }
      });
    }, { threshold: 0.6 }).observe(sig);
  }

  // Latest push (hero) + recent pushes (map footer)
  function renderActivity() {
    const latest = latestProject();
    $('#latestPush').textContent = 'Latest push: ' + latest.repo + ' on ' + fmtDate(latest.pushed);
    $('#repoTag').textContent = publicRepos + ' public repos';
    $('#projectCount').textContent = PROJECTS.length + ' projects / ' + GROUPS.length + ' folders';
    const rows = PROJECTS.slice().sort((a, b) => (a.pushed < b.pushed ? 1 : a.pushed > b.pushed ? -1 : 0)).slice(0, 3);
    const ul = $('#recentPushes');
    ul.replaceChildren();
    rows.forEach((p) => {
      const li = el('li');
      li.append(el('span', 'r-time', fmtDate(p.pushed)), el('span', 'r-text', 'push  ' + p.repo), el('span', 'r-val', p.title));
      ul.append(li);
    });
  }

  // 3D tilt ng terminal sa hero
  const tilt = { x: 14, y: -18, mx: 0, my: 0, on: false, ready: false };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    tilt.mx = (e.clientX - r.left) / r.width - 0.5;
    tilt.my = (e.clientY - r.top) / r.height - 0.5;
  });
  hero.addEventListener('pointerleave', () => {
    tilt.mx = 0;
    tilt.my = 0;
  });

  function updateTilt() {
    const wide = window.innerWidth > 1100 && !reduceMotion;
    if (!wide) {
      if (tilt.on) {
        heroTerm.style.transform = '';
        tilt.on = false;
      }
      return;
    }
    if (tilt.ready) {
      const r = hero.getBoundingClientRect();
      const settleK = 1 - clamp(-r.top / (r.height * 0.6), 0, 1);
      tilt.x = lerp(tilt.x, (5 - tilt.my * 4) * settleK, 0.05);
      tilt.y = lerp(tilt.y, (-8 + tilt.mx * 7) * settleK, 0.05);
    }
    heroTerm.style.transform = 'perspective(1800px) rotateX(' + tilt.x.toFixed(2) + 'deg) rotateY(' + tilt.y.toFixed(2) + 'deg)';
    tilt.on = true;
  }

  /* ---------- 11. Live data mula sa GitHub (kapag may internet) ---------- */
  async function refreshGitHub() {
    if (document.querySelector('[data-preview]') || typeof fetch !== 'function') return;
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), 6000);
    try {
      const res = await fetch('https://api.github.com/users/Dhellss/repos?per_page=100&sort=pushed', {
        signal: ctrl ? ctrl.signal : undefined,
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) return;
      const repos = await res.json();
      if (!Array.isArray(repos) || !repos.length) return;
      const byName = new Map(repos.map((r) => [String(r.name).toLowerCase(), r]));
      PROJECTS.forEach((p) => {
        const r = byName.get(p.repo.toLowerCase());
        if (r && r.pushed_at) p.pushed = String(r.pushed_at).slice(0, 10);
      });
      publicRepos = repos.length;
      renderActivity();
      net.refreshData();
    } catch (err) {
      // Offline o naubos ang GitHub limit: gamitin ang naka-save na data.
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- 12. Main loop + start ---------- */
  let last = performance.now();
  let scrollP = 0;
  const docEl = document.documentElement;

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const max = Math.max(1, docEl.scrollHeight - window.innerHeight);
    const target = clamp(window.scrollY / max, 0, 1);
    scrollP = lerp(scrollP, target, 0.07);
    navProgress.style.transform = 'scaleX(' + target.toFixed(4) + ')';

    if (!reduceMotion) bg.draw(now, dt, window.scrollY, scrollP);
    bg.spotlight();
    net.frame(now, dt);
    hs.frame(now, dt);
    updateTilt();
    requestAnimationFrame(loop);
  }

  function init() {
    bg.resize();
    if (reduceMotion) bg.draw(0, 0, 0, 0);
    renderActivity();
    net.init();
    hs.init();
    setupReveals();
    setupNav();
    setupMagnetic();
    setupCopy();
    setupSignature();

    window.addEventListener('resize', () => {
      bg.resize();
      if (reduceMotion) bg.draw(0, 0, window.scrollY, 0);
      hs.resize();
    });

    // Kapag na-load na ang fonts, sukatin ulit ang mga node.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        net.fontsReady();
        hs.resize();
      });
    }

    requestAnimationFrame(loop);
    runBoot(revealHero);
    refreshGitHub();
  }

  init();
})();
