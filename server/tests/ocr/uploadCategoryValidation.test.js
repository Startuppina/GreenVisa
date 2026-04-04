/**
 * Batch 1 — Upload category resolution (shared module used by documents route).
 *
 * globals: true in vitest.config.js — describe/it/expect available globally.
 */

import { resolveUploadCategory } from '../../services/documents/uploadCategory.js';

describe('uploadCategory — resolveUploadCategory', () => {
  it('defaults missing category to transport', () => {
    const r = resolveUploadCategory(undefined);
    expect(r.ok).toBe(true);
    expect(r.category).toBe('transport');
  });

  it('accepts explicit transport', () => {
    const r = resolveUploadCategory('transport');
    expect(r.ok).toBe(true);
    expect(r.category).toBe('transport');
  });

  it('accepts explicit ape', () => {
    const r = resolveUploadCategory('ape');
    expect(r.ok).toBe(true);
    expect(r.category).toBe('ape');
  });

  it('rejects unsupported category with structured INVALID_CATEGORY body', () => {
    const r = resolveUploadCategory('invoice');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.body.error).toBe('INVALID_CATEGORY');
    expect(r.body.accepted).toHaveLength(2);
    expect(r.body.accepted).toContain('transport');
    expect(r.body.accepted).toContain('ape');
    expect(r.body.msg).toContain('invoice');
  });

  it('does not silently fall back to transport for unknown categories', () => {
    const r = resolveUploadCategory('unknown-future-category');
    expect(r.ok).toBe(false);
    expect(r.body.error).toBe('INVALID_CATEGORY');
  });

  it('treats empty string as transport (falsy → default)', () => {
    const r = resolveUploadCategory('');
    expect(r.ok).toBe(true);
    expect(r.category).toBe('transport');
  });
});
