/**
 * Raw design tokens extracted from the "Scoring with wheel picker" design.
 * Keep these framework-agnostic; theme.ts maps them onto MUI.
 */
export const colors = {
  // Surfaces (darkest → lightest)
  canvas: '#0D1411', // app background
  surface: '#17211C', // cards, sheets, round buttons
  surfaceRaised: '#1F2C26', // chips, score buttons
  track: '#2E3D35', // inactive progress segments
  handle: '#3A4B42', // sheet grab handle, dividers
  outline: '#6B8275', // 2px outlines on secondary buttons

  // Text
  textPrimary: '#F1F5F2',
  textSecondary: '#9DB0A5',

  // Accent
  lime: '#C8F24A',
  onLime: '#0D1411',

  // Score semantics
  underPar: '#C8F24A',
  evenPar: '#F1F5F2',
  overPar: '#FFA777',

  // Modal scrim
  scrim: 'rgba(4, 8, 6, 0.66)',
} as const;

/** Avatar tints, assigned to players by index. Text on them is `colors.canvas`. */
export const playerTints = ['#CFE6D8', '#F7DFB9', '#D4DFF3', '#EBD5E7'] as const;

export const radius = {
  sm: 16, // wheel selection highlight, inputs
  md: 18, // score picker button
  card: 24, // player rows
  lg: 28, // hero card
  sheet: 32, // bottom sheet top corners
  pill: 999,
} as const;

export const fontFamily = "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
