import { describe, expect, it } from 'vitest'
import { toLabelViewModel } from './viewModel'

describe('toLabelViewModel', () => {
  it('formats dates, energy and generates a barcode image', async () => {
    const vm = await toLabelViewModel(
      { id: 7, productName: 'X', barcode: '460123456789', proteins100g: 10, fats100g: 5, carbs100g: 20, expiresAt: new Date(2024, 11, 31) },
      true
    )
    expect(vm.expiresAt).toBe('31.12.2024')
    expect(vm.manufacturedAt).toBeUndefined()
    expect(vm.energyText).toBe('165 ккал / 690 кДж')
    expect(vm.barcode).toBe('4601234567893')
    expect(vm.barcodeDataUrl.startsWith('data:image/png;base64,')).toBe(true)
  })
  it('uses an auto barcode derived from the id when missing', async () => {
    const vm = await toLabelViewModel({ id: 1, productName: 'X' }, false)
    expect(vm.barcode).toBe('2000000000015')
  })
})
