import { Routes, Route } from 'react-router-dom';
import Landing from './routes/Landing';
import Agent from './routes/Agent';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/agent" element={<Agent />} />
    </Routes>
  );
}
