import { useState } from 'react'
import Modal from './Modal'

type Props = {
  open: boolean
  title: string
  label: string
  submitText?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

function PromptForm({ label, submitText, onSubmit, onCancel }: Omit<Props, 'open' | 'title'>) {
  const [value, setValue] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim()) onSubmit(value.trim())
      }}
    >
      <label className="block text-sm mb-1">{label}</label>
      <input
        autoFocus
        data-testid="prompt-input"
        className="w-full border rounded-lg px-3 py-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border">Отмена</button>
        <button
          disabled={!value.trim()}
          data-testid="prompt-submit"
          className="px-4 py-2 rounded-lg bg-sky-300 text-black border border-sky-400 hover:bg-sky-400 disabled:opacity-50"
        >
          {submitText}
        </button>
      </div>
    </form>
  )
}

export default function PromptDialog({ open, title, label, submitText = 'Создать', onSubmit, onCancel }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidthClass="max-w-md" testId="prompt-dialog">
      {/* форма монтируется только при открытии → значение сбрасывается между открытиями */}
      <PromptForm label={label} submitText={submitText} onSubmit={onSubmit} onCancel={onCancel} />
    </Modal>
  )
}
