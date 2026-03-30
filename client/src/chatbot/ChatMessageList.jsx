import React, { useEffect, useRef } from 'react';

export default function ChatMessageList({ messages, isLoading, onRequestHandoff, emailDraft, onDismissEmailDraft }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, emailDraft]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#2d7044] text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-xl px-4 py-2 text-sm text-gray-500 rounded-bl-sm">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        </div>
      )}

      {!isLoading && messages.length > 1 && !emailDraft && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onRequestHandoff}
            className="text-xs text-[#2d7044] underline hover:text-[#245a37] transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d7044] focus-visible:ring-offset-1 rounded"
          >
            Hai bisogno di parlare con un operatore?
          </button>
        </div>
      )}

      {emailDraft && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-800">Bozza email di supporto</p>
          <div className="text-xs text-gray-700 space-y-1">
            <p><span className="font-medium">A:</span> {emailDraft.to}</p>
            <p><span className="font-medium">Oggetto:</span> {emailDraft.subject}</p>
            <div className="mt-2 bg-white border border-gray-200 rounded-lg p-2 text-xs whitespace-pre-wrap">
              {emailDraft.body}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => copyToClipboard(`Oggetto: ${emailDraft.subject}\n\n${emailDraft.body}`)}
              className="text-xs px-3 py-1 rounded-md bg-[#2d7044] text-white hover:bg-[#245a37] transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d7044] focus-visible:ring-offset-1"
            >
              Copia
            </button>
            <button
              type="button"
              onClick={onDismissEmailDraft}
              className="text-xs px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
