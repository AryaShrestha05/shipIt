import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Fonts ship with the app (not from Google Fonts), so the page-transition
// pictures can use it too. Otherwise the text would jump when the melt starts.
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/yeseva-one/400.css';
import './styles/tokens.css';
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
