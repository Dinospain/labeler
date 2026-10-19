// client/src/components/PrintModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getAccountSlug } from "../../utils/account";
import { printUrl, type PrintSize } from "./printUrl";

type Props = {
  open: boolean;
  labelId: number | null;
  size?: PrintSize;
  onClose: () => void;
};

export default function PrintModal({
  open,
  labelId,
  size = "58x40",
  onClose,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);

  const src = useMemo(() => {
    if (!open || !labelId) return "";
    return printUrl(labelId, size, getAccountSlug());
  }, [open, labelId, size]);

  useEffect(() => {
    // фокус на iframe после загрузки, чтобы печать сразу уходила на правильный документ
    const ifr = iframeRef.current;
    if (!ifr) return;
    const onLoad = () => {
      try {
        ifr.contentWindow?.focus();
      } catch { /* кросс-доменный фокус может быть запрещён */ }
    };
    ifr.addEventListener("load", onLoad);
    return () => ifr.removeEventListener("load", onLoad);
  }, [src]);

  if (!open || !labelId) return null;

  const handlePrint = () => {
    const w = iframeRef.current?.contentWindow;
    setPrintError(null);
    try {
      w?.focus();
      w?.print();
    } catch {
      setPrintError("Не удалось запустить печать. Скачайте PDF и распечатайте вручную.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="dialog" aria-label="Предпросмотр печати" data-testid="print-dialog">
      <div className="bg-white rounded-2xl shadow-xl w-[92vw] max-w-5xl h-[88vh] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Предпросмотр печати</h2>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              data-testid="print-close"
              className="px-4 py-2 rounded-xl border bg-gray-100 hover:bg-gray-200 text-black"
            >
              Закрыть
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600"
            >
              Печать
            </button>
          </div>
        </div>

        {printError && <div className="text-rose-600 text-sm mb-2" role="alert">{printError}</div>}

        <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50">
          {/* Встраиваем серверный PDF */}
          {src ? (
            <iframe
              ref={iframeRef}
              src={src}
              className="w-full h-full"
              title="PDF preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              Подготовка предпросмотра…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
