import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import WelcomeModal from './components/WelcomeModal.jsx'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <WelcomeModal />
  </React.StrictMode>
)
