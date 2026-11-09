import { useState } from 'react';

// Light or dark mode for the landing page.
//
// The visitor's own choice (saved in localStorage) wins. Without one, the
// page starts in light mode, whatever the computer is set to.

const STORAGE_KEY = 'shipit.mode';

// options: { saved: 'light' | 'dark' | anything }
export function pickMode(options) {
  if (options.saved === 'light' || options.saved === 'dark') return options.saved;
  return 'light';
}

export function nextMode(mode) {
  return mode === 'dark' ? 'light' : 'dark';
}

// Reads the saved choice. Storage can be blocked (private windows), so the
// read is wrapped.
export function loadMode() {
  let saved = null;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    saved = null;
  }
  return pickMode({ saved: saved });
}

export function saveMode(mode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage blocked: the choice lasts until the page is closed.
  }
}

// For pages: const colorMode = useColorMode();  colorMode.mode is 'light' or
// 'dark', colorMode.toggle() flips it and remembers the choice on every page.
export function useColorMode() {
  const [mode, setMode] = useState(loadMode);
  function toggle() {
    const next = nextMode(mode);
    setMode(next);
    saveMode(next);
  }
  return { mode: mode, toggle: toggle };
}
