import '@mui/material/styles';
import '@mui/material/Typography';
import type { CSSProperties } from 'react';
import type { radius } from './tokens';

type Radius = { [K in keyof typeof radius]: number };

interface SurfacePalette {
  raised: string;
  elevated: string;
  track: string;
  handle: string;
  outline: string;
  scrim: string;
}

interface ScorePalette {
  under: string;
  even: string;
  over: string;
}

declare module '@mui/material/styles' {
  interface Palette {
    surface: SurfacePalette;
    score: ScorePalette;
    players: readonly string[];
  }
  interface PaletteOptions {
    surface?: Partial<SurfacePalette>;
    score?: Partial<ScorePalette>;
    players?: readonly string[];
  }

  interface Theme {
    radius: Radius;
  }
  interface ThemeOptions {
    radius?: Partial<Radius>;
  }

  interface TypographyVariants {
    scoreLabel: CSSProperties;
    numeric: CSSProperties;
  }
  interface TypographyVariantsOptions {
    scoreLabel?: CSSProperties;
    numeric?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    scoreLabel: true;
    numeric: true;
  }
}
