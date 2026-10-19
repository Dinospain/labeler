// src/pdf/barcode.ts
import bwipjs from 'bwip-js'
import { ensureEan13, formatEanHuman } from './ean13'

/** Генерация штрих-кода (PNG data URL), строго EAN-13 */
export async function makeBarcodeDataUrl(text?: string | null, compact = true): Promise<string> {
  const ean = ensureEan13(text)
  const buf = await bwipjs.toBuffer({
    bcid: 'ean13',
    text: ean,
    alttext: formatEanHuman(ean),
    includetext: true,
    guardwhitespace: true,
    scale: compact ? 3 : 4,
    height: compact ? 12 : 14,
    textsize: compact ? 10 : 11,

    // ↓ Добавляем точную настройку подписи
    textxalign: 'center',   // выравнивание по центру
    textxoffset: -7,        // немного левее (отрицательное — влево)
    textyoffset: -3,        // немного выше (отрицательное — вверх)
  } as any)
  return `data:image/png;base64,${buf.toString('base64')}`
}
