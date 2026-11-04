import { alpha, createTheme, type Theme } from '@mui/material/styles';
import { colors, fontFamily, playerTints, radius } from './tokens';

const tabular = { fontVariantNumeric: 'tabular-nums' } as const;

export const theme = createTheme({
  radius,
  shape: { borderRadius: radius.sm },

  palette: {
    mode: 'dark',
    primary: { main: colors.lime, contrastText: colors.onLime },
    secondary: { main: colors.textPrimary, contrastText: colors.canvas },
    warning: { main: colors.overPar, contrastText: colors.canvas },
    success: { main: colors.underPar, contrastText: colors.onLime },
    background: { default: colors.canvas, paper: colors.surface },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      disabled: alpha(colors.textPrimary, 0.38),
    },
    divider: colors.handle,
    action: {
      hover: alpha(colors.textPrimary, 0.06),
      selected: alpha(colors.lime, 0.1),
      focus: alpha(colors.lime, 0.16),
    },
    surface: {
      raised: colors.surface,
      elevated: colors.surfaceRaised,
      track: colors.track,
      handle: colors.handle,
      outline: colors.outline,
      scrim: colors.scrim,
    },
    score: { under: colors.underPar, even: colors.evenPar, over: colors.overPar },
    players: playerTints,
  },

  typography: {
    fontFamily,
    fontWeightRegular: 500,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    // Hero "Par 3"
    h1: { fontSize: 46, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em' },
    // Wheel picker numbers
    h2: { fontSize: 34, fontWeight: 800, lineHeight: 1.1, ...tabular },
    // Stroke count on score button
    h3: { fontSize: 30, fontWeight: 800, lineHeight: 1, ...tabular },
    // Sheet title
    h4: { fontSize: 18, fontWeight: 800, lineHeight: 1.3 },
    // Player name
    h5: { fontSize: 17, fontWeight: 700, lineHeight: 1.3 },
    // Top bar title
    h6: { fontSize: 16, fontWeight: 700, lineHeight: 1.3 },
    subtitle1: { fontSize: 15, fontWeight: 600, lineHeight: 1.4 },
    subtitle2: { fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: 15, fontWeight: 500, lineHeight: 1.45 },
    body2: { fontSize: 13, fontWeight: 500, lineHeight: 1.45 },
    caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.4 },
    // "HOLE 7 OF 18"
    overline: { fontSize: 12, fontWeight: 700, lineHeight: 1.4, letterSpacing: '0.1em' },
    button: { fontSize: 17, fontWeight: 800, textTransform: 'none', letterSpacing: 0 },
    // "Birdie" / "Bogey" under stroke counts
    scoreLabel: { fontFamily, fontSize: 12, fontWeight: 700, lineHeight: 1.2 },
    // Inline running totals, e.g. "+3"
    numeric: { fontFamily, fontSize: 13, fontWeight: 800, ...tabular },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.canvas,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        ':focus-visible': { outline: `2px solid ${colors.lime}`, outlineOffset: 2 },
      },
    },

    MuiTypography: {
      defaultProps: {
        variantMapping: { scoreLabel: 'span', numeric: 'span', overline: 'div' },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      // Remove MUI's dark-mode elevation overlay; surfaces are explicit colors.
      styleOverrides: { root: { backgroundImage: 'none' } },
    },

    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.radius.card,
          backgroundColor: theme.palette.surface.raised,
        }),
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true, variant: 'contained' },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.radius.pill,
          gap: 10,
          paddingInline: 24,
        }),
        sizeLarge: { height: 60, fontSize: 18 },
        sizeMedium: { height: 56 },
        sizeSmall: { height: 44, fontSize: 15, paddingInline: 16 },
        colorPrimary: {
          '&.MuiButton-contained:hover': { backgroundColor: '#D4F56E' },
        },
        outlined: ({ theme }) => ({
          borderWidth: 2,
          borderColor: theme.palette.surface.outline,
          color: theme.palette.text.primary,
          fontWeight: 700,
          '&:hover': {
            borderWidth: 2,
            borderColor: theme.palette.text.secondary,
            backgroundColor: theme.palette.action.hover,
          },
        }),
        startIcon: { margin: 0 },
        endIcon: { margin: 0 },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          width: 44,
          height: 44,
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.surface.raised,
          '&:hover': { backgroundColor: theme.palette.surface.elevated },
        }),
        sizeLarge: ({ theme }) => ({
          width: 60,
          height: 60,
          border: `2px solid ${theme.palette.surface.outline}`,
        }),
      },
    },

    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          height: 34,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.palette.surface.elevated,
          color: theme.palette.text.primary,
          fontSize: 13,
          fontWeight: 700,
        }),
        label: { paddingInline: 12 },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }) => ({
          width: 44,
          height: 44,
          fontSize: 17,
          fontWeight: 800,
          color: theme.palette.background.default,
        }),
      },
    },

    MuiBackdrop: {
      styleOverrides: {
        root: ({ theme }) => ({ backgroundColor: theme.palette.surface.scrim }),
        invisible: { backgroundColor: 'transparent' },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.MuiDrawer-anchorBottom .MuiDrawer-paper': {
            borderRadius: `${theme.radius.sheet}px ${theme.radius.sheet}px 0 0`,
            backgroundColor: theme.palette.surface.raised,
            padding: '12px 20px 28px',
          },
        }),
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: theme.radius.lg,
          backgroundColor: theme.palette.surface.raised,
        }),
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.radius.md,
          backgroundColor: theme.palette.surface.elevated,
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: theme.palette.surface.outline,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.text.secondary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
        }),
      },
    },

    MuiDivider: {
      styleOverrides: { root: ({ theme }) => ({ borderColor: theme.palette.divider }) },
    },
  },
});

/** Color for a score relative to par: negative = under, 0 = even, positive = over. */
export function scoreColor(t: Theme, relativeToPar: number): string {
  if (relativeToPar < 0) return t.palette.score.under;
  if (relativeToPar === 0) return t.palette.score.even;
  return t.palette.score.over;
}

/** Avatar tint for the player at `index`, cycling through the palette. */
export function playerTint(t: Theme, index: number): string {
  return t.palette.players[index % t.palette.players.length];
}
