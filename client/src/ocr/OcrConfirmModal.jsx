import React from 'react';

export default function OcrConfirmModal({ open, onAccept, onCancel, error, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="w-[520px] max-w-[92vw] bg-white rounded-lg shadow-xl p-6 animate-fadeIn animate-scaleUp">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Conferma dati estratti</h3>

        <div className="text-gray-600 space-y-3 mb-6 leading-relaxed">
          <p>
            Stai per confermare i dati estratti automaticamente dal documento.
          </p>
          <p>
            Ti ricordiamo gentilmente che l'estrazione automatica è uno strumento di{' '}
            <strong>assistenza</strong>: i risultati potrebbero contenere imprecisioni, soprattutto
            nei campi segnalati con bassa confidenza.
          </p>
          <p>
            Per favore, assicurati di aver verificato attentamente tutti i campi prima di
            procedere. Il tuo contributo è fondamentale per garantire la qualità dei dati.
          </p>
          <p className="text-sm text-gray-500 italic">
            La responsabilità finale dei dati confermati resta in capo all'utente.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4 font-medium">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 p-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium
              border-2 border-transparent hover:border-gray-300 transition-colors duration-300
              disabled:opacity-50"
          >
            Torna indietro
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 p-2.5 bg-[#2d7044] text-white rounded-lg font-medium
              border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300
              ease-in-out hover:bg-white hover:text-[#2d7044]
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Invio in corso…' : 'Confermo, ho verificato'}
          </button>
        </div>
      </div>
    </div>
  );
}
