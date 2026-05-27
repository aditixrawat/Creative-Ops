/**
 * design-tokens.ts
 * Single source of truth for values that can't live in CSS
 * (JS animations, Recharts config, Framer Motion variants)
 */

// ─── Palette ────────────────────────────────────────────────────
export const colors = {
  teal:   "#adfcf9",
  sage:   "#89a894",
  forest: "#4b644a",
  wine:   "#49393b",
  deep:   "#341c1c",

  bg: {
    base:   "#0d0f0e",
    layer1: "#1a1c1b",
    layer2: "#222625",
    layer3: "#2c3030",
  },

  glass: {
    surface:     "rgba(173,252,249,0.04)",
    border:      "rgba(173,252,249,0.12)",
    borderStrong:"rgba(173,252,249,0.25)",
    tealDim:     "rgba(173,252,249,0.12)",
    tealGlow:    "rgba(173,252,249,0.06)",
  },

  text: {
    primary:   "#f0faf9",
    secondary: "#89a894",
    tertiary:  "rgba(173,252,249,0.35)",
    muted:     "rgba(173,252,249,0.25)",
  },

  border: {
    subtle:   "rgba(173,252,249,0.06)",
    default:  "rgba(173,252,249,0.10)",
    emphasis: "rgba(173,252,249,0.20)",
    strong:   "rgba(173,252,249,0.35)",
  },

  // Chart categorical palette — in order of use
  chart: [
    "#adfcf9",                   // teal   — primary series
    "#89a894",                   // sage   — secondary series
    "#4b644a",                   // forest — positive
    "rgba(173,252,249,0.40)",    // teal dimmed
    "rgba(137,168,148,0.40)",    // sage dimmed
    "#49393b",                   // wine   — warning
    "rgba(173,252,249,0.20)",    // ghost
  ],
} as const;

// ─── Typography ─────────────────────────────────────────────────
export const fonts = {
  display: "'Syne', sans-serif",
  body:    "'Space Grotesk', sans-serif",
  mono:    "'Space Mono', monospace",
} as const;

export const fontWeights = {
  regular: 400,
  medium:  500,
  semibold: 600,
  bold:    700,
  black:   800,
} as const;

// ─── Spacing ────────────────────────────────────────────────────
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
  9: 96,
} as const;

// ─── Border radius ───────────────────────────────────────────────
export const radius = {
  none: 0,
  sm:   4,
  md:   8,
  lg:   12,
  xl:   14,
  "2xl": 16,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────
export const shadows = {
  sm:     "0 2px 8px rgba(0,0,0,0.30)",
  md:     "0 4px 16px rgba(0,0,0,0.40), 0 1px 4px rgba(0,0,0,0.30)",
  lg:     "0 8px 32px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30)",
  xl:     "0 16px 48px rgba(0,0,0,0.60), 0 4px 16px rgba(0,0,0,0.40)",
  teal:   "0 0 0 1px rgba(173,252,249,0.15), 0 4px 24px rgba(0,0,0,0.40)",
  focus:  "0 0 0 2px rgba(173,252,249,0.40)",
  glass:  "0 0 0 1px rgba(173,252,249,0.20), inset 0 1px 0 rgba(173,252,249,0.08)",
  ambient:"0 0 32px rgba(173,252,249,0.08), 0 4px 16px rgba(0,0,0,0.40)",
} as const;

// ─── Easing functions ────────────────────────────────────────────
export const easing = {
  snappy:  [0.4, 0, 0.2, 1]   as [number, number, number, number],
  bounce:  [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  easeOut: [0, 0, 0.2, 1]     as [number, number, number, number],
  linear:  [0, 0, 1, 1]       as [number, number, number, number],
} as const;

export const duration = {
  instant: 0.075,
  fast:    0.15,
  normal:  0.20,
  slow:    0.30,
  slower:  0.50,
} as const;

// ─── Framer Motion variants ───────────────────────────────────────
export const motionVariants = {
  /** Fade + translateY up — page entry, card entry */
  fadeInUp: {
    hidden:  { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
  },

  /** Staggered container */
  staggerContainer: {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
  },

  /** Staggered item (use with staggerContainer) */
  staggerItem: {
    hidden:  { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
  },

  /** Slide in from right — sidebar, drawers */
  slideInRight: {
    hidden:  { opacity: 0, x: 16 },
    visible: { opacity: 1, x: 0,  transition: { duration: duration.normal, ease: easing.easeOut } },
  },

  /** Scale in — modals, dropdowns */
  scaleIn: {
    hidden:  { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1,    transition: { duration: duration.fast, ease: easing.bounce } },
  },

  /** Fade only */
  fade: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: duration.fast } },
  },

  /** Card hover lift */
  cardHover: {
    rest:  { y: 0,  boxShadow: shadows.md },
    hover: { y: -2, boxShadow: shadows.teal, transition: { duration: duration.fast, ease: easing.snappy } },
  },
} as const;

// ─── Recharts shared theme object ────────────────────────────────
export const rechartsTheme = {
  background:    "transparent",
  strokeWidth:   1.5,

  grid: {
    stroke:          colors.border.subtle,
    strokeDasharray: "3 3",
  },

  axis: {
    stroke:      colors.border.subtle,
    tick:        { fill: colors.text.muted, fontSize: 9, fontFamily: fonts.mono, letterSpacing: "0.08em" },
    axisLine:    { stroke: colors.border.subtle },
    tickLine:    false,
  },

  tooltip: {
    contentStyle: {
      background:   "rgba(22,25,24,0.95)",
      border:       `1px solid ${colors.glass.border}`,
      borderRadius: `${radius.lg}px`,
      boxShadow:    shadows.lg,
      fontFamily:   fonts.body,
      fontSize:     12,
      color:        colors.text.primary,
      padding:      "10px 14px",
    },
    labelStyle: {
      color:       colors.text.secondary,
      fontFamily:  fonts.mono,
      fontSize:    10,
      letterSpacing: "0.08em",
      marginBottom: 4,
    },
    itemStyle: { color: colors.teal },
    cursor:    { stroke: colors.glass.border, strokeWidth: 1 },
  },

  legend: {
    wrapperStyle: { fontFamily: fonts.mono, fontSize: 10, color: colors.text.secondary },
  },

  // Named color map for consistent series
  series: {
    primary:   colors.teal,
    secondary: colors.sage,
    positive:  colors.forest,
    warning:   colors.wine,
    danger:    colors.deep,
    ghost:     colors.glass.tealDim,
  },
} as const;

// ─── Layout constants ─────────────────────────────────────────────
export const layout = {
  sidebarCollapsed: 52,
  sidebarExpanded:  220,
  topbarHeight:     48,
  contentMax:       1280,
  gutter:           { desktop: 28, tablet: 20, mobile: 16 },
  bottomNavHeight:  56,
  breakpoints: {
    xs:  480,
    sm:  640,
    md:  768,
    lg:  1024,
    xl:  1280,
    "2xl": 1440,
  },
} as const;

// ─── Z-index scale ────────────────────────────────────────────────
export const zIndex = {
  base:     0,
  raised:   10,
  sidebar:  40,
  topbar:   50,
  modal:    60,
  toast:    70,
  tooltip:  80,
  command:  90,
  overlay: 100,
} as const;

// ─── Stagger delay helper ─────────────────────────────────────────
/** Returns animation-delay in seconds for staggered lists */
export const staggerDelay = (index: number, base = 0.05): number =>
  index * base;
