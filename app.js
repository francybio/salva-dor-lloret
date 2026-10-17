/* ==========================================================
   SALVA D'OR — interfaz
   Entrada con destello, configurador del anillo (envía la
   configuración al módulo 3D con el evento «ring:config»),
   medidor de talla en pantalla calibrado con una tarjeta,
   vitrina de vídeos y premio Consonància.
   ========================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const STATIC = /[?&]static\b/.test(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || STATIC;
const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const motion = hasGSAP && !reduced;
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const play = (v) => { if (!v) return; if (v.preload === 'none') v.preload = 'auto'; const p = v.play(); if (p) p.catch(() => {}); };
const fmt = (n, d = 2) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } } };

/* ----------------------------------------------------------
   DATOS (textos de los posts de @joieria_salva_dor)
   ---------------------------------------------------------- */
const PIECES = [
  { v: 'alta-joyeria', t: 'Alta joyería en oro blanco', d: 'Una de las creaciones más espectaculares que han salido de nuestro taller: líneas que se entrelazan, acabados pulidos y satinados, y un diseño único lleno de personalidad.', dl: [['Oro', 'Blanco de 18 quilates'], ['Diamante central', '0,50 ct'], ['Total en diamantes', '1,29 ct']] },
  { v: 'solitario', t: 'Solitario de oro blanco', d: 'La belleza de lo esencial: todo el protagonismo para un diamante natural, engastado a mano con la máxima precisión.', dl: [['Oro', 'Blanco de 18 quilates'], ['Diamante', 'Natural · talla brillante · G · VS1']] },
  { v: 'oro-amarillo', t: 'Anillo de oro amarillo y brillantes', d: 'Elegancia, luz y equilibrio: líneas clásicas y refinadas, con brillantes engastados a lo largo del brazo.', dl: [['Oro', 'Amarillo de 18 kt'], ['Central', '0,25 ct · G · VS1'], ['Brazo', '0,20 ct en brillantes'], ['Total', '0,45 ct']] },
  { v: 'media-alianza', t: 'Media alianza', d: 'Diamantes talla brillante engastados en carril para crear una línea de luz continua. Perfecta para llevar a diario o combinar con otros anillos.', dl: [['Oro', 'Amarillo de 18 quilates'], ['Engaste', 'En carril'], ['Piedras', 'Diamantes talla brillante']] },
  { v: 'bicolor', t: 'Anillo bicolor', d: 'El contraste entre el oro amarillo matizado y el oro blanco pulido crea una pieza elegante, masculina y atemporal. Hecho en el taller, pieza a pieza.', dl: [['Oro', 'Amarillo matizado y blanco pulido'], ['Estilo', 'Masculino, atemporal']] },
  { v: 'neumatico', t: 'El anillo neumático', d: 'Hay pasiones que merecen convertirse en joya: reproduce el dibujo de un neumático y se hizo a medida para un cliente motero.', dl: [['Oro', 'Blanco de 18 quilates'], ['Acabado', 'Baño de rutenio negro'], ['Encargo', 'A medida']] },
  { v: 'circulo', t: 'Colgante círculo de luz', d: 'Una delicada curva de diamantes engastados de mayor a menor. La cadena forzada facetada acompaña la luz de cada piedra.', dl: [['Oro', 'Amarillo de 18 quilates'], ['Diamantes', 'En degradado'], ['Cadena', 'Forzada facetada']] },
  { v: 'tribal', t: 'Colgante de inspiración tribal', d: 'Líneas con fuerza, una textura delicada y contornos pulidos que juegan con la luz. En el centro, una piedra negra le da carácter.', dl: [['Piedra', 'Negra, al centro'], ['Acabado', 'Textura y pulido']] }
];
const BRANDS = ['Seiko', 'Festina', 'Viceroy', 'Casio', 'Maserati', 'Guess', 'Police', 'Nixon', 'Invicta', 'Sandoz', 'Marea', 'Morellato', 'Philip Watch', 'Just Cavalli', 'John Galliano'];
const MODEL_TXT = { solitario: 'Solitario', pave: 'Solitario con pavé', media: 'Media alianza', alianza: 'Alianza' };
const METAL_TXT = { amarillo: 'oro amarillo', blanco: 'oro blanco', rosa: 'oro rosa', bicolor: 'oro amarillo y blanco' };
const GEM_TXT = { diamante: 'diamante', esmeralda: 'esmeralda', zafiro: 'zafiro', rubi: 'rubí' };
const GEM_PL = { diamante: 'diamantes', esmeralda: 'esmeraldas', zafiro: 'zafiros', rubi: 'rubíes' };

