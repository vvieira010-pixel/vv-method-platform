import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';
import { injectGlobalCSS } from './components/shared.jsx';
import { getAuth0Config } from './lib/auth0-config.js';
import './styles/logbook.css';

injectGlobalCSS();

const auth0 = getAuth0Config();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={auth0.domain || 'not-configured.auth0.com'}
      clientId={auth0.clientId || 'not-configured'}
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);
