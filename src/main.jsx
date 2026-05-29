import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { injectGlobalCSS } from './components/shared.jsx';
import './styles/logbook.css';

injectGlobalCSS();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
