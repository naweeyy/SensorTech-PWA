import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) =>
        `ServiceWorker registration successful with scope: ${registration.scope}`
      )
      .catch((err) => `ServiceWorker registration failed: ${err}`)
      .then((message) => {
        console.log(message);
      });
  });
}
