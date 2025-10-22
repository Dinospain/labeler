// client/src/pages/LabelsFourPanels.tsx
import { useEffect, useMemo, useState } from "react"
import { api } from "../api"
import type { Folder, Label } from "../types"
import LabelCreateModal from "../components/LabelCreateModal"
import LabelEditModal from "../components/LabelEditModal"
import PrintModal from "../components/PrintModal"

export default function LabelsFourPanels() {
  const [labels, setLabels] = useState<Label[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [q, setQ] = useState("")
  const [activeFolder, setActiveFolder] = useState<number | "all">("all")
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printId, setPrintId] = useState<number | null>(null)

  // создать папку
  const handleCreateFolder = async () => {
    const name = prompt("Название папки:")
    if (!name) return
    try {
      const f = await api.createFolder(name.trim())
      setFolders((prev) => [...prev, f])
      setActiveFolder(f.id)
    } catch (e: any) {
      alert(e?.message ?? String(e))
    }
  }

  // удалить папку
  const handleDeleteFolder = async () => {
    if (activeFolder === "all") return
    const fid = Number(activeFolder)
    const hasLabels = labels.some((l) => Number(l.folderId) === fid)
    if (hasLabels && !confirm("В папке есть этикетки. Удалить папку?")) return
    try {
      await api.deleteFolder(fid)
      setFolders((prev) => prev.filter((f) => f.id !== fid))
      setLabels((prev) =>
        prev.map((l) => (Number(l.folderId) === fid ? { ...l, folderId: null } : l))
      )
      setActiveFolder("all")
    } catch (e: any) {
      alert(e?.message ?? String(e))
    }
  }

  // загрузка
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
      ; (async () => {
        try {
          const [lf, ff] = await Promise.all([api.getLabels(), api.getFolders()])
          if (!alive) return
          setLabels(Array.isArray(lf) ? lf : [])
          setFolders(Array.isArray(ff) ? ff : [])
        } catch (e: any) {
          if (!alive) return
          setError(e?.message ?? "Не удалось загрузить данные")
          setLabels([])
          setFolders([])
        } finally {
          if (alive) setLoading(false)
        }
      })()
    return () => {
      alive = false
    }
  }, [])

  const selected = labels.find((l) => Number(l.id) === Number(selectedLabelId)) || null

  const visibleLabels = useMemo(() => {
    const byFolder =
      activeFolder === "all"
        ? labels
        : labels.filter((l) => Number(l.folderId ?? -1) === Number(activeFolder))
    const byQuery = q.trim()
      ? byFolder.filter((l) =>
        l.productName.toLowerCase().includes(q.toLowerCase())
      )
      : byFolder
    return byQuery.sort((a, b) => a.productName.localeCompare(b.productName))
  }, [labels, activeFolder, q])

  // CRUD
  const handleCreate = async (payload: Partial<Label>) => {
    const created = await api.createLabel(payload)
    setLabels((prev) => [created, ...prev])
  }

  const handleSave = async (id: number, payload: Partial<Label>) => {
    const updated = await api.updateLabel(id, payload)
    setLabels((prev) => prev.map((l) => (l.id === id ? updated : l)))
  }

  const handleDelete = async () => {
    if (!selectedLabelId) return
    if (!confirm("Удалить этикетку?")) return
    await api.deleteLabel(selectedLabelId)
    setLabels((prev) => prev.filter((l) => l.id !== selectedLabelId))
    setSelectedLabelId(null)
  }

  // Печать — открыть модалку предпросмотра
  const handlePrint = (id?: number) => {
    const singleId = id ?? selectedLabelId
    if (!singleId) {
      alert("Выберите этикетку для печати")
      return
    }
    setPrintId(Number(singleId))
    setPrintOpen(true)
  }

  return (
    <div className="min-h-[70vh] flex flex-col gap-6">
      {/* Верхняя панель */}
      <div className="flex flex-wrap items-center gap-4 bg-white border rounded-2xl p-4 shadow-sm">
        <div className="flex-grow relative">
          <input
            id="desk-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск"
            className="w-full rounded-xl border px-10 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <span className="absolute left-3 top-3 text-slate-400">🔎</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleCreateFolder}
            className="px-4 py-2 rounded-xl bg-sky-300 text-black hover:bg-sky-400 shadow-sm border border-sky-400"
          >
            + Папка
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-300 text-black hover:bg-sky-400 shadow-sm border border-sky-400"
          >
            + Этикетка
          </button>
        </div>
      </div>

      {error && <div className="text-rose-600">{error}</div>}

      {/* Низ: список + папки */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-[60vh]">
        {/* Лист этикеток */}
        <section className="col-span-12 lg:col-span-8 2xl:col-span-9">
          <div className="bg-white border rounded-2xl shadow-sm h-full flex flex-col">
            <div className="p-3 border-b flex items-center gap-2 justify-end">
              <button
                onClick={() => selected && setEditOpen(true)}
                disabled={!selectedLabelId}
                className="px-4 py-2 rounded-xl border bg-white text-black hover:bg-slate-50 disabled:opacity-40"
              >
                Редактировать
              </button>
              <button
                onClick={() => handlePrint()}
                disabled={!selectedLabelId}
                className="px-4 py-2 rounded-xl border bg-white text-black hover:bg-slate-50 disabled:opacity-40"
              >
                Печатать
              </button>
              <button
                onClick={handleDelete}
                disabled={!selectedLabelId}
                className="px-4 py-2 rounded-xl border bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
              >
                Удалить
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {loading ? (
                <div className="h-48 flex items-center justify-center text-slate-500">
                  Загрузка…
                </div>
              ) : visibleLabels.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500">
                  Пусто
                </div>
              ) : (
                <ul className="divide-y">
                  {visibleLabels.map((l) => {
                    const sel = Number(l.id) === Number(selectedLabelId)
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => setSelectedLabelId(sel ? null : Number(l.id))}
                          onDoubleClick={() => handlePrint(Number(l.id))}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 ${sel ? "bg-sky-50 ring-1 ring-sky-200" : ""
                            }`}
                        >
                          <span className="truncate">{l.productName}</span>
                          <span className="text-sm text-slate-500">
                            {l.updatedAt
                              ? new Date(l.updatedAt).toLocaleDateString()
                              : "—"}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Папки */}
        <aside className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="bg-white border rounded-2xl p-3 shadow-sm h-full overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Папки</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{folders.length}</span>
                <button
                  onClick={handleDeleteFolder}
                  disabled={activeFolder === "all" || typeof activeFolder !== "number"}
                  className="px-3 py-1 rounded-lg border bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
                  title="Удалить выбранную папку"
                >
                  Удалить папку
                </button>
              </div>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveFolder("all")
                  setSelectedLabelId(null)
                }}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 ${activeFolder === "all" ? "bg-slate-100 font-medium" : ""
                  }`}
              >
                Все
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setActiveFolder(Number(f.id))
                    setSelectedLabelId(null)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 ${Number(activeFolder) === Number(f.id) ? "bg-slate-100 font-medium" : ""
                    }`}
                >
                  {f.name}
                  {typeof f._count?.labels === "number" ? ` (${f._count.labels})` : ""}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* Модалки */}
      <LabelCreateModal
        open={createOpen}
        folders={folders}
        defaultFolderId={activeFolder === "all" ? null : activeFolder}
        onClose={() => setCreateOpen(false)}
        onCreate={async (payload) => {
          await handleCreate(payload)
          setCreateOpen(false)
        }}
      />
      <LabelEditModal
        open={editOpen}
        folders={folders}
        label={selected}
        onClose={() => setEditOpen(false)}
        onSave={async (id, payload) => {
          await handleSave(id, payload)
          setEditOpen(false)
        }}
      />

      <PrintModal
        open={printOpen}
        labelId={printId}
        size="58x40"
        onClose={() => setPrintOpen(false)}
      />
    </div>
  )
}
