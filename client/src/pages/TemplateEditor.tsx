import { useEffect, useState } from 'react'
import { errorMessage } from '../api/client'
import { useTemplatesStore } from '../store/templates'
import { getAccountSlug } from '../utils/account'

const btn = 'px-4 py-2 rounded border border-slate-400 bg-white text-black hover:bg-gray-100 disabled:opacity-50'

export default function TemplateEditor() {
  const { templates, loading, error: loadError, fetch, update, makeCurrent } = useTemplatesStore()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [html, setHtml] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void fetch() }, [fetch])

  // по умолчанию открываем текущий шаблон (или первый)
  useEffect(() => {
    if (selectedId !== null || templates.length === 0) return
    const t = templates.find((x) => x.isCurrent) ?? templates[0]
    setSelectedId(t.id)
    setHtml(t.html)
  }, [templates, selectedId])

  const selected = templates.find((t) => t.id === selectedId) ?? null

  const select = (id: number) => {
    setSelectedId(id)
    setHtml(templates.find((t) => t.id === id)?.html ?? '')
    setMessage(null)
    setError(null)
  }

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMessage(null)
    setError(null)
    try {
      await fn()
      setMessage(ok)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const save = () => selected && run(() => update(selected.id, { html }), 'Шаблон сохранён')
  const setCurrent = () => selected && run(() => makeCurrent(selected.id), 'Шаблон назначен текущим')

  // предпросмотр печатает все этикетки аккаунта текущим шаблоном
  const preview = () => {
    const qs = new URLSearchParams({ size: '58x40' })
    const slug = getAccountSlug()
    if (slug) qs.set('account', slug)
    window.open(`/api/print?${qs.toString()}`, '_blank')
  }

  const shownError = error ?? loadError

  return (
    <div className="flex flex-col gap-4 h-full" data-testid="template-editor">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          data-testid="template-select"
          className="border border-slate-400 rounded px-3 py-2 bg-white"
          value={selectedId ?? ''}
          onChange={(e) => select(Number(e.target.value))}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}{t.isCurrent ? ' (текущий)' : ''}</option>
          ))}
        </select>
        <button data-testid="template-save" disabled={!selected} onClick={save} className={btn}>Сохранить</button>
        <button
          data-testid="template-make-current"
          disabled={!selected || selected.isCurrent}
          onClick={setCurrent}
          className={btn}
        >
          Сделать текущим
        </button>
        <button data-testid="template-preview" onClick={preview} className={btn}>Печать предпросмотра</button>
      </div>

      {shownError && <div data-testid="template-error" className="text-rose-600 text-sm">{shownError}</div>}
      {message && <div data-testid="template-message" className="text-emerald-700 text-sm">{message}</div>}
      {!loading && templates.length === 0 && !shownError && (
        <div data-testid="templates-empty" className="text-sm text-slate-700">
          У предприятия нет шаблонов — используется шаблон по умолчанию.
        </div>
      )}

      <textarea
        data-testid="template-html"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        disabled={!selected}
        className="flex-1 min-h-[24rem] border border-slate-400 rounded p-3 font-mono text-sm"
        spellCheck="false"
      />
    </div>
  )
}
