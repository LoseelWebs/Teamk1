/* Lenis 1.x (scroll suave) — licencia MIT, darkroom.engineering */
!function(t,i){"object"==typeof exports&&"undefined"!=typeof module?module.exports=i():"function"==typeof define&&define.amd?define(i):(t="undefined"!=typeof globalThis?globalThis:t||self).Lenis=i()}(this,(function(){"use strict";function clamp(t,i,e){return Math.max(t,Math.min(i,e))}class Animate{constructor(){this.isRunning=!1,this.value=0,this.from=0,this.to=0,this.currentTime=0}advance(t){var i;if(!this.isRunning)return;let e=!1;if(this.duration&&this.easing){this.currentTime+=t;const i=clamp(0,this.currentTime/this.duration,1);e=i>=1;const s=e?1:this.easing(i);this.value=this.from+(this.to-this.from)*s}else this.lerp?(this.value=function damp(t,i,e,s){return function lerp(t,i,e){return(1-e)*t+e*i}(t,i,1-Math.exp(-e*s))}(this.value,this.to,60*this.lerp,t),Math.round(this.value)===this.to&&(this.value=this.to,e=!0)):(this.value=this.to,e=!0);e&&this.stop(),null===(i=this.onUpdate)||void 0===i||i.call(this,this.value,e)}stop(){this.isRunning=!1}fromTo(t,i,{lerp:e,duration:s,easing:o,onStart:n,onUpdate:l}){this.from=this.value=t,this.to=i,this.lerp=e,this.duration=s,this.easing=o,this.currentTime=0,this.isRunning=!0,null==n||n(),this.onUpdate=l}}class Dimensions{constructor(t,i,{autoResize:e=!0,debounce:s=250}={}){this.wrapper=t,this.content=i,this.width=0,this.height=0,this.scrollHeight=0,this.scrollWidth=0,this.resize=()=>{this.onWrapperResize(),this.onContentResize()},this.onWrapperResize=()=>{this.wrapper instanceof Window?(this.width=window.innerWidth,this.height=window.innerHeight):(this.width=this.wrapper.clientWidth,this.height=this.wrapper.clientHeight)},this.onContentResize=()=>{this.wrapper instanceof Window?(this.scrollHeight=this.content.scrollHeight,this.scrollWidth=this.content.scrollWidth):(this.scrollHeight=this.wrapper.scrollHeight,this.scrollWidth=this.wrapper.scrollWidth)},e&&(this.debouncedResize=function debounce(t,i){let e;return function(...s){let o=this;clearTimeout(e),e=setTimeout((()=>{e=void 0,t.apply(o,s)}),i)}}(this.resize,s),this.wrapper instanceof Window?window.addEventListener("resize",this.debouncedResize,!1):(this.wrapperResizeObserver=new ResizeObserver(this.debouncedResize),this.wrapperResizeObserver.observe(this.wrapper)),this.contentResizeObserver=new ResizeObserver(this.debouncedResize),this.contentResizeObserver.observe(this.content)),this.resize()}destroy(){var t,i;null===(t=this.wrapperResizeObserver)||void 0===t||t.disconnect(),null===(i=this.contentResizeObserver)||void 0===i||i.disconnect(),this.wrapper===window&&this.debouncedResize&&window.removeEventListener("resize",this.debouncedResize,!1)}get limit(){return{x:this.scrollWidth-this.width,y:this.scrollHeight-this.height}}}class Emitter{constructor(){this.events={}}emit(t,...i){var e;let s=this.events[t]||[];for(let t=0,o=s.length;t<o;t++)null===(e=s[t])||void 0===e||e.call(s,...i)}on(t,i){var e;return(null===(e=this.events[t])||void 0===e?void 0:e.push(i))||(this.events[t]=[i]),()=>{var e;this.events[t]=null===(e=this.events[t])||void 0===e?void 0:e.filter((t=>i!==t))}}off(t,i){var e;this.events[t]=null===(e=this.events[t])||void 0===e?void 0:e.filter((t=>i!==t))}destroy(){this.events={}}}const t=100/6,i={passive:!1};class VirtualScroll{constructor(e,s={wheelMultiplier:1,touchMultiplier:1}){this.element=e,this.options=s,this.touchStart={x:0,y:0},this.lastDelta={x:0,y:0},this.window={width:0,height:0},this.emitter=new Emitter,this.onTouchStart=t=>{const{clientX:i,clientY:e}=t.targetTouches?t.targetTouches[0]:t;this.touchStart.x=i,this.touchStart.y=e,this.lastDelta={x:0,y:0},this.emitter.emit("scroll",{deltaX:0,deltaY:0,event:t})},this.onTouchMove=t=>{const{clientX:i,clientY:e}=t.targetTouches?t.targetTouches[0]:t,s=-(i-this.touchStart.x)*this.options.touchMultiplier,o=-(e-this.touchStart.y)*this.options.touchMultiplier;this.touchStart.x=i,this.touchStart.y=e,this.lastDelta={x:s,y:o},this.emitter.emit("scroll",{deltaX:s,deltaY:o,event:t})},this.onTouchEnd=t=>{this.emitter.emit("scroll",{deltaX:this.lastDelta.x,deltaY:this.lastDelta.y,event:t})},this.onWheel=i=>{let{deltaX:e,deltaY:s,deltaMode:o}=i;e*=1===o?t:2===o?this.window.width:1,s*=1===o?t:2===o?this.window.height:1,e*=this.options.wheelMultiplier,s*=this.options.wheelMultiplier,this.emitter.emit("scroll",{deltaX:e,deltaY:s,event:i})},this.onWindowResize=()=>{this.window={width:window.innerWidth,height:window.innerHeight}},window.addEventListener("resize",this.onWindowResize,!1),this.onWindowResize(),this.element.addEventListener("wheel",this.onWheel,i),this.element.addEventListener("touchstart",this.onTouchStart,i),this.element.addEventListener("touchmove",this.onTouchMove,i),this.element.addEventListener("touchend",this.onTouchEnd,i)}on(t,i){return this.emitter.on(t,i)}destroy(){this.emitter.destroy(),window.removeEventListener("resize",this.onWindowResize,!1),this.element.removeEventListener("wheel",this.onWheel,i),this.element.removeEventListener("touchstart",this.onTouchStart,i),this.element.removeEventListener("touchmove",this.onTouchMove,i),this.element.removeEventListener("touchend",this.onTouchEnd,i)}}return class Lenis{constructor({wrapper:t=window,content:i=document.documentElement,eventsTarget:e=t,smoothWheel:s=!0,syncTouch:o=!1,syncTouchLerp:n=.075,touchInertiaMultiplier:l=35,duration:r,easing:h=(t=>Math.min(1,1.001-Math.pow(2,-10*t))),lerp:a=.1,infinite:c=!1,orientation:u="vertical",gestureOrientation:d="vertical",touchMultiplier:p=1,wheelMultiplier:m=1,autoResize:v=!0,prevent:g,virtualScroll:S,__experimental__naiveDimensions:w=!1}={}){this._isScrolling=!1,this._isStopped=!1,this._isLocked=!1,this._preventNextNativeScrollEvent=!1,this._resetVelocityTimeout=null,this.time=0,this.userData={},this.lastVelocity=0,this.velocity=0,this.direction=0,this.animate=new Animate,this.emitter=new Emitter,this.onPointerDown=t=>{1===t.button&&this.reset()},this.onVirtualScroll=t=>{if("function"==typeof this.options.virtualScroll&&!1===this.options.virtualScroll(t))return;const{deltaX:i,deltaY:e,event:s}=t;if(this.emitter.emit("virtual-scroll",{deltaX:i,deltaY:e,event:s}),s.ctrlKey)return;const o=s.type.includes("touch"),n=s.type.includes("wheel");this.isTouching="touchstart"===s.type||"touchmove"===s.type;if(this.options.syncTouch&&o&&"touchstart"===s.type&&!this.isStopped&&!this.isLocked)return void this.reset();const l=0===i&&0===e,r="vertical"===this.options.gestureOrientation&&0===e||"horizontal"===this.options.gestureOrientation&&0===i;if(l||r)return;let h=s.composedPath();h=h.slice(0,h.indexOf(this.rootElement));const a=this.options.prevent;if(h.find((t=>{var i,e,s,l,r;return t instanceof HTMLElement&&("function"==typeof a&&(null==a?void 0:a(t))||(null===(i=t.hasAttribute)||void 0===i?void 0:i.call(t,"data-lenis-prevent"))||o&&(null===(e=t.hasAttribute)||void 0===e?void 0:e.call(t,"data-lenis-prevent-touch"))||n&&(null===(s=t.hasAttribute)||void 0===s?void 0:s.call(t,"data-lenis-prevent-wheel"))||(null===(l=t.classList)||void 0===l?void 0:l.contains("lenis"))&&!(null===(r=t.classList)||void 0===r?void 0:r.contains("lenis-stopped")))})))return;if(this.isStopped||this.isLocked)return void s.preventDefault();if(!(this.options.syncTouch&&o||this.options.smoothWheel&&n))return this.isScrolling="native",void this.animate.stop();s.preventDefault();let c=e;"both"===this.options.gestureOrientation?c=Math.abs(e)>Math.abs(i)?e:i:"horizontal"===this.options.gestureOrientation&&(c=i);const u=o&&this.options.syncTouch,d=o&&"touchend"===s.type&&Math.abs(c)>5;d&&(c=this.velocity*this.options.touchInertiaMultiplier),this.scrollTo(this.targetScroll+c,Object.assign({programmatic:!1},u?{lerp:d?this.options.syncTouchLerp:1}:{lerp:this.options.lerp,duration:this.options.duration,easing:this.options.easing}))},this.onNativeScroll=()=>{if(null!==this._resetVelocityTimeout&&(clearTimeout(this._resetVelocityTimeout),this._resetVelocityTimeout=null),this._preventNextNativeScrollEvent)this._preventNextNativeScrollEvent=!1;else if(!1===this.isScrolling||"native"===this.isScrolling){const t=this.animatedScroll;this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity,this.velocity=this.animatedScroll-t,this.direction=Math.sign(this.animatedScroll-t),this.isScrolling="native",this.emit(),0!==this.velocity&&(this._resetVelocityTimeout=setTimeout((()=>{this.lastVelocity=this.velocity,this.velocity=0,this.isScrolling=!1,this.emit()}),400))}},window.lenisVersion="1.1.13",t&&t!==document.documentElement&&t!==document.body||(t=window),this.options={wrapper:t,content:i,eventsTarget:e,smoothWheel:s,syncTouch:o,syncTouchLerp:n,touchInertiaMultiplier:l,duration:r,easing:h,lerp:a,infinite:c,gestureOrientation:d,orientation:u,touchMultiplier:p,wheelMultiplier:m,autoResize:v,prevent:g,virtualScroll:S,__experimental__naiveDimensions:w},this.dimensions=new Dimensions(t,i,{autoResize:v}),this.updateClassName(),this.targetScroll=this.animatedScroll=this.actualScroll,this.options.wrapper.addEventListener("scroll",this.onNativeScroll,!1),this.options.wrapper.addEventListener("pointerdown",this.onPointerDown,!1),this.virtualScroll=new VirtualScroll(e,{touchMultiplier:p,wheelMultiplier:m}),this.virtualScroll.on("scroll",this.onVirtualScroll)}destroy(){this.emitter.destroy(),this.options.wrapper.removeEventListener("scroll",this.onNativeScroll,!1),this.options.wrapper.removeEventListener("pointerdown",this.onPointerDown,!1),this.virtualScroll.destroy(),this.dimensions.destroy(),this.cleanUpClassName()}on(t,i){return this.emitter.on(t,i)}off(t,i){return this.emitter.off(t,i)}setScroll(t){this.isHorizontal?this.rootElement.scrollLeft=t:this.rootElement.scrollTop=t}resize(){this.dimensions.resize(),this.animatedScroll=this.targetScroll=this.actualScroll,this.emit()}emit(){this.emitter.emit("scroll",this)}reset(){this.isLocked=!1,this.isScrolling=!1,this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity=0,this.animate.stop()}start(){this.isStopped&&(this.isStopped=!1,this.reset())}stop(){this.isStopped||(this.isStopped=!0,this.animate.stop(),this.reset())}raf(t){const i=t-(this.time||t);this.time=t,this.animate.advance(.001*i)}scrollTo(t,{offset:i=0,immediate:e=!1,lock:s=!1,duration:o=this.options.duration,easing:n=this.options.easing,lerp:l=this.options.lerp,onStart:r,onComplete:h,force:a=!1,programmatic:c=!0,userData:u}={}){if(!this.isStopped&&!this.isLocked||a){if("string"==typeof t&&["top","left","start"].includes(t))t=0;else if("string"==typeof t&&["bottom","right","end"].includes(t))t=this.limit;else{let e;if("string"==typeof t?e=document.querySelector(t):t instanceof HTMLElement&&(null==t?void 0:t.nodeType)&&(e=t),e){if(this.options.wrapper!==window){const t=this.rootElement.getBoundingClientRect();i-=this.isHorizontal?t.left:t.top}const s=e.getBoundingClientRect();t=(this.isHorizontal?s.left:s.top)+this.animatedScroll}}if("number"==typeof t){if(t+=i,t=Math.round(t),this.options.infinite?c&&(this.targetScroll=this.animatedScroll=this.scroll):t=clamp(0,t,this.limit),t===this.targetScroll)return null==r||r(this),void(null==h||h(this));if(this.userData=null!=u?u:{},e)return this.animatedScroll=this.targetScroll=t,this.setScroll(this.scroll),this.reset(),this.preventNextNativeScrollEvent(),this.emit(),null==h||h(this),void(this.userData={});c||(this.targetScroll=t),this.animate.fromTo(this.animatedScroll,t,{duration:o,easing:n,lerp:l,onStart:()=>{s&&(this.isLocked=!0),this.isScrolling="smooth",null==r||r(this)},onUpdate:(t,i)=>{this.isScrolling="smooth",this.lastVelocity=this.velocity,this.velocity=t-this.animatedScroll,this.direction=Math.sign(this.velocity),this.animatedScroll=t,this.setScroll(this.scroll),c&&(this.targetScroll=t),i||this.emit(),i&&(this.reset(),this.emit(),null==h||h(this),this.userData={},this.preventNextNativeScrollEvent())}})}}}preventNextNativeScrollEvent(){this._preventNextNativeScrollEvent=!0,requestAnimationFrame((()=>{this._preventNextNativeScrollEvent=!1}))}get rootElement(){return this.options.wrapper===window?document.documentElement:this.options.wrapper}get limit(){return this.options.__experimental__naiveDimensions?this.isHorizontal?this.rootElement.scrollWidth-this.rootElement.clientWidth:this.rootElement.scrollHeight-this.rootElement.clientHeight:this.dimensions.limit[this.isHorizontal?"x":"y"]}get isHorizontal(){return"horizontal"===this.options.orientation}get actualScroll(){return this.isHorizontal?this.rootElement.scrollLeft:this.rootElement.scrollTop}get scroll(){return this.options.infinite?function modulo(t,i){return(t%i+i)%i}(this.animatedScroll,this.limit):this.animatedScroll}get progress(){return 0===this.limit?1:this.scroll/this.limit}get isScrolling(){return this._isScrolling}set isScrolling(t){this._isScrolling!==t&&(this._isScrolling=t,this.updateClassName())}get isStopped(){return this._isStopped}set isStopped(t){this._isStopped!==t&&(this._isStopped=t,this.updateClassName())}get isLocked(){return this._isLocked}set isLocked(t){this._isLocked!==t&&(this._isLocked=t,this.updateClassName())}get isSmooth(){return"smooth"===this.isScrolling}get className(){let t="lenis";return this.isStopped&&(t+=" lenis-stopped"),this.isLocked&&(t+=" lenis-locked"),this.isScrolling&&(t+=" lenis-scrolling"),"smooth"===this.isScrolling&&(t+=" lenis-smooth"),t}updateClassName(){this.cleanUpClassName(),this.rootElement.className=`${this.rootElement.className} ${this.className}`.trim()}cleanUpClassName(){this.rootElement.className=this.rootElement.className.replace(/lenis(-\w+)?/g,"").trim()}}}));
//# sourceMappingURL=lenis.min.js.map

