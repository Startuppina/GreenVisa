import React, { useEffect } from 'react';
import ChatLauncher from './ChatLauncher';
import ChatPanel from './ChatPanel';
import useChatWidget from './useChatWidget';

export default function ChatWidget({ questionnaireType, certificationId, buildingId }) {
  const {
    isOpen,
    isMinimized,
    messages,
    isLoading,
    error,
    emailDraft,
    open,
    close,
    minimize,
    sendMessage,
    requestHandoff,
    dismissError,
    dismissEmailDraft,
  } = useChatWidget({ questionnaireType, certificationId, buildingId });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        minimize();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, minimize]);

  if (isOpen) {
    return (
      <ChatPanel
        questionnaireType={questionnaireType}
        messages={messages}
        isLoading={isLoading}
        error={error}
        emailDraft={emailDraft}
        onSend={(text) => sendMessage(text)}
        onFaqSelect={(label, key) => sendMessage(label, key)}
        onMinimize={minimize}
        onClose={close}
        onRequestHandoff={requestHandoff}
        onDismissError={dismissError}
        onDismissEmailDraft={dismissEmailDraft}
      />
    );
  }

  return <ChatLauncher onClick={open} />;
}
