import { useEffect } from "react"

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidthClass?: string // например, "max-w-4xl"
  testId?: string
}

export default function Modal({ open, onClose, title, children, maxWidthClass = "max-w-3xl", testId }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999]" role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* window */}
      <div className="absolute inset-0 flex items-start md:items-center justify-center p-4 overflow-auto">
        <div className={`w-full ${maxWidthClass} bg-white rounded-2xl shadow-xl border`}>
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button type="button" onClick={onClose} aria-label="Закрыть" className="px-2 py-1 rounded hover:bg-slate-100">✕</button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
