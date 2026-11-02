import { useContext } from 'react'
import { StorageContext } from './context.ts'

export function useStorage() {
  const storage = useContext(StorageContext)
  if (!storage) throw new Error('useStorage outside StorageProvider')
  return storage
}