/* ----------------------------------------------------------
   HORARIO · L–S 10–13:30 y 16:30–20 (verano hasta las 22) · D cerrado
   ---------------------------------------------------------- */
const madrid = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: +p.hour * 60 + +p.minute };
};
const paintLive = () => {
  const { d, m } = madrid();
  const open = d !== 0 && ((m >= 600 && m < 810) || (m >= 990 && m < 1200));
  let txt;
  if (open) txt = m < 810 ? 'Abierto · hasta las 13:30' : 'Abierto · hasta las 20:00';
  else if (d !== 0 && m < 600) txt = 'Cerrado · abrimos a las 10:00';
  else if (d !== 0 && m >= 810 && m < 990) txt = 'Cerrado · reabrimos a las 16:30';
  else txt = d === 6 || d === 0 ? 'Cerrado · el lunes a las 10:00' : 'Cerrado · mañana a las 10:00';
  $$('[data-live]').forEach((el) => { el.classList.toggle('is-open', open); el.classList.toggle('is-closed', !open); $('[data-live-text]', el).textContent = txt; });
};
paintLive(); setInterval(paintLive, 30000);

/* ----------------------------------------------------------
   SCROLL · NAV · MENÚ · ENTRADA
   ---------------------------------------------------------- */
let lenis = null;
if (motion && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const nav = $('#nav'), burger = $('#burger'), drawer = $('#drawer');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 40);
  nav.classList.toggle('is-hidden', y > 600 && y > lastY && !drawer.classList.contains('is-open'));
  lastY = y;
}, { passive: true });
const setDrawer = (open) => { burger.setAttribute('aria-expanded', open); drawer.classList.toggle('is-open', open); document.body.style.overflow = open ? 'hidden' : ''; if (lenis) open ? lenis.stop() : lenis.start(); };
burger.addEventListener('click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
const goTo = (t) => { if (lenis) lenis.scrollTo(t, { offset: -60 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); };
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href'); if (id.length < 2) return;
  const t = $(id); if (!t) return;
  e.preventDefault(); setDrawer(false); goTo(t);
}));
const intro = $('#intro');
const heroIn = () => {
  if (!motion) return;
  gsap.from('.hero__title .ln > span', { yPercent: 110, duration: 1.3, ease: 'power4.out', stagger: .1 });
  gsap.from('.hero .kicker, .hero__lead, .hero__cta, .hero__specs li', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: .07, delay: .3 });
  gsap.from('.stage--hero', { scale: .85, opacity: 0, duration: 1.6, ease: 'power3.out' });
};
if (reduced) { intro.remove(); }
else { document.body.style.overflow = 'hidden'; setTimeout(() => { intro.classList.add('is-out'); document.body.style.overflow = ''; heroIn(); setTimeout(() => intro.remove(), 1100); }, 1700); }

/* ----------------------------------------------------------
   CONFIGURADOR
   ---------------------------------------------------------- */
