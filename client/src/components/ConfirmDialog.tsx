import Modal from './Modal'

type Props = {
  open: boolean
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, message, confirmText = 'Удалить', onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidthClass="max-w-md" testId="confirm-dialog">
      <p className="mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} data-testid="confirm-cancel" className="px-4 py-2 rounded-lg border">
          Отмена
        </button>
        <button
          type="button"
          onClick={onConfirm}
          data-testid="confirm-ok"
          className="px-4 py-2 rounded-lg border !bg-rose-600 text-white hover:!bg-rose-700"
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}
