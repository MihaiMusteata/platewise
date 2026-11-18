/**
 * Platewise design tokens — single source of truth.
 * Mirrors the "Sistem de design" and "Stil vizual" boards on the design canvas.
 * Components must import from here (via @/theme), never hard-code values.
 */

export const colors = {
  // Brand
  brand: '#0E5A3A',          // primary buttons, active tab, selections (white text: 8:1)
  brandPressed: '#0A4129',
  heroFrom: '#0B4F33',       // hero card gradient start
  heroTo: '#1B7A4B',         // hero card gradient end
  heroTextSecondary: '#D7EBDD',
  lime: '#8BD84F',           // progress bar on green, scan line, snackbar action
  onBrand: '#FFFFFF',        // text and icons on brand / dark surfaces
  flameCircle: '#4FA83B',
  flame: '#FFD23F',

  // Surfaces
  background: '#F7F9F8',
  surface: '#FFFFFF',
  mint: '#E6F4EA',           // positive/selected backgrounds, tips
  mintSoft: '#EAF5EE',       // weekly goal card
  neutralSoft: '#EEF3F0',    // stepper buttons, empty thumbs
  segmentTrack: '#EAEFEC',
  macroTrack: 'rgba(255,255,255,0.9)', // progress track inside tinted macro cards
  snackbar: '#13201A',       // dark snackbar surface

  // Text
  text: '#13201A',
  textSecondary: '#5B6862',  // ≥ 5.5:1 on white
  textTertiary: '#3D4A43',
  textNav: '#6B7770',
  chevron: '#8A958F',

  // Lines
  border: '#DCE3DF',
  divider: '#EEF2F0',
  hairline: '#E6ECE8',

  // Feedback
  danger: '#B42318',         // destructive actions only (delete), never for "over goal"
  attention: '#B4530B',      // calm amber for validation hints / over goal (4.9:1 on white)
  trophyBg: '#FFF1C9',
  trophy: '#D08A00',

  // Charts
  chartBar: '#86D0AA',
  chartBarActive: '#0E5A3A',
  chartGoalLine: '#6CC197',
  chartGrid: '#F0F3F1',

  // Scan screen (dark)
  scanBackground: '#0D1311',
  scanTextSecondary: '#C3CCC7',
  scanButton: 'rgba(255,255,255,0.12)',
} as const;

export const macros = {
  protein: { label: 'Proteine', text: '#1D5FD6', bar: '#3B82F6', tint: '#EEF4FE' },
  carbs: { label: 'Carbohidrați', text: '#B4530B', bar: '#F59E0B', tint: '#FEF3E8' },
  fat: { label: 'Grăsimi', text: '#15803D', bar: '#22A355', tint: '#EAF6EE' },
} as const;

/** Food thumbnail tints (placeholder until real photos). */
export const thumbs = {
  berry: { bg: '#FCE8EE', fg: '#B4325A' },
  green: { bg: '#E7F5EA', fg: '#15803D' },
  amber: { bg: '#FBF0E1', fg: '#A15C07' },
  blue: { bg: '#EEF4FE', fg: '#1D5FD6' },
} as const;

/** 8-pt grid with a 4-pt half step. */
export const space = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const layout = {
  screenPaddingX: 24,
  cardPadding: 16,
  sectionGap: 24,
  listGap: 8,
  topExtra: 8,      // added below the safe-area top inset
} as const;

export const radius = {
  xs: 4,            // progress bars, spacing swatches
  s: 8,
  m: 16,
  l: 24,
  pill: 999,
} as const;

export const size = {
  button: 56,
  chip: 48,
  input: 56,
  iconButton: 48,
  avatar: 56,
  thumb: 56,
  thumbSmall: 48,
  fab: 56,
  tabBar: 56,       // content height; add bottom safe-area inset
  iconS: 20,
  iconM: 24,
  minTouch: 48,
  snackbar: 56,
  progressBar: 6,   // macro cards
  progressBarHero: 10,
} as const;

export const borderWidth = {
  hairline: 1,
  strong: 1.5,      // outline button, input, choice chip
} as const;

export const opacity = {
  disabled: 0.4,
  pressed: 0.7,
} as const;

/** Icon stroke widths used in the design (lucide default is 2). */
export const iconStroke = {
  thin: 1.8,        // food thumbs, info icons
  regular: 2.2,     // nav, chevrons, macro icons
  bold: 2.4,        // stepper / add buttons
} as const;

export const fontFamily = {
  regular: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

/** Type scale, ratio 1.25 from 16. [fontSize, lineHeight] */
export const type = {
  display: { fontSize: 48, lineHeight: 48, fontFamily: fontFamily.extrabold, letterSpacing: -1.4 },
  numberL: { fontSize: 40, lineHeight: 40, fontFamily: fontFamily.extrabold, letterSpacing: -1.2 },
  h1: { fontSize: 32, lineHeight: 40, fontFamily: fontFamily.extrabold, letterSpacing: -0.6 },
  h2: { fontSize: 24, lineHeight: 32, fontFamily: fontFamily.extrabold, letterSpacing: -0.4 },
  h3: { fontSize: 20, lineHeight: 28, fontFamily: fontFamily.bold },
  bodyL: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.regular },
  bodyLStrong: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.bold },
  labelL: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.semibold },
  numberS: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.extrabold },
  button: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.bold },
  body: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.bold },
  label: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.semibold },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.semibold },
  overline: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.bold, letterSpacing: 0.7, textTransform: 'uppercase' as const },
} as const;

export const shadow = {
  card: {
    shadowColor: '#10281E',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  hero: {
    shadowColor: '#0E5A3A',
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  primaryButton: {
    shadowColor: '#0E5A3A',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  snackbar: {
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

export const tokens = {
  colors,
  macros,
  thumbs,
  space,
  layout,
  radius,
  size,
  borderWidth,
  opacity,
  iconStroke,
  fontFamily,
  type,
  shadow,
};
export default tokens;
