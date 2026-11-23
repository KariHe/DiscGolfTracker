import type { ReactNode } from 'react'
import { Link } from 'react-router'
import ButtonBase from '@mui/material/ButtonBase'
import type { SxProps, Theme } from '@mui/material/styles'
import { Section } from './Section.tsx'

/**
 * A clickable list row: Section box whose whole surface is tappable.
 * Row content and its layout (via `sx`) belong to the caller; `details` renders under the row, inside the box.
 */
export function ListRow({ children, to, onClick, variant, sx, details, 'aria-expanded': ariaExpanded }: {
  children: ReactNode
  /** Navigates to this route; otherwise the row is a button. */
  to?: string
  onClick?: () => void
  variant?: 'dashed'
  /** Layout of the row content only. */
  sx?: SxProps<Theme>
  details?: ReactNode
  'aria-expanded'?: boolean
}) {
  const link = to === undefined ? {} : { component: Link, to }
  return (
    <Section component="div" padding={0} variant={variant}>
      <ButtonBase {...link} onClick={onClick} aria-expanded={ariaExpanded}
        sx={[{ width: '100%', display: 'flex', alignItems: 'center', p: 2, textAlign: 'left' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        {children}
      </ButtonBase>
      {details}
    </Section>
  )
}
