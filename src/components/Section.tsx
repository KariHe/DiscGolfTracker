import type { ElementType, ReactNode } from 'react'
import Card from '@mui/material/Card'
import type { SxProps, Theme } from '@mui/material/styles'

/** The shared box: themed Card surface plus padding. Typography and layout belong to the caller. */
export function Section({ children, component = 'section', variant, padding = 2, sx, ...aria }: {
  children: ReactNode
  component?: ElementType
  /** `hero` uses the larger corner radius; `dashed` is the archived look. */
  variant?: 'hero' | 'dashed'
  /** MUI spacing units; default 2 (16px). */
  padding?: number
  /** Layout only (flex, gap, margins); box styling stays here. */
  sx?: SxProps<Theme>
  'aria-label'?: string
  'aria-labelledby'?: string
}) {
  return (
    <Card component={component} {...aria}
      sx={[
        (theme) => ({
          p: padding,
          ...(variant === 'hero' && { borderRadius: `${theme.radius.lg}px` }),
          ...(variant === 'dashed' && { bgcolor: 'transparent', border: 2, borderStyle: 'dashed', borderColor: 'surface.handle' }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}>
      {children}
    </Card>
  )
}
