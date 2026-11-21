import { useState } from 'react'
import { Link } from 'react-router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import { useStorage } from '../storage/useStorage.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { Icon } from '../components/Icon.tsx'
import { icon } from '../components/icons.tsx'
import { LanguageSwitcher } from '../components/LanguageSwitcher.tsx'
import { importCourses } from '../domain/importCourses.ts'
import { createBackup } from '../domain/backup.ts'

const pad = (n: number) => String(n).padStart(2, '0')
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card component="section" aria-label={title}
      sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="h5" component="h2">{title}</Typography>
      {children}
    </Card>
  )
}

export default function Settings() {
  const storage = useStorage()
  const { t } = useI18n()
  const [message, setMessage] = useState<string | null>(null)

  async function initialize() {
    try {
      const { default: bundled } = await import('../data/southern-finland-courses.json')
      const r = await importCourses(storage, bundled)
      setMessage(t.courses.imported(r.courses, r.layouts, r.lengthsUpdated, r.skipped))
    } catch {
      setMessage(t.courses.importFailed)
    }
  }

  async function downloadBackup() {
    const now = new Date()
    const backup = await createBackup(storage, now)
    download(`discgolf-backup-${localDate(now)}.json`, new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconButton component={Link} to="/" aria-label={t.settings.backToHome}>
          <Icon>{icon.back}</Icon>
        </IconButton>
        <Typography variant="h1" sx={{ fontSize: 34 }}>{t.settings.title}</Typography>
      </Box>

      <Section title={t.language.label}>
        <LanguageSwitcher />
      </Section>

      <Section title={t.settings.backup}>
        <Button size="small" variant="outlined" onClick={downloadBackup} sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          {t.settings.downloadBackup}
        </Button>
      </Section>

      <Section title={t.settings.courses}>
        <Button size="small" variant="outlined" onClick={initialize} sx={{ whiteSpace: 'nowrap', px: 1.5 }}>
          {t.courses.initialize}
        </Button>
      </Section>

      <Snackbar open={message !== null} autoHideDuration={6000} onClose={() => setMessage(null)} message={message} />
    </Box>
  )
}
