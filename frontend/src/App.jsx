import { Navigate, Route, Routes } from 'react-router-dom';
import Dev from './routes/Dev';
import Blocks from './routes/Blocks';
import ThemeStudio from './routes/ThemeStudio';

// "/" goes to the dev page until the real landing page (Feature 13) exists.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dev" replace />} />
      <Route path="/dev" element={<Dev />} />
      <Route path="/blocks" element={<Blocks />} />
      <Route path="/blocks/studio" element={<ThemeStudio />} />
    </Routes>
  );
}
