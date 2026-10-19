import { describe, expect, it } from 'vitest'
import type { Folder, Label } from '../../types'
import { filterLabels, withLabelCounts } from './labelList'

const mk = (id: number, productName: string, folderId: number | null = null): Label => ({ id, productName, folderId })

describe('filterLabels', () => {
  const labels = [mk(1, 'Яблоко', 1), mk(2, 'арбуз', 2), mk(3, 'Банан'), mk(4, 'Груша', 1)]

  it('сортирует по-русски без учёта регистра и не мутирует вход', () => {
    const snapshot = [...labels]
    expect(filterLabels(labels, 'all', '').map((l) => l.id)).toEqual([2, 3, 4, 1])
    expect(labels).toEqual(snapshot)
  })

  it('фильтрует по папке', () => {
    expect(filterLabels(labels, 1, '').map((l) => l.id)).toEqual([4, 1])
  })

  it('ищет без учёта регистра', () => {
    expect(filterLabels(labels, 'all', ' АРБ ').map((l) => l.id)).toEqual([2])
  })

  it('папка и поиск вместе', () => {
    expect(filterLabels(labels, 1, 'гру').map((l) => l.id)).toEqual([4])
  })
})

describe('withLabelCounts', () => {
  it('считает этикетки по папкам', () => {
    const folders: Folder[] = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }]
    const res = withLabelCounts(folders, [mk(1, 'x', 1), mk(2, 'y', 1), mk(3, 'z', 2), mk(4, 'w')])
    expect(res.map((f) => f._count?.labels)).toEqual([2, 1, 0])
  })
})