const cfg = { model: 'solitario', metal: 'amarillo', gem: 'diamante', shape: 'redonda', ct: .5, size: 13, engr: '' };
window.__ringConfig = { ...cfg };
const sizeSel = $('#size');
for (let s = 6; s <= 30; s++) sizeSel.insertAdjacentHTML('beforeend', `<option value="${s}"${s === 13 ? ' selected' : ''}>${s} · Ø ${fmt((s + 40) / Math.PI, 1)} mm</option>`);
const ct = $('#ct'), ctOut = $('#ctOut'), stageCt = $('#stageCt');
const paintRange = (r) => { const p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--p', p + '%'); };
const summary = () => {
  const metal = METAL_TXT[cfg.metal];
  let t;
  if (cfg.model === 'alianza') t = `Alianza en ${metal} de 18 k`;
  else if (cfg.model === 'media') t = `Media alianza en ${metal} de 18 k con ${GEM_PL[cfg.gem]} talla brillante · ${fmt(cfg.ct)} ct en total`;
  else t = `${MODEL_TXT[cfg.model]} en ${metal} de 18 k con ${GEM_TXT[cfg.gem]} ${cfg.shape === 'oval' ? 'talla oval' : 'talla brillante'} de ${fmt(cfg.ct)} ct`;
  t += ` · talla ${cfg.size}`;
  if (cfg.engr.trim()) t += ` · grabado «${cfg.engr.trim()}»`;
  $('#summary').textContent = t;
  const body = `Hola, Joan:\n\nMe gustaría pedir presupuesto para este anillo, diseñado en vuestra web:\n\n${t}.\n\nGracias.`;
  $('#mailBtn').href = `mailto:info@joieriasalvador.com?subject=${encodeURIComponent('Presupuesto · anillo diseñado en la web')}&body=${encodeURIComponent(body)}`;
};
const send = () => {
  const noStone = cfg.model === 'alianza';
  $('#optGem').disabled = noStone; $('#optCt').disabled = noStone; $('#optShape').disabled = noStone || cfg.model === 'media';
  $('#optCt legend').firstChild.textContent = cfg.model === 'media' ? 'Quilates en total ' : 'Quilates ';
  ctOut.textContent = stageCt.textContent = `${fmt(cfg.ct)} ct`;
  stageCt.style.opacity = noStone ? 0 : 1;
  window.__ringConfig = { ...cfg };
  document.dispatchEvent(new CustomEvent('ring:config', { detail: { model: cfg.model, metal: cfg.metal, gem: cfg.gem, shape: cfg.shape, ct: cfg.ct } }));
  summary();
};
$$('.seg').forEach((seg) => seg.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $$('button', seg).forEach((x) => x.classList.toggle('is-on', x === b));
  cfg[seg.dataset.key] = b.dataset.v; send();
}));
let ctT;
ct.addEventListener('input', () => { cfg.ct = +ct.value; paintRange(ct); ctOut.textContent = stageCt.textContent = `${fmt(cfg.ct)} ct`; clearTimeout(ctT); ctT = setTimeout(send, 60); });
sizeSel.addEventListener('change', () => { cfg.size = +sizeSel.value; summary(); });
$('#engr').addEventListener('input', (e) => { cfg.engr = e.target.value; summary(); });
paintRange(ct); send();

/* ----------------------------------------------------------
   MEDIDOR DE TALLA EN PANTALLA
   k = píxeles CSS por milímetro (se calibra con una tarjeta ISO de 85,6 mm)
   talla española = perímetro interior en mm − 40
   ---------------------------------------------------------- */
(() => {
  const sizer = $('#sizer'), calib = $('#calib'), dia = $('#dia');
  const saved = parseFloat(store.get('salvador-k'));
  if (saved > 2 && saved < 9) calib.value = saved;
  else if (matchMedia('(pointer: coarse)').matches) calib.value = 6;
  const setK = () => { sizer.style.setProperty('--k', calib.value); paintRange(calib); };
  const steps = $$('.steps li');
  const step = (n) => {
    $$('.sizer__step', sizer).forEach((p) => { p.hidden = +p.dataset.panel !== n; });
    steps.forEach((li) => li.classList.toggle('is-on', +li.dataset.step <= n + (n === 2 ? 1 : 0) && +li.dataset.step >= n));
  };
  const calc = () => {
    const d = +dia.value, per = Math.PI * d, talla = Math.round(per - 40);
    sizer.style.setProperty('--d', d); paintRange(dia);
    $('#diaOut').textContent = `${fmt(d, 1)} mm`;
    $('#sizeOut').textContent = talla;
    $('#circOut').textContent = `perímetro ${fmt(per, 1)} mm`;
    return talla;
  };
  calib.addEventListener('input', setK);
  dia.addEventListener('input', calc);
  $('#calibOk').addEventListener('click', () => { store.set('salvador-k', calib.value); step(2); });
  $('#calibBack').addEventListener('click', () => step(1));
  $('#useSize').addEventListener('click', () => {
    const t = Math.min(30, Math.max(6, calc()));
    sizeSel.value = t; cfg.size = t; summary();
    goTo($('#disena'));
  });
  setK(); calc(); step(1);
})();

