import type { Label } from '../../types'

type Props = {
  labels: Label[]
  loading: boolean
  selectedId: number | null
  onSelect: (id: number | null) => void
  onOpen: (id: number) => void
}

export default function LabelList({ labels, loading, selectedId, onSelect, onOpen }: Props) {
  if (loading) {
    return <div className="h-48 flex items-center justify-center text-slate-500">Загрузка…</div>
  }
  if (labels.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-500" data-testid="labels-empty">Пусто</div>
  }
  return (
    <ul className="divide-y" data-testid="label-list">
      {labels.map((l) => {
        const sel = l.id === selectedId
        return (
          <li key={l.id}>
            <button
              onClick={() => onSelect(sel ? null : l.id)}
              onDoubleClick={() => onOpen(l.id)}
              data-testid={`label-${l.id}`}
              aria-pressed={sel}
              className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 ${
                sel ? 'bg-sky-50 ring-1 ring-sky-200' : ''
              }`}
            >
              <span className="truncate">{l.productName}</span>
              <span className="text-sm text-slate-500">
                {l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : '—'}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
