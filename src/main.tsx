import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { WorkDataProvider } from './contexts/WorkDataContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkDataProvider>
      <App />
    </WorkDataProvider>
  </StrictMode>
);
