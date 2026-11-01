// Decorative markup authored for these themes. No user HTML or scripts.
export function sceneMarkup(theme) {
  const scenes = {
    blueprint: '<span class="scene-blueprint-drawing"><i></i><i></i><i></i><i></i><b></b></span><span class="scene-blueprint-axis scene-axis-x">X / 024</span><span class="scene-blueprint-axis scene-axis-y">Y / 018</span><span class="scene-blueprint-scan"></span>',
    ripple: '<span class="scene-ripple-sun"></span><span class="scene-ripple-horizon"></span><span class="scene-ripple-waves"><svg viewBox="0 0 1200 220" preserveAspectRatio="none"><path d="M0 80 Q150 0 300 80 T600 80 T900 80 T1200 80 V220 H0Z" fill="#82b6a8"/><path d="M0 135 Q150 55 300 135 T600 135 T900 135 T1200 135 V220 H0Z" fill="#4a8e83"/><path d="M0 185 Q150 105 300 185 T600 185 T900 185 T1200 185 V220 H0Z" fill="#245f5b"/></svg></span>',
    orbit: '<span class="scene-orbit-stars"></span><span class="scene-orbit-halo"></span><span class="scene-orbit-system"><span class="scene-orbit-ring scene-ring-one"></span><span class="scene-orbit-ring scene-ring-two"></span><span class="scene-orbit-ring scene-ring-three"></span><span class="scene-orbit-sphere"></span><span class="scene-orbit-moon"></span></span>',
    forma: '<span class="scene-forma-grid"></span><span class="scene-forma-shadow"></span><span class="scene-forma-plinth"></span><span class="scene-forma-object"><i class="scene-face-front"></i><i class="scene-face-back"></i><i class="scene-face-right"></i><i class="scene-face-left"></i><i class="scene-face-top"></i><i class="scene-face-bottom"></i></span><span class="scene-forma-label">OBJECT / 001</span>',
  };
  return scenes[theme] ? `<span class="scene-illustration scene-${theme}" aria-hidden="true">${scenes[theme]}</span>` : '';
}
