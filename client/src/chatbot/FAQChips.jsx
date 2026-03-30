import React from 'react';

const FAQ_MAP = {
  transport: [
    { key: 'targa', label: 'Dove trovo il numero di targa?' },
    { key: 'euro', label: 'Cosa significa classe Euro?' },
    { key: 'documenti_veicoli', label: 'Quali documenti servono per i veicoli?' },
    { key: 'carburante', label: 'Come inserisco i dati del carburante?' },
  ],
  buildings: [
    { key: 'consumi', label: 'Dove trovo i dati dei consumi energetici?' },
    { key: 'ape', label: "Cos'è un attestato APE?" },
    { key: 'impianti', label: 'Quali informazioni servono sugli impianti?' },
    { key: 'bollette', label: 'Come inserisco i dati delle bollette?' },
  ],
};

export default function FAQChips({ questionnaireType, onSelect, disabled }) {
  const faqs = FAQ_MAP[questionnaireType] || FAQ_MAP.transport;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {faqs.map(faq => (
        <button
          key={faq.key}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(faq.label, faq.key)}
          className="text-sm px-3 py-1.5 rounded-full border border-[#2d7044] text-[#2d7044]
                     hover:bg-[#2d7044] hover:text-white transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d7044] focus-visible:ring-offset-1"
        >
          {faq.label}
        </button>
      ))}
    </div>
  );
}
