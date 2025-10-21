import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidthClass?: string; // например, "max-w-4xl"
  fullHeight?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = "max-w-3xl",
  fullHeight = false,
}: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 flex justify-center items-center p-2">
      <div className="absolute inset-0 bg-black/40 z-[-1]" onClick={onClose} />

      <div
        className={`w-full ${maxWidthClass} bg-white rounded-2xl shadow-xl border flex flex-col ${
          fullHeight ? "h-full max-h-full" : "max-h-[95vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col p-4 overflow-y-auto grow">{children}</div>
      </div>
    </div>
  );
}
