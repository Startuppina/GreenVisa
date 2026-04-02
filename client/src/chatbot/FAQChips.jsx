import React from 'react';
import { getFaqs } from './faqContent';

export default function FAQChips({ questionnaireType, onSelect, disabled }) {
  const faqs = getFaqs(questionnaireType);

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
