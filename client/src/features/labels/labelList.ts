import type { Folder, Label } from '../../types'

export type FolderFilter = number | 'all'

// Не мутирует исходный массив (B14)
export function filterLabels(labels: Label[], folder: FolderFilter, query: string): Label[] {
  const q = query.trim().toLowerCase()
  return labels
    .filter((l) => folder === 'all' || l.folderId === folder)
    .filter((l) => !q || l.productName.toLowerCase().includes(q))
    .sort((a, b) => a.productName.localeCompare(b.productName, 'ru'))
}

// Счётчики считаем из локальных этикеток, чтобы они не отставали от мутаций (B18)
export function withLabelCounts(folders: Folder[], labels: Label[]): Folder[] {
  return folders.map((f) => ({ ...f, _count: { labels: labels.filter((l) => l.folderId === f.id).length } }))
}
