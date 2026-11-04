import type { ReactNode } from 'react'
import type { Storage } from './port.ts'
import { StorageContext } from './context.ts'

export function StorageProvider({
  storage,
  children,
}: {
  storage: Storage
  children: ReactNode
}) {
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>
}
