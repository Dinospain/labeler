import { useEffect, useState } from 'react'

export default function TemplateEditor() {
  const [html, setHtml] = useState('')
  const [id, setId] = useState<number | null>(null)

  // загрузка текущего шаблона
  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHtml(data[0].html || '')
          setId(data[0].id)
        }
      })
  }, [])

  // функция сохранения — вот её не хватало
  const save = async () => {
    if (!id) return alert('Нет активного шаблона')
    const res = await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    })
    if (res.ok) {
      alert('Шаблон сохранён ✅')
    } else {
      alert('Ошибка сохранения шаблона')
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-3 items-center">
        <button
          onClick={save}
          className="px-4 py-2 rounded border border-gray-300 bg-white text-black hover:bg-gray-100"
        >
          Сохранить
        </button>
        <button
          onClick={() =>
            window.open('/api/print?all=true&size=58x40', '_blank')
          }
          className="px-4 py-2 rounded border border-gray-300 bg-white text-black hover:bg-gray-100"
        >
          Печать предпросмотра
        </button>
      </div>

      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        className="flex-1 border border-gray-300 rounded p-3 font-mono text-sm"
        spellCheck="false"
      />
    </div>
  )
}
