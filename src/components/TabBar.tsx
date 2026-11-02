import { Link, useLocation } from 'react-router'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import { alpha } from '@mui/material/styles'
import { Icon } from './Icon.tsx'
import { icon } from './icons.tsx'

const tabs = [
  { to: '/', label: 'Home', glyph: icon.home },
  { to: '/courses', label: 'Courses', glyph: icon.courses },
  { to: '/players', label: 'Players', glyph: icon.players },
  { to: '/history', label: 'History', glyph: icon.history },
]

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to)
}

export function TabBar() {
  const { pathname } = useLocation()
  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={(t) => ({
        position: 'sticky',
        bottom: 0,
        mx: -2,
        mb: -2,
        display: 'flex',
        justifyContent: 'space-around',
        p: '10px 8px 26px',
        bgcolor: 'surface.raised',
        borderRadius: `${t.radius.lg}px ${t.radius.lg}px 0 0`,
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
              sx={(t) => ({
                width: 56,
                height: 32,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: active ? alpha(t.palette.primary.main, 0.14) : 'transparent',
              })}
            >
              <Icon>{tab.glyph}</Icon>
            </Box>
            {tab.label}
          </ButtonBase>
        )
      })}
    </Box>
  )
}
