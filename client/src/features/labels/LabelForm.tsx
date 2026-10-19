import { useState } from 'react'
import type { Folder, LabelPayload } from '../../types'
import { errorMessage } from '../../api/client'
import { toPayload, type LabelFormValues } from './labelForm'

type Props = {
  initial: LabelFormValues
  folders: Folder[]
  submitText: string
  onSubmit: (payload: LabelPayload) => Promise<void>
  onCancel: () => void
}

const input = 'w-full border rounded-lg px-3 py-2'

// Одна форма для создания и редактирования. Монтируется только при открытии модалки,
// поэтому начальные значения всегда берутся из props (B15)
export default function LabelForm({ initial, folders, submitText, onSubmit, onCancel }: Props) {
  const [v, setV] = useState<LabelFormValues>(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const set = (k: keyof LabelFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    if (!v.productName.trim()) { setErr('Введите название'); return }
    setBusy(true)
    try {
      await onSubmit(toPayload(v))
    } catch (e) {
      setErr(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} data-testid="label-form">
      {err && <div className="text-rose-600 text-sm mb-3" data-testid="form-error">{err}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm">Название</label>
          <input className={input} data-testid="f-productName" value={v.productName} onChange={set('productName')} />
        </div>
        <div>
          <label className="block text-sm">Папка</label>
          <select className={input} data-testid="f-folderId" value={v.folderId} onChange={set('folderId')}>
            <option value="">— без папки —</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Масса</label>
          <input className={input} data-testid="f-weight" value={v.weight} onChange={set('weight')} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm">Состав</label>
          <textarea className={input} data-testid="f-composition" value={v.composition} onChange={set('composition')} />
        </div>
        <div>
          <label className="block text-sm">Белки, г/100</label>
          <input type="number" step="0.1" className={input} data-testid="f-proteins100g" value={v.proteins100g} onChange={set('proteins100g')} />
        </div>
        <div>
          <label className="block text-sm">Жиры, г/100</label>
          <input type="number" step="0.1" className={input} data-testid="f-fats100g" value={v.fats100g} onChange={set('fats100g')} />
        </div>
        <div>
          <label className="block text-sm">Углеводы, г/100</label>
          <input type="number" step="0.1" className={input} data-testid="f-carbs100g" value={v.carbs100g} onChange={set('carbs100g')} />
        </div>
        <div>
          <label className="block text-sm">СТБ/ГОСТ</label>
          <input className={input} data-testid="f-standard" value={v.standard} onChange={set('standard')} />
        </div>
        <div>
          <label className="block text-sm">Срок годности</label>
          <input className={input} data-testid="f-shelfLife" value={v.shelfLife} onChange={set('shelfLife')} />
        </div>
        <div>
          <label className="block text-sm">Штрих-код (12 цифр или EAN-13)</label>
          <input className={input} data-testid="f-barcode" value={v.barcode} onChange={set('barcode')} />
        </div>
        <div>
          <label className="block text-sm">Дата изготовления</label>
          <input type="date" className={input} data-testid="f-manufacturedAt" value={v.manufacturedAt} onChange={set('manufacturedAt')} />
        </div>
        <div>
          <label className="block text-sm">Дата упаковки</label>
          <input type="date" className={input} data-testid="f-packagedAt" value={v.packagedAt} onChange={set('packagedAt')} />
        </div>
        <div>
          <label className="block text-sm">Годен до</label>
          <input type="date" className={input} data-testid="f-expiresAt" value={v.expiresAt} onChange={set('expiresAt')} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm">Адрес производителя</label>
          <input className={input} data-testid="f-address" value={v.address} onChange={set('address')} />
        </div>
        <div>
          <label className="block text-sm">МЧС</label>
          <input className={input} data-testid="f-mchsInfo" value={v.mchsInfo} onChange={set('mchsInfo')} />
        </div>
        <div>
          <label className="block text-sm">Сайт</label>
          <input className={input} data-testid="f-website" value={v.website} onChange={set('website')} />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border">Отмена</button>
        <button
          disabled={busy}
          data-testid="form-submit"
          className="px-4 py-2 rounded-lg bg-sky-300 text-black border border-sky-400 hover:bg-sky-400 disabled:opacity-50"
        >
          {submitText}
        </button>
      </div>
    </form>
  )
}
