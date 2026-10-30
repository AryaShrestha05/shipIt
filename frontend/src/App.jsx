import { Navigate, Route, Routes } from 'react-router-dom';
import Dev from './routes/Dev';
import Blocks from './routes/Blocks';
import Editor from './routes/Editor';

// "/" goes to the editor until the real landing page (Feature 13) exists.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/try" replace />} />
      <Route path="/try" element={<Editor />} />
      <Route path="/dev" element={<Dev />} />
      <Route path="/blocks" element={<Blocks />} />
    </Routes>
  );
}
