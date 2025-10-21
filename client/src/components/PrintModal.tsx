import { useEffect, useRef, useState } from "react";
import Modal from "./atoms/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  ids: number[]; // какие этикетки печатаем
  defaultSize?: "100x70" | "58x40";
};

export default function PrintModal({
  open,
  onClose,
  ids,
  defaultSize = "100x70",
}: Props) {
  const [size, setSize] = useState<"100x70" | "58x40">(defaultSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // очистка URL при закрытии
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // загрузка PDF при открытии или смене размера
  useEffect(() => {
    if (!open) return;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }
        const q = new URLSearchParams();
        q.set("ids", ids.join(","));
        q.set("size", size);

        const r = await fetch(`/api/print?${q.toString()}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, size, ids.join(",")]);

  const doPrint = () => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    // Небольшая задержка на рендер PDF во фрейме
    setTimeout(() => {
      w.focus();
      w.print();
    }, 150);
  };

  return (
    <Modal
      fullHeight
      open={open}
      onClose={onClose}
      title="Печать этикетки"
      maxWidthClass="max-w-5xl"
    >
      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm">Размер:</label>
        <select
          className="border rounded px-2 py-1 bg-white"
          value={size}
          onChange={(e) => setSize(e.target.value as "100x70" | "58x40")}
        >
          <option value="100x70">100×70 мм (10×7 см)</option>
          <option value="58x40">58×40 мм</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button
            className="px-3 py-1.5 rounded border bg-white hover:bg-slate-50"
            onClick={() => {
              if (pdfUrl) {
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = `labels_${size}.pdf`;
                a.click();
              }
            }}
            disabled={!pdfUrl || loading}
          >
            Скачать PDF
          </button>
          <button
            className="px-3 py-1.5 rounded border border-sky-600 bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
            onClick={doPrint}
            disabled={!pdfUrl || loading}
          >
            Печать
          </button>
        </div>
      </div>

      {loading && <div className="p-4 text-slate-500">Готовим PDF…</div>}
      {error && <div className="p-4 text-rose-600">Ошибка: {error}</div>}

      <div className="border rounded grow">
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            title="preview"
            src={pdfUrl}
            className="w-full h-full"
          />
        ) : (
          !loading && <div className="p-4 text-slate-500">Нет данных</div>
        )}
      </div>
    </Modal>
  );
}
