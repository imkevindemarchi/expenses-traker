import { BrowserRouter } from 'react-router';
import { createRoot } from 'react-dom/client';
import './i18n';
import App from './App';
import './index.css';
createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>);
