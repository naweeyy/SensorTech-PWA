import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

export const sentNotification = (message: string) => {
  Notification.requestPermission().then((result) => {
    if (result === "granted") {
      new Notification(message);
    }
  });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