/* =========================================================
   Capa de animaciones para Team K-1 (inspirada en el portafolio de Loseel Webs).
   No cambia contenido: solo agrega movimiento encima de lo que ya pinta sitio.js.
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const H = document.documentElement;
  const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINO = matchMedia("(hover:hover) and (pointer:fine)").matches;
  if (QUIETO) return;
  H.classList.add("fx-on");

  /* ---------- piezas que se agregan a la página ---------- */
  document.body.insertAdjacentHTML("beforeend", `
    <div class="fx-prog" aria-hidden="true"><i></i></div>
    <div class="fx-vt" aria-hidden="true"><img src="img/logo-tri.png" alt=""></div>
    <div class="fx-cur" aria-hidden="true"><svg class="c-flecha" viewBox="0 0 28 28"><path d="M4 3 L4 23 L9.5 18 L13 26 L16.5 24.5 L13 16.8 L20.5 16.5 Z"/></svg><svg class="c-mano" viewBox="0 0 28 28"><path d="M11 3.5c1.1 0 2 .9 2 2V12h.5V10c0-1.1.9-2 2-2s2 .9 2 2v2.2c.3-.8 1-1.2 1.8-1.2 1.1 0 2 .9 2 2v1c.3-.4.8-.6 1.3-.6 1 0 1.9.8 1.9 1.9V20c0 3.6-2.9 6.5-6.5 6.5h-2.5c-2 0-3.8-1-5-2.6L6 18.6c-.6-.9-.4-2.1.5-2.7.8-.5 1.8-.4 2.5.3V5.5c0-1.1.9-2 2-2z"/></svg><span>ver</span></div>`);
  const prog = $(".fx-prog i"), cur = $(".fx-cur"), vt = $(".fx-vt");

  /* ---------- scroll suave (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .11, smoothWheel: true, prevent: n => !!(n.closest && n.closest(".fmenu,[role=dialog],.mdl,.modal,.nw-b,.posts-l,.sgrid,textarea")) });
    /* se detiene cuando hay un menú o una ventana abierta */
    new MutationObserver(() => { const tapa = H.style.overflow === "hidden" || H.classList.contains("fm-open"); tapa ? lenis.stop() : lenis.start(); H.classList.toggle("fx-modal", tapa); })
      .observe(H, { attributes: true, attributeFilter: ["style", "class"] });
  }

  /* ---------- títulos: se parten en letras y entran con un efecto distinto ---------- */
  const TIPOS = ["sube", "giro", "borroso", "cortina", "lado", "descifra"];
  const SIG = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&";
  let nTit = 0;
  function partir(el) {
    if (el.dataset.fx || !el.textContent.trim() || el.children.length) return;
    const tipo = TIPOS[nTit++ % TIPOS.length], txt = el.textContent;
    el.dataset.fx = tipo; el.setAttribute("aria-label", txt);
    if (tipo === "descifra" || tipo === "lado") { tituloOb.observe(el); return; }
    let i = 0;
    el.innerHTML = txt.split(/(\s+)/).map(w => /^\s+$/.test(w) ? " " : `<span class="fx-pw" aria-hidden="true">${[...w].map(ch => `<span class="fx-ch" style="--i:${i++}">${ch.replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[m])}</span>`).join("")}</span>`).join("");
    tituloOb.observe(el);
  }
  function descifrar(el, final, ms) {
    const t0 = performance.now();
    const paso = now => { const k = cl((now - t0) / ms), n = Math.floor(k * final.length);
      el.textContent = final.slice(0, n) + [...final.slice(n)].map(c => c === " " ? " " : SIG[Math.random() * SIG.length | 0]).join("");
      if (k < 1) requestAnimationFrame(paso); else el.textContent = final; };
    requestAnimationFrame(paso);
  }
  const tituloOb = new IntersectionObserver(es => es.forEach(e => {
    const el = e.target;
    if (e.isIntersecting && !el.classList.contains("fx-ok")) { el.classList.add("fx-ok"); if (el.dataset.fx === "descifra") descifrar(el, el.getAttribute("aria-label"), 900); }
  }), { rootMargin: "0px 0px -10% 0px" });

  /* ---------- cifras que cuentan hacia arriba ---------- */
  const contarOb = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; contarOb.unobserve(e.target); contar(e.target); }), { rootMargin: "0px 0px -10% 0px" });
  function contar(el) {
    const txt = el.textContent, m = txt.match(/(\d[\d,]*)/); if (!m) return;
    const fin = +m[1].replace(/,/g, ""), a = txt.slice(0, m.index), b = txt.slice(m.index + m[1].length), t0 = performance.now(), ms = 1300;
    const fmt = v => v.toLocaleString("es-MX");
    const paso = now => { const k = cl((now - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = a + fmt(Math.round(fin * e)) + b; if (k < 1) requestAnimationFrame(paso); else el.textContent = txt; };
    requestAnimationFrame(paso);
  }

  /* ---------- teléfono: cada número sube en ola ---------- */
  function letrasTel(a) {
    if (a.dataset.fx) return; a.dataset.fx = "1"; const t = a.textContent; a.setAttribute("aria-label", t);
    a.innerHTML = [...t].map((c, i) => `<span class="fx-le" aria-hidden="true" style="--i:${i}">${c === " " ? "&nbsp;" : c}</span>`).join("");
  }

  /* ---------- tarjetas: luz que sigue al cursor e inclinación 3D ---------- */
  const LUZ = ".qc,.dcard,.poster,.val,.corner,.admit,.unibox figure,.nw,.ov.contact,.band,.wfnbar";
  const TILT = ".qc,.admit,.poster,.corner,.unibox figure";
  function preparar(raiz) {
    $$(".h2", raiz).forEach(partir);
    $$(".admit .big,.stats b,.ffz-n,.lstat b", raiz).forEach(el => { if (!el.dataset.cnt) { el.dataset.cnt = "1"; contarOb.observe(el); } });
    $$(".tel a", raiz).forEach(letrasTel);
    $$(LUZ, raiz).forEach(el => { if (el.querySelector(":scope>.fx-l")) return; el.classList.add("fx-luz"); const l = document.createElement("span"); l.className = "fx-l"; l.setAttribute("aria-hidden", "true"); el.append(l); });
    if (FINO) $$(TILT, raiz).forEach(el => {
      if (el.dataset.tilt) return; el.dataset.tilt = "1"; el.classList.add("fx-tilt");
      el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); el.classList.add("fx-mueve");
        el.style.setProperty("--ry", (((e.clientX - r.left) / r.width - .5) * 8).toFixed(2) + "deg"); el.style.setProperty("--rx", ((.5 - (e.clientY - r.top) / r.height) * 7).toFixed(2) + "deg"); });
      el.addEventListener("pointerleave", () => { el.classList.remove("fx-mueve"); el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); });
    });
    if (FINO) $$(".btn:not(.w-pill),.hd-cta", raiz).forEach(m => {
      if (m.dataset.mag) return; m.dataset.mag = "1"; m.classList.add("fx-mag");
      m.addEventListener("pointermove", e => { const r = m.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        m.style.transform = `translate(${x * .22}px,${y * .32}px)`; });
      m.addEventListener("pointerleave", () => { m.style.transition = "transform .6s cubic-bezier(.2,1.6,.4,1)"; m.style.transform = ""; setTimeout(() => m.style.transition = "", 600); });
    });
    $$(".feat>.ph,.feat>picture,.nos-hero .ph,.ov.semi>.ph", raiz).forEach(el => el.classList.add("fx-reel"));
  }
  document.addEventListener("pointermove", e => { const l = e.target.closest && e.target.closest(".fx-luz"); if (!l) return; const r = l.getBoundingClientRect(); l.style.setProperty("--mx", (e.clientX - r.left) + "px"); l.style.setProperty("--my", (e.clientY - r.top) + "px"); }, { passive: true });
  document.addEventListener("pointerdown", e => { if (e.pointerType === "mouse") return; const l = e.target.closest && e.target.closest(".fx-luz,.btn"); if (!l) return;
    const r = l.getBoundingClientRect(); l.style.setProperty("--mx", (e.clientX - r.left) + "px"); l.style.setProperty("--my", (e.clientY - r.top) + "px");
    l.classList.add("fx-toque"); clearTimeout(l._fx); l._fx = setTimeout(() => l.classList.remove("fx-toque"), 900); }, { passive: true });

  /* sitio.js vuelve a pintar el contenido cuando llegan los datos: se preparan las piezas nuevas */
  let pend = 0;
  new MutationObserver(() => { if (pend) return; pend = requestAnimationFrame(() => { pend = 0; preparar(document); }); }).observe(document.body, { childList: true, subtree: true });
  preparar(document);

  /* ---------- transición entre secciones (cortina roja con el logo) ---------- */
  const K = ["inicio", "clases", "horarios", "equipo", "nosotros", "contacto", "wfn"];
  const actual = () => K.find(k => { const s = document.getElementById(k); return s && !s.hidden; });
  let pasando = false, propia = false;
  document.addEventListener("click", e => {
    if (pasando) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented) return;
    const k = a.getAttribute("href").slice(1); if (!K.includes(k) || k === actual()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    vt.classList.remove("destapa"); void vt.offsetWidth; vt.classList.add("cubre");
    setTimeout(() => { pasando = true; propia = true; a.click(); pasando = false; destapar(); }, 380);
  }, true);
  function destapar() {
    vt.classList.remove("cubre"); void vt.offsetWidth; vt.classList.add("destapa");
    if (lenis) lenis.scrollTo(scrollY, { immediate: true });
    const nav = $(".nav"); if (nav) { nav.classList.remove("fx-glitch"); void nav.offsetWidth; nav.classList.add("fx-glitch"); }
    const v = document.getElementById(actual()); if (v) { v.classList.remove("fx-entra"); void v.offsetWidth; v.classList.add("fx-entra"); }
    /* los títulos de la sección nueva vuelven a animarse */
    if (v) $$("[data-fx]", v).forEach(t => { t.classList.remove("fx-ok"); tituloOb.unobserve(t); requestAnimationFrame(() => tituloOb.observe(t)); });
    setTimeout(() => vt.classList.remove("destapa"), 600);
  }
  /* si cambian de sección con el botón de atrás, solo se destapa */
  K.forEach(k => { const s = document.getElementById(k); s && new MutationObserver(() => { if (!s.hidden && !propia) destapar(); propia = false; }).observe(s, { attributes: true, attributeFilter: ["hidden"] }); });

  /* ---------- cursor propio ---------- */
  let cx = -100, cy = -100, cAnt = -100, cAng = 0;
  if (FINO) {
    addEventListener("pointermove", e => { cx = e.clientX; cy = e.clientY; cur.classList.add("on");
      const t = e.target, txt = t.closest("input,textarea,select"), ver = t.closest(".dcard,.poster,.qc,.unibox figure"), mano = t.closest("a,button,summary,label,[role=tab]");
      cur.classList.toggle("ver", !!ver && !txt); cur.classList.toggle("mano", !!mano && !txt); cur.style.opacity = txt ? "0" : ""; }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.remove("on"));
    addEventListener("pointerdown", () => cur.classList.add("click"));
    addEventListener("pointerup", () => cur.classList.remove("click"));
  }

  /* ---------- cabecera: en el inicio, logos al centro y sin botón hasta que hagas scroll ---------- */
  const hdIn = $(".hd-in"), duo = $(".hd-duo");
  function medirCentro() { if (!hdIn || !duo) return; duo.style.setProperty("--dx", (hdIn.clientWidth / 2 - (duo.offsetLeft + duo.offsetWidth / 2)).toFixed(1) + "px"); }
  let centro = null;
  function cabecera() { const ini = document.getElementById("inicio"), c = !!ini && !ini.hidden && scrollY < 40 && !H.classList.contains("fm-open");
    if (c !== centro) { centro = c; if (c) medirCentro(); H.classList.toggle("hd-centro", c); } }
  /* ¿qué hay detrás de la cabecera? si es claro, el menú cambia a negro */
  const hd = $(".hd"); let tFondo = 0;
  function fondoClaro(now) {
    if (now - tFondo < 160 || !hd) return; tFondo = now;
    const nav = $(".hd .nav"); if (!nav || !nav.offsetParent) { H.classList.remove("hd-claro"); return; }
    const r = nav.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    let claro = false;
    for (const el of document.elementsFromPoint(x, y)) {
      if (hd.contains(el) || el.closest(".fx-prog,.fx-cur,.fx-vt")) continue;
      if (el.id === "wfn") { const r2 = el.getBoundingClientRect(); if (y < r2.top + parseFloat(getComputedStyle(el).paddingTop)) { claro = false; break; } }
      const bg = getComputedStyle(el).backgroundColor, m = bg.match(/[\d.]+/g);
      if (!m || (m.length > 3 && +m[3] < .5)) continue;
      claro = (.299 * m[0] + .587 * m[1] + .114 * m[2]) / 255 > .6; break;
    }
    H.classList.toggle("hd-claro", claro);
  }
  addEventListener("resize", () => { medirCentro(); }); medirCentro(); cabecera();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(medirCentro);

  /* ---------- un solo bucle para todo lo que depende del scroll ---------- */
  const rib = $(".ribbon"); let ultY = scrollY, vel = 0;
  function bucle(now) {
    if (lenis) lenis.raf(now);
    const y = scrollY, dy = y - ultY, vh = innerHeight; ultY = y;
    cabecera(); fondoClaro(now);
    prog.style.transform = `scaleX(${cl(y / Math.max(1, document.documentElement.scrollHeight - vh))})`;
    vel += (cl(dy, -40, 40) - vel) * .15;
    if (rib && rib.offsetParent) rib.style.transform = `skewY(${cl(-vel * .06, -2.5, 2.5).toFixed(2)}deg)`;
    $$(".view:not([hidden]) .fx-reel").forEach(el => { const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      const k = Math.round(cl((vh - r.top) / (vh * .85)) * 200) / 200; if (el._k === k) return; el._k = k; const e = 1 - Math.pow(1 - k, 3);
      el.style.setProperty("--ci", (10 * (1 - e)).toFixed(2) + "%"); el.style.setProperty("--cl", (16 * (1 - e)).toFixed(2) + "%");
      el.style.setProperty("--cr", (26 * (1 - e)).toFixed(1) + "px"); el.style.setProperty("--vs", (1.22 - .22 * e).toFixed(3)); });
    $$(".view:not([hidden]) .tel .fx-le").forEach((le, i, a) => { if (i === 0) { const r = le.parentElement.getBoundingClientRect(); a._p = cl((vh - r.top) / (vh * .6)); }
      const p = a._p, q = cl(p * 1.8 - i / a.length); le.style.transform = `translateY(${((1 - q) * 60).toFixed(1)}%) rotate(${((1 - q) * 10).toFixed(1)}deg)`; le.style.opacity = (.15 + q * .85).toFixed(2); });
    if (FINO) { const v = cx - cAnt; cAnt = cx; cAng += (cl(v * 1.4, -28, 28) - cAng) * .18; cur.style.transform = `translate(${(cx - 4).toFixed(1)}px,${(cy - 3).toFixed(1)}px) rotate(${cAng.toFixed(1)}deg)`; }
    requestAnimationFrame(bucle);
  }
  requestAnimationFrame(bucle);

})();
