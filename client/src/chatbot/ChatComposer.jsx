import React, { useState, useRef } from 'react';

export default function ChatComposer({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 96) + 'px';
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-gray-200 bg-white">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled}
        placeholder="Scrivi la tua domanda..."
        rows={1}
        aria-label="Messaggio"
        className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d7044]
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        aria-label="Invia messaggio"
        className="flex-shrink-0 w-9 h-9 rounded-full bg-[#2d7044] text-white flex items-center justify-center
                   hover:bg-[#245a37] transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d7044] focus-visible:ring-offset-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M3.105 2.29a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.084L2.28 16.76a.75.75 0 00.826.95l15.202-7.204a.75.75 0 000-1.012L3.105 2.289z" />
        </svg>
      </button>
    </div>
  );
}
