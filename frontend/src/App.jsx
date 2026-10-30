import { Routes, Route } from 'react-router-dom';
import Landing from './routes/Landing';
import Agent from './routes/Agent';
import Dev from './routes/Dev';
import Blocks from './routes/Blocks';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/agent" element={<Agent />} />
      <Route path="/dev" element={<Dev />} />
      <Route path="/blocks" element={<Blocks />} />
    </Routes>
  );
}
