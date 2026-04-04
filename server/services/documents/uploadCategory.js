/**
 * Upload document category resolution and validation (Batch 1).
 * Single source of truth for POST /documents/upload category handling.
 */

const ACCEPTED_CATEGORIES = new Set(['transport', 'ape']);

/**
 * Resolve and validate the `category` multipart field for document upload.
 *
 * @param {string|undefined|null} rawCategory — from `req.body.category`
 * @returns {{ ok: true, category: string } | { ok: false, status: number, body: object }}
 */
function resolveUploadCategory(rawCategory) {
  const category = rawCategory || 'transport';
  if (!ACCEPTED_CATEGORIES.has(category)) {
    return {
      ok: false,
      status: 400,
      body: {
        msg: `Categoria non valida: "${category}". Valori accettati: ${[...ACCEPTED_CATEGORIES].join(', ')}.`,
        error: 'INVALID_CATEGORY',
        accepted: [...ACCEPTED_CATEGORIES],
      },
    };
  }
  return { ok: true, category };
}

module.exports = { ACCEPTED_CATEGORIES, resolveUploadCategory };
