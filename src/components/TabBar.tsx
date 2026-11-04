import { Link, useLocation } from 'react-router'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import { alpha } from '@mui/material/styles'
import { Icon } from './Icon.tsx'
import { icon } from './icons.tsx'
import { useI18n } from '../i18n/useI18n.ts'

const tabs = [
  { to: '/', key: 'home', glyph: icon.home },
  { to: '/courses', key: 'courses', glyph: icon.courses },
  { to: '/players', key: 'players', glyph: icon.players },
  { to: '/history', key: 'history', glyph: icon.history },
] as const

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to)
}

export function TabBar() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  return (
    <Box
      component="nav"
      aria-label={t.tabs.label}
      sx={(theme) => ({
        flex: 'none',
        display: 'flex',
        justifyContent: 'space-around',
        p: '10px 8px 26px',
        bgcolor: 'surface.raised',
        borderRadius: `${theme.radius.lg}px ${theme.radius.lg}px 0 0`,
      })}
    >
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.to)
        return (
          <ButtonBase
            key={tab.to}
            component={Link}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            sx={{
              width: 76,
              flexDirection: 'column',
              gap: 0.5,
              borderRadius: 2,
              color: active ? 'primary.main' : 'text.secondary',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Box
              sx={(theme) => ({
                width: 56,
                height: 32,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: active ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
              })}
            >
              <Icon>{tab.glyph}</Icon>
            </Box>
            {t.tabs[tab.key]}
          </ButtonBase>
        )
      })}
    </Box>
  )
}
