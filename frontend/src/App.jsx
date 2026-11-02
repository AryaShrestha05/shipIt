import { Route, Routes } from 'react-router-dom';
import Dev from './pages/Dev';
import Blocks from './pages/Blocks';
import ThemeStudio from './pages/ThemeStudio';
import Editor from './pages/Editor';
import Landing from './pages/Landing';

export default function App() {
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
