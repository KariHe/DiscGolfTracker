import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { createStorageFromEnv } from './storage/index.js'
import { StorageProvider } from './storage/StorageProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StorageProvider storage={createStorageFromEnv()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StorageProvider>
  </StrictMode>,
)
