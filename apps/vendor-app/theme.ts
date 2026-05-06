import type { TextStyle } from 'react-native'

export const Colors = {
  BLACK:  '#0D0D0D',
  WHITE:  '#FFFFFF',
  RED:    '#C0392B',
  CREAM:  '#FAF8F4',
  MUTED:  '#888780',
  BORDER: '#E8E6E0',
  GREEN:  '#1D9E75',
} as const

export const Spacing = {
  XS: 8, SM: 16, MD: 24, LG: 32, XL: 48,
} as const

export const Radius = {
  INPUT: 8, CARD: 12, SHEET: 24,
} as const

export const Size = {
  BUTTON_HEIGHT: 56,
  TOUCH_TARGET:  60,
  CAMERA_BUTTON: 80,
  PROFILE_PHOTO: 60,
} as const

export const FontSize = {
  XS: 11, SM: 13, BASE: 15, MD: 17, LG: 20, XL: 24, XXL: 32,
} as const

// Typed as TextStyle['fontWeight'] so React Native accepts these directly
export const FontWeight: Record<string, TextStyle['fontWeight']> = {
  REGULAR:  '400',
  MEDIUM:   '500',
  SEMIBOLD: '600',
  BOLD:     '700',
}
