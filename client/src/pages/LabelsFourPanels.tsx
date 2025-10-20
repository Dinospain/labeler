import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLabels, type Label as StoreLabel } from "../store/labels"
import { useFolders, type Folder as StoreFolder } from "../store/folders"
import LabelEditorModal from "../components/LabelEditorModal"
import LabelCreateModal from "../components/LabelCreateModal"
import PrintModal from "../components/PrintModal"

type LabelVM = { id: number; name: string; updatedAt?: string | null; folderId?: number | null }

export default function LabelsFourPanels() {
  const nav = useNavigate()
  const searchRef = useRef<HTMLInputElement | null>(null)

  const { items: labels, fetch: fetchLabels, remove: removeLabel, create: createLabel, update: updateLabel } = useLabels()
  const { items: folders, fetch: fetchFolders, create: createFolder, remove: deleteFolder } = useFolders()

  const [q, setQ] = useState("")
  const [activeFolder, setActiveFolder] = useState<number | "all">("all")
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [editId, setEditId] = useState<number | null>(null) // ← модалка
  const [createOpen, setCreateOpen] = useState(false)  
  const [printOpen, setPrintOpen] = useState(false)

  useEffect(() => {
    fetchLabels()
    fetchFolders()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const labelVMs = useMemo<LabelVM[]>(() => {
    return labels.map((l: StoreLabel) => ({
      id: l.id,
      name: l.productName,
      updatedAt: (l as any).updatedAt ?? null,
      folderId: (l as any).folderId ?? null,
    }))
  }, [labels])

  const folderCounts = useMemo(() => {
    const map = new Map<number, number>()
    for (const l of labelVMs) if (l.folderId != null) map.set(l.folderId, (map.get(l.folderId) ?? 0) + 1)
    return map
  }, [labelVMs])
  type FolderTab = { id: number | "all"; name: string; count?: number }
  const foldersWithAll: FolderTab[] = useMemo(() => {
    return [
      { id: "all", name: "Все", count: labelVMs.length },
      ...folders.map((f: StoreFolder) => ({
        id: f.id,
        name: f.name,
        count: (f as any)._count?.labels ?? folderCounts.get(f.id) ?? 0,
      })),
    ]
  }, [folders, labelVMs.length, folderCounts])

  const visibleLabels = useMemo(() => {
    const base = activeFolder === "all" ? labelVMs : labelVMs.filter((l) => l.folderId === activeFolder)
    const byQuery = q.trim() ? base.filter((l) => l.name.toLowerCase().includes(q.toLowerCase())) : base
    return byQuery.sort((a, b) => a.name.localeCompare(b.name))
  }, [labelVMs, activeFolder, q])

    function handleCreateLabel() {
    setCreateOpen(true)
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim() || prompt("Название папки:") || ""
    if (!name) return
    await createFolder(name)
    setNewFolderName("")
  }

  async function handleRename() {
    if (!selectedLabelId) return
    const current = labelVMs.find((l) => l.id === selectedLabelId)
    const name = prompt("Переименовать:", current?.name ?? "")
    if (!name) return
    await updateLabel(selectedLabelId, { productName: name })
    fetchLabels()
  }

  function handleOpenEditModal() {
    if (!selectedLabelId) return
    setEditId(selectedLabelId)
  }

  function handlePrint() {
    if (!selectedLabelId) return
    setPrintOpen(true)
  }

  async function handleDelete() {
    if (!selectedLabelId) return
    if (!confirm("Удалить выбранную этикетку?")) return
    await removeLabel(selectedLabelId)
    setSelectedLabelId(null)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="w-full px-6 py-4">
          <h1 className="text-2xl font-bold">Этикетки — рабочий стол</h1>
        </div>
      </header>

      <div className="w-full px-6 py-6 flex flex-col gap-6 min-h-[80vh]">
        {/* Верхняя панель */}
        <div className="flex flex-wrap items-center gap-4 bg-white border rounded-2xl p-4 shadow-sm w-full">
          <div className="flex-grow relative">
            <input
              ref={searchRef}
              id="desk-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск (нажми /)"
              className="w-full rounded-xl border px-10 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="absolute left-3 top-3 text-slate-400">🔎</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <input
              placeholder="Новая папка"
              className="border bg-white px-3 py-2 rounded-xl"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button onClick={handleCreateFolder} className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-black shadow-sm">
              + Папка
            </button>
          <button onClick={handleCreateLabel} className="px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 shadow-sm">              + Этикетка
            </button>
          </div>
        </div>

        {/* Основная область */}
        <div className="grid grid-cols-12 gap-4 flex-1 min-h-[60vh] w-full">
          {/* Список этикеток */}
          <section className="col-span-12 lg:col-span-8 2xl:col-span-9">
            <div className="bg-white border rounded-2xl shadow-sm h-full flex flex-col">
              <div className="p-3 border-b flex items-center gap-2 justify-end">
                <ActionButton label="Открыть" onClick={handleOpenEditModal} disabled={!selectedLabelId} />
                <ActionButton label="Переименовать" onClick={handleRename} disabled={!selectedLabelId} />
                <ActionButton label="Печатать" onClick={handlePrint} disabled={!selectedLabelId} />
                <ActionButton label="Удалить" onClick={handleDelete} disabled={!selectedLabelId} variant="danger" />
              </div>
              <div className="flex-1 overflow-auto p-2">
                {visibleLabels.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-500">Ничего не найдено</div>
                ) : (
                  <ul className="divide-y">
                    {visibleLabels.map((l) => {
                      const selected = l.id === selectedLabelId
                      return (
                        <li key={l.id}>
                          <button
                            onDoubleClick={() => setEditId(l.id)}  // двойной клик сразу открывает редактор
                            onClick={() => setSelectedLabelId(selected ? null : l.id)}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 ${
                              selected ? "bg-sky-50 ring-1 ring-sky-200" : ""
                            }`}
                          >
                            <span className="truncate">{l.name}</span>
                            <span className="text-sm text-slate-500">{l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : "—"}</span>
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
                <span className="text-xs text-slate-500">{foldersWithAll.length}</span>
              </div>
              <nav className="space-y-1">
                {foldersWithAll.map((f) => (
                  <button
                    key={`${f.id}`}
                    onClick={() => {
                      setActiveFolder(f.id)
                      setSelectedLabelId(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 ${
                      activeFolder === f.id ? "bg-slate-100 font-medium" : ""
                    }`}
                  >
                    {f.name}
                    {typeof f.count === "number" ? ` (${f.count})` : ""}
                  </button>
                ))}
              </nav>

              {activeFolder !== "all" && typeof activeFolder === "number" && (
                <div className="mt-3">
                  <button
                    className="text-black border border-red-300 bg-white hover:bg-red-50 px-3 py-1 rounded w-full"
                    onClick={() => deleteFolder(Number(activeFolder))}
                  >
                    Удалить папку
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Модальное окно редактора */}
      <LabelEditorModal
        id={editId}
        open={editId != null}
        onClose={() => setEditId(null)}
        onSaved={() => {
          fetchLabels()
        }}
      />
      {/* Модальное окно печати */}
      <PrintModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        ids={selectedLabelId ? [selectedLabelId] : []}
        defaultSize="100x70"
      />
       {/* Модальное окно создания */}
      <LabelCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        presetFolderId={activeFolder === "all" ? null : Number(activeFolder)}
        onCreated={(id) => {
          setSelectedLabelId(id)
          setEditId(id)       // хотим сразу открыть в редакторе? можно убрать эту строку
          fetchLabels()
        }}
      />
    </div>
  )
}
     
function ActionButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: "danger" | "default"
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl border shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${
        variant === "danger" ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600" : "bg-white hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  )
}
