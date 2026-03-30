import React from 'react';
import ChatMessageList from './ChatMessageList';
import ChatComposer from './ChatComposer';
import FAQChips from './FAQChips';

export default function ChatPanel({
  questionnaireType,
  messages,
  isLoading,
  error,
  emailDraft,
  onSend,
  onFaqSelect,
  onMinimize,
  onClose,
  onRequestHandoff,
  onDismissError,
  onDismissEmailDraft,
}) {
  const showFaqs = messages.length <= 1;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[22rem] sm:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{ maxHeight: 'min(32rem, calc(100vh - 3rem))' }}
      role="dialog"
      aria-label="Assistente GreenVisa"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#2d7044] text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-sm">Assistente GreenVisa</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Riduci a icona"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi assistente"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs flex-shrink-0">
          <span>{error}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Chiudi errore"
            className="ml-2 text-red-500 hover:text-red-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded"
          >
            &times;
          </button>
        </div>
      )}

      {/* Messages */}
      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        onRequestHandoff={onRequestHandoff}
        emailDraft={emailDraft}
        onDismissEmailDraft={onDismissEmailDraft}
      />

      {/* FAQ chips (only shown at start) */}
      {showFaqs && (
        <div className="flex-shrink-0 border-t border-gray-100">
          <FAQChips
            questionnaireType={questionnaireType}
            onSelect={onFaqSelect}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Composer */}
      <div className="flex-shrink-0">
        <ChatComposer onSend={onSend} disabled={isLoading} />
      </div>
    </div>
  );
}
