import { describe, expect, it } from 'vitest'
import type { Label } from '../../types'
import { emptyLabelForm, fromLabel, toPayload } from './labelForm'

const label: Label = {
  id: 1,
  productName: 'Хлеб',
  weight: '500 г',
  proteins100g: 7.5,
  fats100g: 0,
  carbs100g: null,
  manufacturedAt: '2025-03-01T00:00:00.000Z',
  expiresAt: '2025-03-05T00:00:00.000Z',
  address: 'г. Минск',
  folderId: 3,
}

describe('labelForm', () => {
  it('fromLabel: null → пустая строка, числа → строки, даты → YYYY-MM-DD', () => {
    const v = fromLabel(label)
    expect(v.carbs100g).toBe('')
    expect(v.fats100g).toBe('0')
    expect(v.proteins100g).toBe('7.5')
    expect(v.manufacturedAt).toBe('2025-03-01')
    expect(v.packagedAt).toBe('')
    expect(v.folderId).toBe('3')
    expect(v.website).toBe('')
  })

  it('toPayload: пустые строки → null, числа парсятся, имя обрезается', () => {
    const p = toPayload({ ...emptyLabelForm(5), productName: '  Хлеб ', proteins100g: '7,5', fats100g: '0', weight: '  ' })
    expect(p.productName).toBe('Хлеб')
    expect(p.proteins100g).toBe(7.5)
    expect(p.fats100g).toBe(0)
    expect(p.carbs100g).toBeNull()
    expect(p.weight).toBeNull()
    expect(p.folderId).toBe(5)
    expect(p.expiresAt).toBeNull()
  })

  it('fromLabel → toPayload сохраняет значения (в т.ч. поля, которых раньше не было в форме)', () => {
    const p = toPayload(fromLabel(label))
    expect(p).toMatchObject({
      productName: 'Хлеб',
      manufacturedAt: '2025-03-01',
      expiresAt: '2025-03-05',
      address: 'г. Минск',
      proteins100g: 7.5,
      carbs100g: null,
      folderId: 3,
    })
  })

  it('folderId: пустой → null', () => {
    expect(toPayload(emptyLabelForm()).folderId).toBeNull()
  })
})
