import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { WorkDataProvider } from './contexts/WorkDataContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WorkDataProvider>
        <App />
      </WorkDataProvider>
    </BrowserRouter>
  </StrictMode>
);
