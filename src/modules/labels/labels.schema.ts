import { z } from 'zod'
import { isValidBarcodeInput } from '../../pdf/ean13'

// '' и null → null; число или числовая строка; иначе ошибка валидации
const nullableNumber = z.preprocess(
  (v) => (v === '' || v === null ? null : typeof v === 'string' ? Number(v.replace(',', '.')) : v),
  z.number({ invalid_type_error: 'must be a number' }).finite().nullable()
)

// '' и null → null; строка/ISO-дата → Date
const nullableDate = z.preprocess(
  (v) => (v === '' || v === null ? null : typeof v === 'string' || typeof v === 'number' ? new Date(v) : v),
  z.date({ invalid_type_error: 'invalid date' }).refine((d) => !isNaN(d.getTime()), 'invalid date').nullable()
)

const nullableText = z.preprocess((v) => (v === '' ? null : v), z.string().nullable())

const nullableBarcode = z.preprocess(
  (v) => (v === '' ? null : typeof v === 'string' ? v.trim() : v),
  z.string().nullable().refine((v) => v === null || isValidBarcodeInput(v), 'must be 12 digits or 13 digits with a valid check digit')
)

const nullableId = z.preprocess(
  (v) => (v === '' || v === null ? null : typeof v === 'string' ? Number(v) : v),
  z.number().int().positive().nullable()
)

const fields = {
  weight: nullableText,
  composition: nullableText,
  proteins100g: nullableNumber,
  fats100g: nullableNumber,
  carbs100g: nullableNumber,
  standard: nullableText,
  shelfLife: nullableText,
  manufacturedAt: nullableDate,
  packagedAt: nullableDate,
  expiresAt: nullableDate,
  address: nullableText,
  mchsInfo: nullableText,
  website: nullableText,
  barcode: nullableBarcode,
  folderId: nullableId,
}

const productName = z.string().trim().min(1, 'productName is required')

// POST: пропущенное поле = null
export const createLabelSchema = z.object({ productName, ...fields }).partial({
  weight: true, composition: true, proteins100g: true, fats100g: true, carbs100g: true, standard: true,
  shelfLife: true, manufacturedAt: true, packagedAt: true, expiresAt: true, address: true, mchsInfo: true,
  website: true, barcode: true, folderId: true,
})

// PUT: пропущенное поле = не менять, явный null = очистить
export const updateLabelSchema = z.object({ productName, ...fields }).partial()

export type CreateLabelInput = z.infer<typeof createLabelSchema>
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>
