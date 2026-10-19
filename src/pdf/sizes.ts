// src/pdf/sizes.ts
import type { PDFOptions } from 'puppeteer'

export type SizeKey = '58x40' | '100x70' | 'a4'

const ZERO_MARGIN = { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }

export const LABEL_SIZES: Record<SizeKey, PDFOptions> = {
  '58x40': { width: '58mm', height: '40mm', margin: ZERO_MARGIN, printBackground: false, preferCSSPageSize: true },
  '100x70': { width: '100mm', height: '70mm', margin: ZERO_MARGIN, printBackground: false, preferCSSPageSize: true },
  a4: {
    format: 'A4',
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    printBackground: true,
    preferCSSPageSize: true,
  },
}

/** '58x40' | '100x70' | '10x7' (без учёта регистра) → ключ размера; неизвестное → null */
export function parseSize(input?: string | null): '58x40' | '100x70' | null {
  const size = (input ?? '').toLowerCase()
  if (size === '58x40') return '58x40'
  if (size === '100x70' || size === '10x7') return '100x70'
  return null
}
