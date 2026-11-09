import { useLayoutEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { morphIn } from './lib/morph/morphTransition';
import Dev from './pages/Dev';
import Blocks from './pages/Blocks';
import ThemeStudio from './pages/ThemeStudio';
import Editor from './pages/Editor';
import Landing from './pages/Landing';

export default function App() {
  // Opening or reloading the site: the page's background colour melts away
  // to show the page (lib/morph/morphTransition.js).
  // useLayoutEffect runs before the first paint, so the page never flashes first.
  useLayoutEffect(function () {
    morphIn();
  }, []);

  return (
    <Routes>
      {/* Each Route: when the address matches path, show that page. */}
      <Route path="/" element={<Landing />} />
      <Route path="/try" element={<Editor />} />
      <Route path="/dev" element={<Dev />} />
      <Route path="/blocks" element={<Blocks />} />
      <Route path="/blocks/studio" element={<ThemeStudio />} />
    </Routes>
  );
}
