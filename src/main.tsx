import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { createStorageFromEnv } from './storage/index.ts'
import { StorageProvider } from './storage/StorageProvider.tsx'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <StorageProvider storage={createStorageFromEnv()}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StorageProvider>
    </StrictMode>,
  )
}
