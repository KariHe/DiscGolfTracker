import { createContext } from 'react'
import type { Dictionary, Language } from './dictionaries.ts'

export interface I18n {
  language: Language
  setLanguage: (language: Language) => void
  t: Dictionary
}

export const I18nContext = createContext<I18n | null>(null)
