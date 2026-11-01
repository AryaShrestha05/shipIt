import { normalizeStudioTheme } from './themeModel.js';

function rgba(hex, opacity) {
  return `rgba(${[1,3,5].map(offset => parseInt(hex.slice(offset, offset + 2),16)).join(',')},${opacity})`;
}
function svgUrl(content) {
  return `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">' + content + '</svg>')}")`;
}
function wallpaper(id) {
  const artwork = {
    dunes: '<rect width="1200" height="800" fill="#f0d6bf"/><circle cx="850" cy="210" r="105" fill="#e59a72"/><path d="M0 430Q280 200 650 450T1200 390V800H0" fill="#d4a587"/><path d="M0 600Q350 350 750 570T1200 540V800H0" fill="#b97a64"/><path d="M0 740Q450 480 1200 700V800H0" fill="#8e5953"/>',
    mountains: '<rect width="1200" height="800" fill="#dce8e1"/><circle cx="900" cy="180" r="85" fill="#f1d6a0"/><path d="M0 600 250 240 500 550 780 140 1200 600V800H0" fill="#9bb9ae"/><path d="m250 240-65 95 65-28 65 31zm530-100-86 123 86-30 92 28z" fill="#e9efdf"/><path d="M0 700 400 400 650 650 920 390 1200 650V800H0" fill="#567c78"/><path d="M0 790Q400 630 1200 750V800H0" fill="#2f5356"/>',
    botanical: '<rect width="1200" height="800" fill="#e9e2d2"/><circle cx="950" cy="180" r="180" fill="#d7b8a2"/><path d="M180 800Q500 400 360 70Q-20 340 180 800" fill="#68795d"/><path d="M600 800Q350 420 800 260Q960 630 600 800" fill="#a9b39a"/><path d="M1040 800Q730 470 1120 300Q1260 630 1040 800" fill="#415f54"/><path d="M180 800 350 170M600 800 760 330M1040 800 1110 370" stroke="#e9e2d2" fill="none" stroke-width="5"/>',
    cosmic: '<defs><radialGradient id="a"><stop stop-color="#6750a7"/><stop offset="1" stop-color="#11152f"/></radialGradient></defs><rect width="1200" height="800" fill="url(#a)"/><circle cx="890" cy="270" r="135" fill="#a18bca"/><ellipse cx="890" cy="270" rx="235" ry="60" fill="none" stroke="#d8b5d3" stroke-width="15" transform="rotate(-28 890 270)"/>' + Array.from({length:65}, (_,i) => `<circle cx="${(i*173+41)%1200}" cy="${(i*97+23)%800}" r="${i%3+1}" fill="#f1ecff" opacity="${i%2 ? '.4' : '.8'}"/>`).join(''),
  };
  return svgUrl(artwork[id]);
}

