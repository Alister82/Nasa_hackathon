import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { APP_NAME } from '@/contracts/constants';
import '@/ui/styles/app.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <main>
      <h1>{APP_NAME}</h1>
    </main>
  </StrictMode>,
);
