import { useMemo, useState } from 'react'
import { errorMessage } from '../api/client'
import type { LabelPayload } from '../types'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import PromptDialog from '../components/PromptDialog'
import LabelForm from '../features/labels/LabelForm'
import LabelList from '../features/labels/LabelList'
import { emptyLabelForm, fromLabel } from '../features/labels/labelForm'
import { filterLabels, withLabelCounts, type FolderFilter } from '../features/labels/labelList'
import { useLabels } from '../features/labels/useLabels'
import FolderPanel from '../features/folders/FolderPanel'
import { useFolders } from '../features/folders/useFolders'
import PrintModal from '../features/print/PrintModal'

type Dialog = 'create' | 'edit' | 'folder' | 'deleteLabel' | 'deleteFolder' | null

export default function LabelsPage() {
  const L = useLabels()
  const F = useFolders()
  const [q, setQ] = useState('')
  const [activeFolder, setActiveFolder] = useState<FolderFilter>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [printId, setPrintId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const folders = useMemo(() => withLabelCounts(F.folders, L.labels), [F.folders, L.labels])
  const visible = useMemo(() => filterLabels(L.labels, activeFolder, q), [L.labels, activeFolder, q])
  const selected = L.labels.find((l) => l.id === selectedId) ?? null
  const error = actionError ?? L.error ?? F.error

  const close = () => setDialog(null)

  // единый обработчик ошибок действий (B17)
  const run = async (fn: () => Promise<void>) => {
    setActionError(null)
    try {
      await fn()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  const selectFolder = (f: FolderFilter) => {
    setActiveFolder(f)
    setSelectedId(null)
  }

  const createFolder = (name: string) => {
    close()
    return run(async () => {
      const f = await F.create(name)
      selectFolder(f.id)
    })
  }

  const deleteFolder = () => {
    close()
    if (activeFolder === 'all') return
    const id = activeFolder
    return run(async () => {
      await F.remove(id)
      L.detachFolder(id)
      selectFolder('all')
    })
  }

  const deleteLabel = () => {
    close()
    if (selectedId === null) return
    const id = selectedId
    return run(async () => {
      await L.remove(id)
      setSelectedId(null)
    })
  }

  const requestDeleteFolder = () => {
    if (activeFolder === 'all') return
    const hasLabels = L.labels.some((l) => l.folderId === activeFolder)
    if (hasLabels) setDialog('deleteFolder')
    else void deleteFolder()
  }

  const saveCreate = async (payload: LabelPayload) => {
    await L.create(payload)
    close()
  }

  const saveEdit = async (payload: LabelPayload) => {
    if (!selected) return
    await L.update(selected.id, payload)
    close()
  }

  const btn = 'px-4 py-2 rounded-xl border bg-white text-black hover:bg-slate-50 disabled:opacity-40'

  return (
    <div className="min-h-[70vh] flex flex-col gap-6">
      {/* Верхняя панель */}
      <div className="flex flex-wrap items-center gap-4 bg-white border rounded-2xl p-4 shadow-sm">
        <div className="flex-grow relative">
          <input
            id="desk-search"
            data-testid="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск"
            className="w-full rounded-xl border px-10 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <span className="absolute left-3 top-3 text-slate-600">🔎</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setDialog('folder')}
            data-testid="new-folder"
            className="px-4 py-2 rounded-xl bg-sky-300 text-black hover:bg-sky-400 shadow-sm border border-sky-400"
          >
            + Папка
          </button>
          <button
            onClick={() => setDialog('create')}
            data-testid="new-label"
            className="px-4 py-2 rounded-xl text-white !bg-indigo-600 hover:!bg-indigo-700 shadow-sm border border-sky-400"
          >
            + Этикетка
          </button>
        </div>
      </div>

      {error && <div className="text-rose-600" role="alert" data-testid="page-error">{error}</div>}

      {/* Низ: список + папки */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-[60vh]">
        <section className="col-span-12 lg:col-span-8 2xl:col-span-9">
          <div className="bg-white border rounded-2xl shadow-sm h-full flex flex-col">
            <div className="p-3 border-b flex items-center gap-2 justify-end">
              <button onClick={() => setDialog('edit')} disabled={!selected} data-testid="edit-label" className={btn}>
                Редактировать
              </button>
              <button onClick={() => setPrintId(selectedId)} disabled={selectedId === null} data-testid="print-label" className={btn}>
                Печатать
              </button>
              <button
                onClick={() => setDialog('deleteLabel')}
                disabled={selectedId === null}
                data-testid="delete-label"
                className="px-4 py-2 rounded-xl border !bg-rose-600 text-white hover:!bg-rose-700 disabled:opacity-40"
              >
                Удалить
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <LabelList
                labels={visible}
                loading={L.loading}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpen={setPrintId}
              />
            </div>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <FolderPanel folders={folders} active={activeFolder} onSelect={selectFolder} onDelete={requestDeleteFolder} />
        </aside>
      </div>

      {/* Диалоги. Формы монтируются только при открытии (Modal возвращает null) → состояние сбрасывается */}
      <Modal open={dialog === 'create'} onClose={close} title="Новая этикетка" maxWidthClass="max-w-2xl" testId="create-dialog">
        <LabelForm
          initial={emptyLabelForm(activeFolder === 'all' ? null : activeFolder)}
          folders={folders}
          submitText="Создать"
          onSubmit={saveCreate}
          onCancel={close}
        />
      </Modal>
      <Modal open={dialog === 'edit' && !!selected} onClose={close} title="Редактировать этикетку" maxWidthClass="max-w-2xl" testId="edit-dialog">
        {selected && (
          <LabelForm initial={fromLabel(selected)} folders={folders} submitText="Сохранить" onSubmit={saveEdit} onCancel={close} />
        )}
      </Modal>
      <PromptDialog
        open={dialog === 'folder'}
        title="Новая папка"
        label="Название папки"
        onSubmit={createFolder}
        onCancel={close}
      />
      <ConfirmDialog
        open={dialog === 'deleteLabel'}
        title="Удалить этикетку?"
        message={selected ? `Этикетка «${selected.productName}» будет удалена.` : ''}
        onConfirm={deleteLabel}
        onCancel={close}
      />
      <ConfirmDialog
        open={dialog === 'deleteFolder'}
        title="Удалить папку?"
        message="В папке есть этикетки. Они останутся без папки."
        onConfirm={deleteFolder}
        onCancel={close}
      />
      <PrintModal open={printId !== null} labelId={printId} size="58x40" onClose={() => setPrintId(null)} />
    </div>
  )
}
