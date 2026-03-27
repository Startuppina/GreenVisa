import { useState } from "react";

const CdcScannerModal = ({ isOpen, isLoading, error, onClose, onConfirm }) => {
  const [file, setFile] = useState(null);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (!file) {
      return;
    }
    onConfirm(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Carica CDC</h3>
        <p className="mt-1 text-sm text-slate-600">
          Seleziona la carta di circolazione in formato PDF da caricare ed
          elaborare.
        </p>

        <div className="mt-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-700"
          />
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Chiudi
          </button>
          <button
            type="button"
            disabled={!file || isLoading}
            onClick={handleConfirm}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isLoading ? "Scansione..." : "Invia PDF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CdcScannerModal;
