import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { WorldCupProvider } from './context/WorldCupContext';
import './styles/legacy.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WorldCupProvider>
      <App />
    </WorldCupProvider>
  </StrictMode>
);
