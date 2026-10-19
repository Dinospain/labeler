// src/pdf/ean13.ts

/** Нормализация к EAN-13 с вычислением контрольной цифры */
export function ensureEan13(input?: string | null): string {
  const base = (input || '').replace(/\D/g, '')
  const digits = (base.length >= 12 ? base : (base + '000000000000')).slice(0, 12)
  const arr = digits.split('').map(Number)
  const sum = arr.reduce((acc, d, i) => acc + d * (i % 2 ? 3 : 1), 0)
  const check = (10 - (sum % 10)) % 10
  return digits + String(check)
}

/** Человекочитаемая подпись EAN-13: "D XXXXXX XXXXXX" */
export function formatEanHuman(ean: string): string {
  const s = ean.replace(/\D/g, '').padStart(13, '0').slice(0, 13)
  return `${s[0]} ${s.slice(1, 7)} ${s.slice(7, 13)}`
}

/** Базовые 12 цифр автоштрихкода для этикетки без собственного кода */
export function autoBarcodeFor(id: number | string | null | undefined): string {
  return String(200000000000 + Number(id || 0))
}

/** Штрихкод при сохранении: ровно 12 цифр, либо 13 цифр с верной контрольной цифрой */
export function isValidBarcodeInput(input: string): boolean {
  if (/^\d{12}$/.test(input)) return true
  return /^\d{13}$/.test(input) && ensureEan13(input) === input
}
