import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { languages, type Language } from './dictionaries.ts'
import { I18nContext, type I18n } from './context.ts'

const STORAGE_KEY = 'language'

const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && Object.hasOwn(languages, value)

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLanguage(stored)) return stored
  } catch {
    // storage unavailable: fall through to detection
  }
  const detected = navigator.language.slice(0, 2).toLowerCase()
  return isLanguage(detected) ? detected : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<I18n>(() => ({
    language,
    t: languages[language],
    setLanguage: (next) => {
      setLanguageState(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // preference just won't persist
      }
    },
  }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
