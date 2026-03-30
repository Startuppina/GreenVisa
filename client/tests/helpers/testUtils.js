import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

export async function advanceAutosaveTimers(ms = 800) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  await flushPromises();
}

export function createUser() {
  return userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
  });
}
