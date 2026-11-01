import { StorageContext } from './context.js'

export function StorageProvider({ storage, children }) {
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>
}
