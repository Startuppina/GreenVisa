import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

import TransportV2Page from '../../src/transportV2/TransportV2Page.jsx';

export function renderTransportV2Page({
  route = '/transport-v2/123',
  path = '/transport-v2/:certificationId',
} = {}) {
  return render(
    <RecoveryContextProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={<TransportV2Page />} />
        </Routes>
      </MemoryRouter>
    </RecoveryContextProvider>,
  );
}
