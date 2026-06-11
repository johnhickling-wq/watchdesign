import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './components/App';
import { injectFonts } from './model/fonts';
import './index.css';

injectFonts();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
