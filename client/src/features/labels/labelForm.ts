import type { Label, LabelPayload } from '../../types'

// Значения формы — всё строки (как в <input>), даты — YYYY-MM-DD
export type LabelFormValues = {
  productName: string
  folderId: string
  weight: string
  composition: string
  proteins100g: string
  fats100g: string
  carbs100g: string
  standard: string
  shelfLife: string
  manufacturedAt: string
  packagedAt: string
  expiresAt: string
  address: string
  mchsInfo: string
  website: string
  barcode: string
}

export function emptyLabelForm(folderId: number | null = null): LabelFormValues {
  return {
    productName: '',
    folderId: folderId === null ? '' : String(folderId),
    weight: '',
    composition: '',
    proteins100g: '',
    fats100g: '',
    carbs100g: '',
    standard: '',
    shelfLife: '',
    manufacturedAt: '',
    packagedAt: '',
    expiresAt: '',
    address: '',
    mchsInfo: '',
    website: '',
    barcode: '',
  }
}

// Сервер хранит даты как UTC-полночь, поэтому берём дату из ISO без смены часового пояса
function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ''
}

export function fromLabel(label: Label): LabelFormValues {
  const num = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))
  return {
    productName: label.productName,
    folderId: label.folderId == null ? '' : String(label.folderId),
    weight: label.weight ?? '',
    composition: label.composition ?? '',
    proteins100g: num(label.proteins100g),
    fats100g: num(label.fats100g),
    carbs100g: num(label.carbs100g),
    standard: label.standard ?? '',
    shelfLife: label.shelfLife ?? '',
    manufacturedAt: toDateInput(label.manufacturedAt),
    packagedAt: toDateInput(label.packagedAt),
    expiresAt: toDateInput(label.expiresAt),
    address: label.address ?? '',
    mchsInfo: label.mchsInfo ?? '',
    website: label.website ?? '',
    barcode: label.barcode ?? '',
  }
}

const text = (s: string) => (s.trim() === '' ? null : s.trim())
const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

// Пустые строки → null (на сервере null в PUT = «очистить поле»)
export function toPayload(v: LabelFormValues): LabelPayload {
  return {
    productName: v.productName.trim(),
    folderId: v.folderId === '' ? null : Number(v.folderId),
    weight: text(v.weight),
    composition: text(v.composition),
    proteins100g: num(v.proteins100g),
    fats100g: num(v.fats100g),
    carbs100g: num(v.carbs100g),
    standard: text(v.standard),
    shelfLife: text(v.shelfLife),
    manufacturedAt: text(v.manufacturedAt),
    packagedAt: text(v.packagedAt),
    expiresAt: text(v.expiresAt),
    address: text(v.address),
    mchsInfo: text(v.mchsInfo),
    website: text(v.website),
    barcode: text(v.barcode),
  }
}
