import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import { RecoveryContextProvider } from '../../src/provider/provider.jsx';

vi.mock('../../src/components/navbar', () => ({
  default: function MockNavbar() {
    return <div data-testid="navbar" />;
  },
}));

vi.mock('../../src/components/footer', () => ({
  default: function MockFooter() {
    return <div data-testid="footer" />;
  },
}));

vi.mock('../../src/components/scrollToTop.jsx', () => ({
  default: function MockScrollToTop() {
    return null;
  },
}));

vi.mock('../../src/chatbot/ChatWidget.jsx', () => ({
  default: function MockChatWidget() {
    return <div data-testid="chat-widget" />;
  },
}));

import TransportV2Page from '../../src/pages/TransportV2Page.jsx';

export function renderTransportV2Page({
  route = '/transport-v2/123',
  path = '/transport-v2/:certificationId',
} = {}) {
  const router = createMemoryRouter(
    [
      {
        path,
        element: <TransportV2Page />,
      },
    ],
    {
      initialEntries: [route],
    },
  );

  return render(
    <RecoveryContextProvider>
      <RouterProvider router={router} />
    </RecoveryContextProvider>,
  );
}
