import '@testing-library/jest-dom/vitest';
import axios from 'axios';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

vi.stubEnv('VITE_REACT_SERVER_ADDRESS', 'http://localhost:4173');
axios.defaults.adapter = 'fetch';

beforeAll(() => {
  window.scrollTo = vi.fn();
  server.listen({
    onUnhandledRequest(request) {
      throw new Error(`Unhandled ${request.method} request to ${request.url}`);
    },
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  server.resetHandlers();
  vi.clearAllMocks();
  vi.useRealTimers();
});

afterAll(() => {
  server.close();
});