// CSS values come only from normalized numbers, color values and allowlists.
// This is shared by the background picker thumbnails and website renderer.
export function backgroundStyle(input) {
  const t = normalizeStudioTheme(input);
  const base = t.backgroundUseTheme ? t[t.mode].bg : t.backgroundColor;
  const tint = rgba(t.patternColor, t.patternOpacity / 100);
  const s = t.patternScale;
  const result = { backgroundColor: base, backgroundImage: 'none', backgroundSize: 'auto', backgroundPosition: t.imagePosition, backgroundRepeat: 'no-repeat', backgroundAttachment: t.backgroundAttachment };
  if (t.background === 'gradient') {
    const stops = t.gradientThree ? `${t.gradientFrom},${t.gradientMiddle} ${t.gradientStop}%,${t.gradientTo}` : `${t.gradientFrom},${t.gradientTo}`;
    result.backgroundImage = t.gradientType === 'radial' ? `radial-gradient(ellipse at ${t.imagePosition},${stops})` : t.gradientType === 'conic' ? `conic-gradient(from ${t.gradientAngle}deg at ${t.imagePosition},${stops},${t.gradientFrom})` : `linear-gradient(${t.gradientAngle}deg,${stops})`;
  }
  if (t.background === 'pattern') {
    const pattern = {
      dots: `radial-gradient(circle,${tint} ${Math.max(1, s / 15)}px,transparent ${Math.max(2, s / 15 + 1)}px)`,
      grid: `linear-gradient(${tint} 1px,transparent 1px),linear-gradient(90deg,${tint} 1px,transparent 1px)`,
      diagonal: `repeating-linear-gradient(${t.patternAngle}deg,${tint} 0 2px,transparent 2px ${s}px)`,
      checker: `repeating-conic-gradient(${tint} 0% 25%,transparent 0% 50%)`,
      zigzag: `linear-gradient(135deg,${tint} 25%,transparent 25%),linear-gradient(225deg,${tint} 25%,transparent 25%),linear-gradient(45deg,${tint} 25%,transparent 25%),linear-gradient(315deg,${tint} 25%,transparent 25%)`,
      rings: `repeating-radial-gradient(circle at center,transparent 0 ${s / 3}px,${tint} ${s / 3}px ${s / 3 + 2}px,transparent ${s / 3 + 2}px ${s / 2}px)`,
    };
    result.backgroundImage = pattern[t.pattern];
    result.backgroundSize = `${s}px ${s}px`; result.backgroundRepeat = 'repeat';
    if (t.pattern === 'diagonal') result.backgroundSize = 'auto';
    if (t.pattern === 'rings') result.backgroundSize = `${s * 3}px ${s * 3}px`;
    if (t.pattern === 'zigzag') result.backgroundPosition = `-${s / 2}px 0,-${s / 2}px 0,0 0,0 0`;
  }
  if (t.background === 'texture') {
    const color = rgba(t.patternColor,t.textureOpacity / 100);
    if (t.texture === 'linen') {
      const gap = Math.max(2,t.textureScale / 8);
      result.backgroundImage = `repeating-linear-gradient(0deg,${color} 0 1px,transparent 1px ${gap}px),repeating-linear-gradient(90deg,${color} 0 1px,transparent 1px ${gap * 1.2}px)`;
    } else if (t.texture === 'grain') {
      const [r,g,b] = [1,3,5].map(offset => parseInt(t.patternColor.slice(offset,offset+2),16)/255);
      result.backgroundImage = svgUrl(`<defs><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="8"/><feColorMatrix type="matrix" values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} .33 .33 .33 0 0"/></filter></defs><rect width="1200" height="800" filter="url(#noise)" opacity="${t.textureOpacity / 100}"/>`);
    } else if (t.texture === 'speckle') {
      result.backgroundImage = svgUrl(Array.from({length:140},(_,i)=>`<circle cx="${(i*173)%1200}" cy="${(i*97)%800}" r="${2+i%5}" fill="${t.patternColor}" opacity="${t.textureOpacity/100}"/>`).join(''));
    } else {
      result.backgroundImage = svgUrl(Array.from({length:75},(_,i)=>`<path d="m${(i*173)%1200} ${(i*97)%800}q8-9 20 3" stroke="${t.patternColor}" stroke-width="2" opacity="${t.textureOpacity/100}" fill="none"/>`).join(''));
    }
    result.backgroundSize = `${t.textureScale*12}px ${t.textureScale*8}px`; result.backgroundRepeat = 'repeat';
  }
  if (t.background === 'wallpaper' || (t.background === 'image' && t.image)) {
    const overlay = rgba(t.overlayUseTheme ? t[t.mode].bg : t.overlayColor,t.overlay/100);
    result.backgroundImage = `linear-gradient(${overlay},${overlay}),${t.background === 'wallpaper' ? wallpaper(t.wallpaper) : `url("${t.image}")`}`;
    result.backgroundSize = t.imageFit === 'tile' ? `auto,${t.imageTileSize}px auto` : t.imageFit;
    result.backgroundRepeat = t.imageFit === 'tile' ? 'no-repeat,repeat' : 'no-repeat';
  }
  return result;
}

export function backgroundCss(input) {
  const normalized = normalizeStudioTheme(input);
  const target = normalized.backgroundScope === 'page' ? 'body' : '.hero';
  const declarations = Object.entries(backgroundStyle(normalized)).map(([key,value]) => key.replace(/[A-Z]/g,letter => '-' + letter.toLowerCase()) + ':' + value).join(';');
  return `${target}{${declarations}}`;
}
