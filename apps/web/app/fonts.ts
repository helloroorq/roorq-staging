import { Anton, Libre_Baskerville, Poppins } from 'next/font/google'

export const fontPoppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
})

export const fontAnton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
})

export const fontLibreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-libre-baskerville',
})
