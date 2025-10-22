import { useEffect, useState } from 'react'
import type { Folder, Label } from '../types'

type Props = {
  open: boolean
  folders: Folder[]
  label: Label | null
  onClose: () => void
  onSave: (id: number, payload: Partial<Label>) => Promise<void>
}

export default function LabelEditModal({ open, folders, label, onClose, onSave }: Props) {
  const [v, setV] = useState<Partial<Label>>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (label) {
      setV({
        productName: label.productName,
        folderId: label.folderId ?? null,
        weight: label.weight ?? '',
        composition: label.composition ?? '',
        proteins100g: label.proteins100g ?? null,
        fats100g: label.fats100g ?? null,
        carbs100g: label.carbs100g ?? null,
        standard: label.standard ?? '',
        shelfLife: label.shelfLife ?? '',
        barcode: label.barcode ?? '',
      })
    }
  }, [label])

  if (!open || !label) return null

  const num = (s: string) => (s === '' ? null : Number(s))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    if (!v.productName?.trim()) { setErr('Введите название'); return }
    setBusy(true)
    try {
      await onSave(label.id, {
        productName: v.productName?.trim(),
        folderId: v.folderId ?? null,
        weight: v.weight ?? null,
        composition: v.composition ?? null,
        proteins100g: num(String(v.proteins100g ?? '')),
        fats100g: num(String(v.fats100g ?? '')),
        carbs100g: num(String(v.carbs100g ?? '')),
        standard: v.standard ?? null,
        shelfLife: v.shelfLife ?? null,
        barcode: v.barcode ?? null,
      })
      onClose()
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form onSubmit={submit} className="w-full max-w-2xl bg-white rounded-2xl p-5 shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Редактировать этикетку</h2>
          <button type="button" onClick={onClose} className="px-3 py-1 rounded-lg border">✕</button>
        </div>

        {err && <div className="text-rose-600 text-sm mb-3">{err}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm">Название</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={v.productName ?? ''} onChange={e => setV(s => ({ ...s, productName: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm">Папка</label>
            <select className="w-full border rounded-lg px-3 py-2"
              value={v.folderId ?? ''} onChange={e => setV(s => ({ ...s, folderId: e.target.value === '' ? null : Number(e.target.value) }))}>
              <option value="">— без папки —</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm">Масса</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={v.weight ?? ''} onChange={e => setV(s => ({ ...s, weight: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm">Состав</label>
            <textarea className="w-full border rounded-lg px-3 py-2"
              value={v.composition ?? ''} onChange={e => setV(s => ({ ...s, composition: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm">Белки, г/100</label>
            <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2"
              value={v.proteins100g ?? ''} onChange={e => setV(s => ({ ...s, proteins100g: e.target.value === '' ? null : Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm">Жиры, г/100</label>
            <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2"
              value={v.fats100g ?? ''} onChange={e => setV(s => ({ ...s, fats100g: e.target.value === '' ? null : Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm">Углеводы, г/100</label>
            <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2"
              value={v.carbs100g ?? ''} onChange={e => setV(s => ({ ...s, carbs100g: e.target.value === '' ? null : Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm">СТБ/ГОСТ</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={v.standard ?? ''} onChange={e => setV(s => ({ ...s, standard: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm">Срок годности</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={v.shelfLife ?? ''} onChange={e => setV(s => ({ ...s, shelfLife: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm">Штрих-код</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={v.barcode ?? ''} onChange={e => setV(s => ({ ...s, barcode: e.target.value }))} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Отмена</button>
          <button disabled={busy} className="px-4 py-2 rounded-lg bg-sky-300 text-black border border-sky-400 hover:bg-sky-400 disabled:opacity-50">
            Сохранить
          </button>
        </div>
      </form>
    </div>
  )
}