/* ----------------------------------------------------------
   VITRINA · vídeo grande + miniaturas
   ---------------------------------------------------------- */
(() => {
  const vid = $('#vitVid'), list = $('#vitList'), prog = $('#vitProg');
  list.innerHTML = PIECES.map((p, i) => `<li><button type="button" data-i="${i}" aria-label="${p.t}"><img src="assets/img/v-${p.v}.jpg" alt="" loading="lazy"><span>${String(i + 1).padStart(2, '0')}</span></button></li>`).join('');
  let i = 0, inView = false;
  const show = (n, autoplay = true) => {
    i = (n + PIECES.length) % PIECES.length;
    const p = PIECES[i];
    vid.poster = `assets/img/v-${p.v}.jpg`;
    vid.src = `assets/video/${p.v}.mp4`;
    $('#vitNo').textContent = `${String(i + 1).padStart(2, '0')} / ${String(PIECES.length).padStart(2, '0')}`;
    $('#vitT').textContent = p.t; $('#vitD').textContent = p.d;
    $('#vitDl').innerHTML = p.dl.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
    $$('button', list).forEach((b, j) => b.classList.toggle('is-on', j === i));
    if (motion) gsap.fromTo(['#vitT', '#vitD', '#vitDl'], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, stagger: .06 });
    if (autoplay && inView && !reduced) play(vid);
  };
  list.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(+b.dataset.i); });
  vid.addEventListener('timeupdate', () => { if (vid.duration) prog.style.width = (vid.currentTime / vid.duration * 100) + '%'; });
  vid.addEventListener('ended', () => show(i + 1));
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView && !reduced) play(vid); else vid.pause(); }, { threshold: .35 }).observe(vid);
  show(0, false);
})();

/* ----------------------------------------------------------
   CONSONÀNCIA · vídeos con sonido opcional
   ---------------------------------------------------------- */
const cvids = ['#consVid', '#fitelVid'].map((s) => $(s));
const cio = new IntersectionObserver((ens) => ens.forEach((en) => { if (en.isIntersecting) { if (!reduced) play(en.target); } else en.target.pause(); }), { threshold: .3 });
cvids.forEach((v) => cio.observe(v));
$$('.snd').forEach((b) => b.addEventListener('click', () => {
  const v = document.getElementById(b.dataset.snd);
  const on = v.muted;
  cvids.forEach((o) => { o.muted = true; });
  $$('.snd').forEach((o) => { o.classList.remove('is-on'); o.querySelector('i').className = 'ph-light ph-speaker-slash'; });
  if (on) { v.muted = false; play(v); b.classList.add('is-on'); b.querySelector('i').className = 'ph-light ph-speaker-high'; }
}));

/* marcas */
$('#brands').innerHTML = [...BRANDS, ...BRANDS].map((b) => `<span>${b}</span>`).join('');

/* ----------------------------------------------------------
   APARICIONES
   ---------------------------------------------------------- */
if (motion) {
  $$('.sec-head, .taller__copy, .panel, .talla__copy, .sizer, .vit__info, .cons__head, .cons__facts, .reloj__copy, .resenas__score, .visita__copy').forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
  });
  gsap.from('.tp', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'power4.inOut', stagger: .2, scrollTrigger: { trigger: '.taller__pics', start: 'top 80%' } });
  gsap.from('.timeline li', { x: -20, opacity: 0, duration: .8, stagger: .1, scrollTrigger: { trigger: '.timeline', start: 'top 85%' } });
  gsap.from('.cons__title', { letterSpacing: '.4em', opacity: 0, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: '.cons__title', start: 'top 85%' } });
  gsap.from('.cons__pic, .cons__vid', { y: 70, opacity: 0, duration: 1.2, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.cons__grid', start: 'top 85%' } });
  gsap.from('.revs blockquote', { y: 40, opacity: 0, duration: 1, stagger: .1, scrollTrigger: { trigger: '.revs', start: 'top 85%' } });
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
})();
