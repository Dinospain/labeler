import { useEffect, useMemo, useState } from "react"
import Modal from "./Modal"
import { useLabels, type Label as StoreLabel } from "../store/labels"
import { useFolders, type Folder } from "../store/folders"

type Props = {
  id: number | null            // id этикетки для редактирования
  open: boolean
  onClose: () => void
  onSaved?: () => void         // колбэк после сохранения
}

function toISO(dateStr?: string) {
  return dateStr ? new Date(dateStr + "T00:00:00").toISOString() : undefined
}
function fromISO(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v))

export default function LabelEditorModal({ id, open, onClose, onSaved }: Props) {
  const { getOne, update } = useLabels()
  const { items: folders, fetch: fetchFolders } = useFolders()
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState<any>({
    productName: "",
    weight: "",
    composition: "",
    proteins100g: "",
    fats100g: "",
    carbs100g: "",
    standard: "",
    shelfLife: "",
    manufacturedAt: "",
    packagedAt: "",
    expiresAt: "",
    address: "",
    mchsInfo: "",
    website: "",
    barcode: "",
    folderId: "",
  })

  // загрузка этикетки при открытии
  useEffect(() => {
    if (!open || !id) return
    ;(async () => {
      const l = (await getOne(id)) as StoreLabel
      setForm({
        productName: l.productName ?? "",
        weight: l.weight ?? "",
        composition: (l as any).composition ?? "",
        proteins100g: (l as any).proteins100g ?? "",
        fats100g: (l as any).fats100g ?? "",
        carbs100g: (l as any).carbs100g ?? "",
        standard: (l as any).standard ?? "",
        shelfLife: (l as any).shelfLife ?? "",
        manufacturedAt: fromISO((l as any).manufacturedAt),
        packagedAt: fromISO((l as any).packagedAt),
        expiresAt: fromISO((l as any).expiresAt),
        barcode: (l as any).barcode ?? "",
        folderId: (l as any).folderId ?? "",
      })
    })()
  }, [open, id, getOne])

  useEffect(() => {
    if (open) fetchFolders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((s: any) => ({ ...s, [k]: e.target.value }))

  async function onSave() {
    if (!id) return
    setBusy(true)
    try {
      const payload: any = {
        productName: form.productName || undefined,
        weight: form.weight || undefined,
        composition: form.composition || undefined,
        standard: form.standard || undefined,
        shelfLife: form.shelfLife || undefined,
        manufacturedAt: toISO(form.manufacturedAt),
        packagedAt: toISO(form.packagedAt),
        expiresAt: toISO(form.expiresAt),
        proteins100g: numOrNull(form.proteins100g),
        fats100g: numOrNull(form.fats100g),
        carbs100g: numOrNull(form.carbs100g),
        barcode: form.barcode || undefined,
        barcodeType: "ean13",
        folderId: form.folderId ? Number(form.folderId) : null,
      }
      await update(id, payload)
      onSaved?.()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Редактирование #${id}`} maxWidthClass="max-w-5xl">
      {!id ? (
        <div>Нет выбранной этикетки</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm">Название *</label>
            <input className="border px-3 py-2 rounded w-full" value={form.productName} onChange={set("productName")} />
          </div>

          <div>
            <label className="block text-sm">Масса</label>
            <input className="border px-3 py-2 rounded w-full" value={form.weight} onChange={set("weight")} />
          </div>

          <div>
            <label className="block text-sm">Папка</label>
            <select className="border px-3 py-2 rounded w-full" value={form.folderId} onChange={set("folderId")}>
              <option value="">Без папки</option>
              {folders.map((f: Folder) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm">Состав</label>
            <textarea className="border px-3 py-2 rounded w-full h-24" value={form.composition} onChange={set("composition")} />
          </div>

          <div>
            <label className="block text-sm">Белки (г/100г)</label>
            <input type="number" step="0.1" className="border px-3 py-2 rounded w-full" value={form.proteins100g} onChange={set("proteins100g")} />
          </div>
          <div>
            <label className="block text-sm">Жиры (г/100г)</label>
            <input type="number" step="0.1" className="border px-3 py-2 rounded w-full" value={form.fats100g} onChange={set("fats100g")} />
          </div>
          <div>
            <label className="block text-sm">Углеводы (г/100г)</label>
            <input type="number" step="0.1" className="border px-3 py-2 rounded w-full" value={form.carbs100g} onChange={set("carbs100g")} />
          </div>

          <div>
            <label className="block text-sm">СТБ / ГОСТ</label>
            <input className="border px-3 py-2 rounded w-full" value={form.standard} onChange={set("standard")} />
          </div>
          <div>
            <label className="block text-sm">Срок годности (текст)</label>
            <input className="border px-3 py-2 rounded w-full" value={form.shelfLife} onChange={set("shelfLife")} />
          </div>

          <div>
            <label className="block text-sm">Изготовлено (дата)</label>
            <input type="date" className="border px-3 py-2 rounded w-full" value={form.manufacturedAt} onChange={set("manufacturedAt")} />
          </div>
          <div>
            <label className="block text-sm">Упаковано (дата)</label>
            <input type="date" className="border px-3 py-2 rounded w-full" value={form.packagedAt} onChange={set("packagedAt")} />
          </div>
          <div>
            <label className="block text-sm">Годен до (дата)</label>
            <input type="date" className="border px-3 py-2 rounded w-full" value={form.expiresAt} onChange={set("expiresAt")} />
          </div>

          <div>
            <label className="block text-sm">Штрих-код (EAN-13, пусто = авто)</label>
            <input className="border px-3 py-2 rounded w-full" value={form.barcode} onChange={set("barcode")} />
          </div>

          <div className="col-span-2 flex gap-2 justify-end mt-2">
            <button onClick={onClose} className="px-4 py-2 rounded border bg-white hover:bg-slate-50">
              Отмена
            </button>
            <button
              onClick={onSave}
              disabled={busy}
              className="px-4 py-2 rounded border border-sky-600 bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
