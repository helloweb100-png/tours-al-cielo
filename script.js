/* ==========================================================================
   TOURS AL CIELO · LÓPEZ TOUR — Comportamiento
   - Todo está pensado a prueba de fallos: el contenido es visible por defecto
     y cada efecto es una mejora. Si algo falla, la página se ve completa.
   - anime.js (cdnjs, v3.2.2) es opcional: solo mejora contadores y el estallido
     de burbujas al hacer clic. Sin él, todo funciona igual.
   ========================================================================== */
(() => {
  "use strict";

  /* ---------- CONFIGURACIÓN ----------
     Número de WhatsApp: ÚNICO lugar donde vive. Formato internacional sin "+"
     ni espacios (52 + 10 dígitos). Si queda vacío, los botones de WhatsApp se
     ocultan con elegancia. */
  const WHATSAPP = "529871037745";
  const MARCA = "López Tour";

  window.__tacReady = true;

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const safe = (fn) => { try { fn(); } catch (e) { if (window.console) console.warn("[tours-al-cielo]", e); } };

  let heroVisible = true;
  let ready = false; // el cargador ya terminó

  /* ---------- WHATSAPP ---------- */
  const waLink = (txt) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}`;

  function initWhatsApp() {
    if (!WHATSAPP) {
      root.classList.add("no-wa");
      $$("[data-tel]").forEach((a) => { a.style.display = "none"; });
      const st = $("#formStatus");
      if (st) st.textContent = "Por ahora no tenemos un número de contacto publicado.";
      return;
    }
    $$("[data-wa]").forEach((a) => {
      a.href = waLink(a.dataset.msg || `Hola ${MARCA}, quiero reservar.`);
    });
    $$("[data-tel]").forEach((a) => { a.href = `tel:+${WHATSAPP}`; });
  }

  /* ---------- CARGADOR ---------- */
  function initLoader() {
    const el = $("#loader");
    if (!el) { ready = true; return; }
    const pct = $("#loaderPct");
    const DUR = reduce ? 350 : 1500;
    const t0 = performance.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      ready = true;
      if (pct) pct.textContent = "100";
      el.classList.add("is-done");
      setTimeout(() => el.remove(), 800);
    };
    const loop = (now) => {
      const p = clamp((now - t0) / DUR, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      if (pct) pct.textContent = String(Math.round(e * 100)).padStart(3, "0");
      if (p < 1) { requestAnimationFrame(loop); return; }
      if (document.readyState === "complete" || now - t0 > 2000) finish();
      else window.addEventListener("load", finish, { once: true });
    };
    requestAnimationFrame(loop);
    setTimeout(finish, 2200); // tope duro: nunca se queda más de ~2.2 s
  }

  /* ---------- TEXTO PARTIDO ---------- */
  function splitWave(el) {
    const text = el.textContent.trim().replace(/\s+/g, " ");
    const words = text.split(" ");
    el.textContent = "";
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    el.appendChild(sr);
    const vis = document.createElement("span");
    vis.setAttribute("aria-hidden", "true");
    let c = 0;
    words.forEach((w, wi) => {
      const wd = document.createElement("span");
      wd.className = "wd";
      Array.from(w).forEach((ch) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.style.setProperty("--c", c++);
        s.textContent = ch;
        wd.appendChild(s);
      });
      vis.appendChild(wd);
      if (wi < words.length - 1) vis.appendChild(document.createTextNode(" "));
    });
    el.appendChild(vis);
  }

  function splitWords(node, list) {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = p;
          frag.appendChild(s);
          list.push(s);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) {
        splitWords(n, list);
      }
    });
  }

  /* ---------- REVELADO AL HACER SCROLL (con respaldo por geometría) ---------- */
  let pendingReveal = [];
  function initReveal() {
    pendingReveal = $$("[data-reveal], .reveal-mask");
    const show = (el) => {
      if (el.classList.contains("is-in")) return;
      el.classList.add("is-in");
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      pendingReveal.forEach((el) => io.observe(el));
    }
    revealGeo(window.innerHeight);
    window.addEventListener("load", () => revealGeo(window.innerHeight));
    setTimeout(() => revealGeo(window.innerHeight), 2000);
    setTimeout(() => revealGeo(window.innerHeight), 4500);
  }
  function revealGeo(vh) {
    if (!pendingReveal.length) return;
    pendingReveal = pendingReveal.filter((el) => {
      if (el.classList.contains("is-in")) return false;
      const r = el.getBoundingClientRect();
      if (r.height === 0 && r.width === 0) return true; // oculto (display:none): se revisa después
      if (r.top < vh * 0.94 && r.bottom > 0) { el.classList.add("is-in"); return false; }
      return true;
    });
  }

  /* ---------- CONTADORES ---------- */
  const counted = new WeakSet();
  let counters = [];
  function countUp(el) {
    const end = Number(el.dataset.count);
    if (!end || counted.has(el)) return;
    counted.add(el);
    if (reduce) return;
    if (typeof window.anime === "function") {
      const o = { v: 0 };
      window.anime({
        targets: o, v: end, duration: 1700, easing: "easeOutExpo",
        update: () => { el.textContent = String(Math.round(o.v)); },
        complete: () => { el.textContent = String(end); }
      });
    } else {
      const t0 = performance.now();
      const step = (n) => {
        const p = clamp((n - t0) / 1400, 0, 1);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }
  function updateCounts(vh) {
    if (!ready) return;
    counters.forEach((el) => {
      if (counted.has(el)) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) countUp(el);
    });
  }

  /* ---------- BURBUJAS (canvas) ---------- */
  function createBubbles(canvas, opt) {
    const ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!ctx) return null;
    const o = Object.assign({ count: 48, tone: "light", repel: false }, opt);
    const light = o.tone === "light";
    let w = 1, h = 1, dpr = 1, items = [], visible = false, raf = 0, px = -9999, py = -9999;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const make = (init) => ({
      x: rnd(0, w), y: init ? rnd(0, h) : h + rnd(10, 140) * dpr,
      r: rnd(2, 11) * dpr * (Math.random() < 0.12 ? 1.9 : 1),
      v: rnd(0.25, 0.95) * dpr, ph: rnd(0, 6.28), sw: rnd(0.3, 1) * dpr, a: rnd(0.35, 0.85)
    });

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const b of items) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, 6.2832);
        ctx.fillStyle = light ? `rgba(255,255,255,${(b.a * 0.35).toFixed(2)})` : `rgba(190,240,250,${(b.a * 0.09).toFixed(2)})`;
        ctx.fill();
        ctx.lineWidth = Math.max(1, dpr * 1.1);
        ctx.strokeStyle = light ? `rgba(8,110,150,${(b.a * 0.55).toFixed(2)})` : `rgba(190,240,250,${(b.a * 0.6).toFixed(2)})`;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.38, 3.4, 4.7);
        ctx.lineWidth = Math.max(1, dpr);
        ctx.strokeStyle = `rgba(255,255,255,${b.a.toFixed(2)})`;
        ctx.stroke();
      }
    }
    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.max(1, Math.round(r.width * dpr));
      h = canvas.height = Math.max(1, Math.round(r.height * dpr));
      const n = Math.round(o.count * clamp(r.width / 1200, 0.45, 1));
      items = Array.from({ length: n }, () => make(true));
      draw();
    }
    function step(t) {
      raf = 0;
      if (!visible) return;
      for (const b of items) {
        b.y -= b.v;
        b.x += Math.sin(t / 1100 + b.ph) * b.sw * 0.35;
        if (o.repel) {
          const dx = b.x - px * dpr, dy = b.y - py * dpr, R = 110 * dpr, d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.4 * dpr;
            b.x += (dx / d) * f; b.y += (dy / d) * f;
          }
        }
        if (b.y < -b.r * 2) Object.assign(b, make(false));
      }
      draw();
      raf = requestAnimationFrame(step);
    }
    resize();
    return {
      el: canvas, resize,
      setVisible(v) { if (v === visible) return; visible = v; if (v && !reduce && !raf) raf = requestAnimationFrame(step); },
      setPointer(x, y) { px = x; py = y; }
    };
  }

  const canvases = [];

  /* ---------- HERO: porthole que cambia de parada + inclinación 3D ---------- */
  function initHero() {
    const imgs = $$("#portal img");
    const btns = $$("#route .route__btn");
    const hudNum = $("#hudNum");
    const hudName = $("#hudName");
    const names = ["Arrecife Colombia", "Santuario de la Tortuga", "El Cielo", "Cielito"];
    if (!imgs.length) return;
    let cur = 0, timer = null;

    const set = (i) => {
      cur = (i + imgs.length) % imgs.length;
      imgs.forEach((im, k) => im.classList.toggle("is-on", k === cur));
      btns.forEach((b, k) => {
        b.classList.remove("is-on");
        b.removeAttribute("aria-current");
        if (k === cur) { void b.offsetWidth; b.classList.add("is-on"); b.setAttribute("aria-current", "true"); }
      });
      if (hudNum) hudNum.textContent = String(cur + 1).padStart(2, "0");
      if (hudName) hudName.textContent = names[cur] || "";
    };
    const start = () => {
      clearInterval(timer);
      if (reduce) return;
      timer = setInterval(() => { if (!document.hidden && heroVisible) set(cur + 1); }, 4600);
    };
    btns.forEach((b, k) => b.addEventListener("click", () => { set(k); start(); }));
    start();

    // Inclinación 3D con el puntero y burbujas que huyen del cursor
    const hero = $("#inicio");
    const tilt = $("#tilt");
    const bub = canvases.find((c) => c.el.id === "cvHero");
    if (hero && finePointer && !reduce) {
      hero.addEventListener("pointermove", (e) => {
        if (tilt) {
          const r = tilt.getBoundingClientRect();
          const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          tilt.style.setProperty("--ry", (clamp(x, -1.2, 1.2) * 9).toFixed(2) + "deg");
          tilt.style.setProperty("--rx", (clamp(-y, -1.2, 1.2) * 7).toFixed(2) + "deg");
        }
        if (bub) {
          const cr = bub.el.getBoundingClientRect();
          bub.setPointer(e.clientX - cr.left, e.clientY - cr.top);
        }
      });
      hero.addEventListener("pointerleave", () => {
        if (tilt) { tilt.style.setProperty("--rx", "0deg"); tilt.style.setProperty("--ry", "0deg"); }
        if (bub) bub.setPointer(-9999, -9999);
      });
    }
  }

  /* ---------- ESTALLIDO DE BURBUJAS EN LOS CTA (anime.js, opcional) ---------- */
  function burst(x, y) {
    if (reduce || typeof window.anime !== "function") return;
    const els = [];
    for (let i = 0; i < 12; i++) {
      const d = document.createElement("i");
      d.className = "pop";
      d.style.left = x + "px";
      d.style.top = y + "px";
      document.body.appendChild(d);
      els.push(d);
    }
    window.anime({
      targets: els,
      translateX: () => window.anime.random(-90, 90),
      translateY: () => window.anime.random(-140, -30),
      scale: [{ value: () => window.anime.random(8, 16) / 10, duration: 180 }, { value: 0, duration: 700 }],
      opacity: [{ value: 1, duration: 40 }, { value: 0, duration: 760, easing: "linear" }],
      easing: "easeOutCubic", duration: 900, delay: window.anime.stagger(12),
      complete: () => els.forEach((e) => e.remove())
    });
  }
  function initBursts() {
    $$(".btn--primary, .fab").forEach((b) => {
      b.addEventListener("click", (e) => {
        let x = e.clientX, y = e.clientY;
        if (!x && !y) { const r = b.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
        burst(x, y);
      });
    });
    // Botones "magnéticos" (solo con puntero fino)
    if (finePointer && !reduce) {
      $$(".btn--lg").forEach((b) => {
        b.addEventListener("pointermove", (e) => {
          const r = b.getBoundingClientRect();
          const x = (e.clientX - (r.left + r.width / 2)) * 0.16;
          const y = (e.clientY - (r.top + r.height / 2)) * 0.22;
          b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        });
        b.addEventListener("pointerleave", () => { b.style.transform = ""; });
      });
    }
  }

  /* ---------- MENÚ MÓVIL ---------- */
  function initMenu() {
    const toggle = $("#navToggle");
    const menu = $("#menu");
    if (!toggle || !menu) return;
    const setOpen = (open) => {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    };
    toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- BOLETO: inclinación y elección de salida ---------- */
  function initTicket() {
    const ticket = $("#ticket");
    if (ticket && finePointer && !reduce) {
      ticket.addEventListener("pointermove", (e) => {
        const r = ticket.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        ticket.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
        ticket.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
      });
      ticket.addEventListener("pointerleave", () => {
        ticket.style.setProperty("--rx", "0deg");
        ticket.style.setProperty("--ry", "0deg");
      });
    }
    const cta = $("#ticketCta");
    $$('input[name="salida"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (!cta) return;
        cta.dataset.msg = `Hola ${MARCA} 🎟️ Quiero apartar mi lugar en el tour de las ${radio.value}. ¿Tienen disponibilidad?`;
        if (WHATSAPP) cta.href = waLink(cta.dataset.msg);
        const sel = $("#f-hora");
        if (sel) sel.value = radio.value;
      });
    });
  }

  /* ---------- FORMULARIO → WHATSAPP ---------- */
  function initForm() {
    const form = $("#form");
    if (!form) return;
    const status = $("#formStatus");
    const fecha = $("#f-fecha");
    if (fecha) {
      const d = new Date();
      fecha.min = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!WHATSAPP) return;
      if (!form.reportValidity()) {
        if (status) status.textContent = "Revisa los campos marcados y vuelve a intentarlo.";
        return;
      }
      const data = new FormData(form);
      const nombre = String(data.get("nombre") || "").trim();
      const hora = String(data.get("hora") || "");
      const personas = String(data.get("personas") || "");
      const nota = String(data.get("nota") || "").trim();
      let fechaTxt = String(data.get("fecha") || "");
      if (fechaTxt) {
        const f = new Date(fechaTxt + "T12:00:00");
        if (!isNaN(f)) fechaTxt = f.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
      }
      const lines = [
        `Hola ${MARCA} 👋`,
        "Quiero reservar el tour de snorkel Tours al Cielo en Cozumel.",
        "",
        `Nombre: ${nombre}`,
        `Fecha: ${fechaTxt}`,
        `Salida: ${hora}`,
        `Personas: ${personas}`
      ];
      if (nota) lines.push(`Comentarios: ${nota}`);
      lines.push("", "¿Me confirman disponibilidad? Gracias.");
      const a = document.createElement("a");
      a.href = waLink(lines.join("\n"));
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (status) status.textContent = "Abriendo WhatsApp con tu mensaje listo. ¡Te esperamos en el mar!";
    });
  }

  /* ---------- PREGUNTAS: una abierta a la vez ---------- */
  function initFaq() {
    const all = $$("#faq details");
    all.forEach((d) => d.addEventListener("toggle", () => {
      if (d.open) all.forEach((o) => { if (o !== d) o.open = false; });
    }));
  }

  /* ---------- CLIPS: sonido y reproducción solo cuando se ven ---------- */
  function initClips() {
    $$(".clip__sound").forEach((btn) => {
      btn.addEventListener("click", () => {
        const frame = btn.closest(".clip__frame");
        const v = frame && $("video", frame);
        if (!v) return;
        const turnOn = v.muted;
        $$("video.clip__v").forEach((o) => { o.muted = true; });
        $$(".clip__sound").forEach((b) => b.setAttribute("aria-pressed", "false"));
        if (turnOn) { v.muted = false; btn.setAttribute("aria-pressed", "true"); }
      });
    });
    if (reduce) $$("video.clip__v").forEach((v) => { v.controls = true; });
  }

  /* ---------- MOTOR DE SCROLL ---------- */
  const el = {};
  let words = [], lastWords = -1, steps = [], activeStep = -1, pars = [], videos = [];
  let reelH = false, reelMax = 0;
  const mqH = window.matchMedia("(min-width: 960px)");

  function updateWords(vh) {
    if (!words.length || !el.mani) return;
    const r = el.mani.getBoundingClientRect();
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
    const n = r.bottom < vh * 0.4 ? words.length : Math.round(p * words.length);
    if (n === lastWords) return;
    lastWords = n;
    words.forEach((w, i) => w.classList.toggle("on", i < n));
  }

  function setStep(i) {
    if (i === activeStep) return;
    activeStep = i;
    steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
    $$("#stage .stage__img").forEach((im, k) => im.classList.toggle("is-on", k === i));
    const n = $("#stageNum");
    if (n) n.textContent = String(i + 1).padStart(2, "0");
  }
  function updateSteps(vh) {
    if (!steps.length || !el.steps) return;
    const gr = el.steps.getBoundingClientRect();
    if (gr.bottom < 0 || gr.top > vh) return;
    let best = 0, bestD = Infinity;
    steps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
      if (d < bestD) { bestD = d; best = i; }
    });
    setStep(best);
    el.steps.style.setProperty("--prog", clamp((vh * 0.5 - gr.top) / gr.height, 0, 1).toFixed(3));
  }

  function updateExpand(vh) {
    if (!el.expand) return;
    const r = el.expand.getBoundingClientRect();
    const total = r.height - vh;
    const t = total > 0 ? clamp(-r.top / total, 0, 1) : 1;
    const e = clamp(t / 0.5, 0, 1);
    el.expand.style.setProperty("--p", (1 - Math.pow(1 - e, 3)).toFixed(4));
  }

  function reelSetup() {
    if (!el.reel || !el.track || !el.pin) return;
    reelH = mqH.matches && !reduce;
    el.reel.classList.toggle("is-h", reelH);
    el.track.style.transform = "";
    el.reel.style.height = "";
    if (!reelH) return;
    requestAnimationFrame(() => {
      reelMax = Math.max(0, el.track.scrollWidth - el.pin.clientWidth);
      el.reel.style.height = (window.innerHeight + reelMax) + "px";
      onScroll();
    });
  }
  function updateReel(vh) {
    if (!reelH) return;
    const r = el.reel.getBoundingClientRect();
    const total = r.height - vh;
    const t = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    el.track.style.transform = `translate3d(${(-t * reelMax).toFixed(1)}px,0,0)`;
  }

  function updateParallax(vh) {
    pars.forEach((p) => {
      const host = p.el.parentElement;
      if (!host) return;
      const r = host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const off = (r.top + r.height / 2 - vh / 2) * p.k;
      p.el.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
    });
  }

  function updateMedia(vh) {
    const vw = window.innerWidth;
    videos.forEach((v) => {
      const r = v.getBoundingClientRect();
      // Carga diferida: el video solo se descarga cuando está cerca de la pantalla
      if (!v.getAttribute("src") && v.dataset.src && r.bottom > -vh && r.top < vh * 2 && r.right > -vw && r.left < vw * 2) {
        v.preload = "auto";
        v.addEventListener("loadeddata", () => { const f = v.closest(".clip__frame"); if (f) f.classList.add("is-ready"); }, { once: true });
        v.src = v.dataset.src;
      }
      const vis = r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
      if (vis === v._vis) return;
      v._vis = vis;
      if (vis) {
        if (!reduce) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
      } else {
        v.pause();
      }
    });
    canvases.forEach((c) => {
      const r = c.el.getBoundingClientRect();
      c.setVisible(r.bottom > 0 && r.top < vh);
    });
    if (el.hero) heroVisible = el.hero.getBoundingClientRect().bottom > 0;
  }

  function updateNavActive(vh) {
    if (!el.navLinks) return;
    let cur = -1;
    el.navSecs.forEach((s, i) => {
      if (!s) return;
      const r = s.getBoundingClientRect();
      if (r.top <= vh * 0.4 && r.bottom > vh * 0.4) cur = i;
    });
    el.navLinks.forEach((a, i) => a.classList.toggle("is-on", i === cur));
  }

  function update() {
    const vh = window.innerHeight;
    const y = window.scrollY || window.pageYOffset || 0;
    const max = root.scrollHeight - vh;
    const p = max > 0 ? clamp(y / max, 0, 1) : 0;
    if (el.progress) el.progress.style.setProperty("--sp", p.toFixed(4));
    if (el.gauge) {
      el.gauge.style.setProperty("--gp", p.toFixed(4));
      if (el.gaugeVal) el.gaugeVal.textContent = (p * 12).toFixed(1) + " m";
    }
    if (el.nav) el.nav.classList.toggle("is-stuck", y > 30);
    if (el.gauge && el.reel) {
      // El profundímetro se aparta mientras los clips ocupan la pantalla (escritorio)
      const rr = el.reel.getBoundingClientRect();
      el.gauge.classList.toggle("is-off", reelH && rr.top < vh * 0.85 && rr.bottom > vh * 0.15);
    }
    safe(() => updateWords(vh));
    safe(() => updateSteps(vh));
    if (!reduce) safe(() => updateExpand(vh));
    safe(() => updateReel(vh));
    if (!reduce) safe(() => updateParallax(vh));
    safe(() => updateMedia(vh));
    safe(() => updateNavActive(vh));
    safe(() => revealGeo(vh));
    safe(() => updateCounts(vh));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }

  /* ---------- ARRANQUE ---------- */
  function init() {
    safe(initWhatsApp);
    safe(initLoader);

    el.nav = $("#nav");
    el.progress = $("#progress");
    el.gauge = $("#gauge");
    el.gaugeVal = $("#gaugeVal");
    el.hero = $("#inicio");
    el.mani = $("#maniText");
    el.steps = $("#steps");
    el.expand = $("#momentos");
    el.reel = $(".reel");
    el.pin = $(".reel__pin");
    el.track = $("#reelTrack");
    el.navLinks = $$(".nav__links a");
    el.navSecs = el.navLinks.map((a) => $(a.getAttribute("href")));

    safe(() => { const y = $("#year"); if (y) y.textContent = new Date().getFullYear(); });

    // Texto partido
    safe(() => $$("[data-wave]").forEach(splitWave));
    safe(() => { if (el.mani) splitWords(el.mani, words); });
    if (reduce) words.forEach((w) => w.classList.add("on"));

    steps = $$("#steps .step");
    pars = $$("[data-par]").map((n) => ({ el: n, k: parseFloat(n.dataset.par) || 0 }));
    videos = $$("video.clip__v");
    counters = $$("[data-count]");

    // Burbujas
    safe(() => {
      const defs = [
        ["cvHero", { count: 56, tone: "light", repel: true }],
        ["cvMani", { count: 38, tone: "dark" }],
        ["cvBook", { count: 34, tone: "dark" }]
      ];
      defs.forEach(([id, opt]) => {
        const c = createBubbles($("#" + id), opt);
        if (c) canvases.push(c);
      });
    });

    safe(initReveal);
    safe(initHero);
    safe(initBursts);
    safe(initMenu);
    safe(initTicket);
    safe(initForm);
    safe(initFaq);
    safe(initClips);
    safe(reelSetup);

    if (reduce && el.expand) { el.expand.style.setProperty("--p", "1"); el.expand.style.height = "100vh"; }

    window.addEventListener("scroll", onScroll, { passive: true });
    // Carrusel móvil de clips: al deslizar de lado también se activan/pausan los videos
    if (el.track) el.track.addEventListener("scroll", onScroll, { passive: true });
    let rt = 0;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        canvases.forEach((c) => c.resize());
        reelSetup();
        onScroll();
      }, 160);
    });
    window.addEventListener("load", () => { reelSetup(); onScroll(); });
    if (typeof mqH.addEventListener === "function") mqH.addEventListener("change", () => { reelSetup(); onScroll(); });
    document.addEventListener("visibilitychange", onScroll);

    update();
    setTimeout(update, 600);
    setTimeout(() => { reelSetup(); update(); }, 2300); // cuando termina el cargador y las fuentes
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
