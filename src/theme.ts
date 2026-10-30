export const colors = {
  bg: '#000000',
  surface: '#18172B',
  surfaceRaised: '#1A192F',
  border: '#322F56',
  text: '#FFFFFF',
  textSoft: '#E5E7EB',
  textSecondary: '#D1D5DB',
  textMuted: '#C0BEDA',
  textDim: '#8F8CB3',
  separator: '#6B7280',
  tabDivider: '#1C1E30',
  cyan: '#64EDF7',
  onCyan: '#044449',
  purple: '#CB64F7',
  coin: '#FACC15',
  navy: '#0A1832',
  navyBorder: '#213049',
  disabled: '#24324A',
} as const;

export const gradient = [colors.cyan, colors.purple] as const;

export const fonts = {
  serifMedium: 'PlayfairDisplay_500Medium',
  serifSemiBold: 'PlayfairDisplay_600SemiBold',
  serifBold: 'PlayfairDisplay_700Bold',
  serifExtraBold: 'PlayfairDisplay_800ExtraBold',
  serifItalic: 'PlayfairDisplay_600SemiBold_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const gutter = 16;

// Small labels that sit in fixed-size UI (chips, badges, poster meta, tab labels) stop
// growing at this text size so they stay inside their boxes.
export const denseTextScale = 1.3;

// Display titles stop growing here: beyond it, long words such as "Schicksalsband" no
// longer fit on one line of an iPhone SE and break mid-word.
export const displayTextScale = 1.35;

export const glow = {
  shadowColor: colors.cyan,
  shadowOpacity: 0.45,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 4 },
} as const;
