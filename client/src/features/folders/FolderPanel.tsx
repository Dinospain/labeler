import type { Folder } from '../../types'
import type { FolderFilter } from '../labels/labelList'

type Props = {
  folders: Folder[]
  active: FolderFilter
  onSelect: (f: FolderFilter) => void
  onDelete: () => void
}

export default function FolderPanel({ folders, active, onSelect, onDelete }: Props) {
  const item = (selected: boolean) =>
    `w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 ${selected ? 'bg-slate-100 font-medium' : ''}`
  return (
    <div className="bg-white border rounded-2xl p-3 shadow-sm h-full overflow-auto" data-testid="folder-panel">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Папки</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700">{folders.length}</span>
          <button
            onClick={onDelete}
            disabled={active === 'all'}
            data-testid="delete-folder"
            className="px-3 py-1 rounded-lg border border-rose-800 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40"
            title="Удалить выбранную папку"
          >
            Удалить папку
          </button>
        </div>
      </div>
      <nav className="space-y-1">
        <button onClick={() => onSelect('all')} data-testid="folder-all" className={item(active === 'all')}>
          Все
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            data-testid={`folder-${f.id}`}
            className={item(active === f.id)}
          >
            {f.name}
            {typeof f._count?.labels === 'number' ? ` (${f._count.labels})` : ''}
          </button>
        ))}
      </nav>
    </div>
  )
}
