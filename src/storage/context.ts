import { createContext } from 'react'
import type { Storage } from './port.ts'

export const StorageContext = createContext<Storage | null>(null)
