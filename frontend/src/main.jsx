import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

// Find <div id="root"> in index.html and draw the whole React app inside it.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter lets the app show different pages for different addresses (/try, /blocks, /dev). */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
