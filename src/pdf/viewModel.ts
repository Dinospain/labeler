// src/pdf/viewModel.ts
import { makeBarcodeDataUrl } from './barcode'
import { autoBarcodeFor, ensureEan13 } from './ean13'
import { calcEnergyText, formatDate } from './format'

/** Подготовка данных одной этикетки для шаблона */
export async function toLabelViewModel(l: any, compactBarcode: boolean) {
  const barcode = ensureEan13(l.barcode ? String(l.barcode) : autoBarcodeFor(l.id))
  const barcodeDataUrl = await makeBarcodeDataUrl(barcode, compactBarcode)
  return {
    ...l,
    manufacturedAt: formatDate(l.manufacturedAt),
    packagedAt: formatDate(l.packagedAt),
    expiresAt: formatDate(l.expiresAt),
    energyText: calcEnergyText(l.proteins100g, l.fats100g, l.carbs100g),
    barcode,          // подпись под штрихами рисует bwip-js; поле оставляем на всякий случай
    barcodeDataUrl,   // data:image/png;base64,...
  }
}

export function mapLabelsForTemplate(labels: any[], compactBarcode: boolean) {
  return Promise.all(labels.map((l) => toLabelViewModel(l, compactBarcode)))
}
