// The opening melt, based on MorphSlider's "melt" shader.
//
//   morphIn()  → opening or reloading the site: a layer of the page's own
//                background colour melts away and turns see-through, showing
//                the real page underneath. No pictures are taken.
//
// The melt is drawn on a full-screen canvas on top of the page, and the
// canvas is removed when it's done.

import { Renderer, Triangle, Program, Mesh, Texture } from 'ogl';
import gsap from 'gsap';
import { vertexShader, fragmentShader } from './shaders';

// Based on the MorphSlider settings from arya.dev, tuned for ShipIt's calm,
// monochrome look: no colour split (the "glitch"), a gentler warp, and a
// slower, smoother ease.
const SETTINGS = {
  mode: 0,            // 0 = melt
  intensity: 0.32,    // how far the page warps (arya.dev: 0.5)
  aberration: 0,      // red/blue split, off (arya.dev: 0.35)
  drift: 0.2,         // slow wobble while melting (arya.dev: 0.4)
  scale: 1.8,         // bigger, softer melt shapes (arya.dev: 2.4)
  duration: 1.4,      // (arya.dev: 1.1)
  ease: 'power3.inOut',
  overlayColor: '#05060a', // only if the page has no background colour
};

// '#05060a' → [0.02, 0.024, 0.039]. Also accepts 'rgb(244, 244, 245)'.
export function hexToRgb(hex) {
  const rgb = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function reducedMotion() {
  return Boolean(window.matchMedia) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function currentPage() {
  const root = document.getElementById('root');
  return root ? root.firstElementChild : null;
}

// The background colour of the page on screen, e.g. 'rgb(244, 244, 245)'.
function pageColor() {
  const page = currentPage();
  const color = page ? window.getComputedStyle(page).backgroundColor : '';
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return SETTINGS.overlayColor;
  return color;
}

// A canvas filled with one colour.
function solidCanvas(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 4, 4);
  return canvas;
}

// The full-screen canvas that plays the melt. Same uniforms as MorphSlider,
// plus uReveal: melt into the live page underneath (see-through).
// tCurrent is a plain colour, so there is nothing to warp: only the melt edge shows.
function createStage(color) {
  const renderer = new Renderer({
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas;
  canvas.className = 'morph-stage';
  canvas.setAttribute('aria-hidden', 'true');

  const blank = new Texture(gl, { image: solidCanvas(color), generateMipmaps: false });
  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    transparent: true,
    uniforms: {
      tCurrent: { value: blank },
      tNext: { value: blank },
      uResolution: { value: [1, 1] },
      uCurrentSize: { value: [1, 1] },
      uNextSize: { value: [1, 1] },
      uProgress: { value: 0 },
      uDir: { value: 1 },
      uMode: { value: SETTINGS.mode },
      uIntensity: { value: SETTINGS.intensity },
      uScale: { value: SETTINGS.scale },
      uAberration: { value: SETTINGS.aberration },
      uDrift: { value: SETTINGS.drift },
      uTime: { value: 0 },
      uReduce: { value: 0 },
      uPointer: { value: [0.5, 0.5] },
      uOverlay: { value: hexToRgb(color) },
      uReveal: { value: 1 },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program: program });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
  }
  resize();
  window.addEventListener('resize', resize);

  function render(t) {
    program.uniforms.uTime.value = t * 0.001;
    renderer.render({ scene: mesh });
  }
  let raf = 0;
  function loop(t) {
    render(t);
    raf = requestAnimationFrame(loop);
  }

  // Draws the first frame right away, then puts the canvas on screen, so
  // there's never a frame where the page shows before the colour.
  function show() {
    render(performance.now());
    document.body.appendChild(canvas);
    raf = requestAnimationFrame(loop);
  }

  function play() {
    return new Promise(function (resolve) {
      gsap.fromTo(program.uniforms.uProgress, { value: 0 }, {
        value: 1,
        duration: SETTINGS.duration,
        ease: SETTINGS.ease,
        onComplete: resolve,
      });
    });
  }

  function remove() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    canvas.remove();
  }

  return { show: show, play: play, remove: remove };
}

let busy = false;

// Opening or reloading the site: the page's background colour melts away.
// Call it before the first paint (useLayoutEffect) so the page never flashes.
export async function morphIn() {
  if (busy || reducedMotion()) return;
  busy = true;
  let stage = null;
  try {
    stage = createStage(pageColor()); // a solid colour, over the real page
    stage.show();
    await stage.play();
  } catch (err) {
    console.warn('[morph] entry skipped:', err);
  } finally {
    if (stage) stage.remove();
    busy = false;
  }
}
