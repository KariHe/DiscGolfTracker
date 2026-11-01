import { useContext } from 'react'
import { StorageContext } from './context.js'

export function useStorage() {
  const storage = useContext(StorageContext)
  if (!storage) throw new Error('useStorage outside StorageProvider')
  return storage
}
