import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useI18n } from '../i18n/useI18n.ts'
import { languageNames, languages, type Language } from '../i18n/dictionaries.ts'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={language}
      aria-label={t.language.label}
      onChange={(_, next: Language | null) => next && setLanguage(next)}
    >
      {(Object.keys(languages) as Language[]).map((code) => (
        <ToggleButton key={code} value={code} lang={code}>{languageNames[code]}</ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
