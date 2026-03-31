const jwt = require('jsonwebtoken');
const { query } = require('./testDb');

const TRANSPORT_CATEGORY = 'Certificazione trasporti';

async function createUserFixture(overrides = {}) {
  const suffix = overrides.suffix || Math.random().toString(36).slice(2, 10);
  const values = {
    username: overrides.username || `User ${suffix}`,
    company_name: overrides.company_name || `Company ${suffix}`,
    email: overrides.email || `user-${suffix}@example.com`,
    administrator: overrides.administrator || false,
    password_digest: overrides.password_digest || null,
    isVerified: overrides.isVerified ?? true,
    first_login: overrides.first_login ?? false,
  };

  const { rows } = await query(
    `INSERT INTO users (username, company_name, email, administrator, password_digest, isVerified, first_login)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      values.username,
      values.company_name,
      values.email,
      values.administrator,
      values.password_digest,
      values.isVerified,
      values.first_login,
    ],
  );

  return rows[0];
}

async function createCertificationFixture({ productOwnerId, category = TRANSPORT_CATEGORY, ...overrides } = {}) {
  const ownerId = productOwnerId || (await createUserFixture()).id;
  const suffix = overrides.suffix || Math.random().toString(36).slice(2, 10);

  const { rows } = await query(
    `INSERT INTO products (user_id, name, price, image, info, cod, category, tag, stripe_product_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      ownerId,
      overrides.name || `Certification ${suffix}`,
      overrides.price || 1,
      overrides.image || 'test.png',
      overrides.info || 'Test certification',
      overrides.cod || `cod-${suffix}`,
      category,
      overrides.tag || 'test',
      overrides.stripe_product_id || null,
    ],
  );

  return rows[0];
}

async function grantCertificationAccess({ userId, certificationId, quantity = 1, price = 1 }) {
  const { rows } = await query(
    `INSERT INTO orders (quantity, price, user_id, product_id, order_date)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [quantity, price, userId, certificationId],
  );

  return rows[0];
}

async function createSurveyResponseFixture({
  userId,
  certificationId,
  pageNo = null,
  surveyData = null,
  totalScore = 0,
  co2emissions = 0,
  completed = false,
} = {}) {
  const { rows } = await query(
    `INSERT INTO survey_responses
      (user_id, certification_id, page_no, survey_data, total_score, co2emissions, completed, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [userId, certificationId, pageNo, surveyData == null ? null : JSON.stringify(surveyData), totalScore, co2emissions, completed],
  );

  return rows[0];
}

async function createDocumentBatchFixture({
  userId,
  buildingId = null,
  category = 'transport',
  status = 'processing',
  fileCount = 1,
} = {}) {
  const { rows } = await query(
    `INSERT INTO document_batches
      (user_id, building_id, category, status, file_count, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [userId, buildingId, category, status, fileCount],
  );

  return rows[0];
}

async function createDocumentFixture({
  batchId,
  userId,
  surveyResponseId = null,
  originalName = 'vehicle.pdf',
  storedName = 'vehicle.pdf',
  storagePath = '/tmp/vehicle.pdf',
  mimeType = 'application/pdf',
  fileSize = 1024,
  sha256 = 'abc123',
  ocrProvider = 'google-document-ai',
  ocrRegion = 'eu',
  ocrStatus = 'confirmed',
} = {}) {
  const { rows } = await query(
    `INSERT INTO documents
      (batch_id, user_id, survey_response_id, original_name, stored_name, storage_path, mime_type,
       file_size, sha256, ocr_provider, ocr_region, ocr_status, uploaded_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
     RETURNING *`,
    [
      batchId,
      userId,
      surveyResponseId,
      originalName,
      storedName,
      storagePath,
      mimeType,
      fileSize,
      sha256,
      ocrProvider,
      ocrRegion,
      ocrStatus,
    ],
  );

  return rows[0];
}

async function createDocumentResultFixture({
  documentId,
  normalizedOutput = null,
  derivedOutput = null,
  reviewPayload = null,
  validationIssues = [],
  confirmedOutput = null,
  rawProviderOutput = {},
} = {}) {
  const { rows } = await query(
    `INSERT INTO document_results
      (document_id, raw_provider_output, normalized_output, derived_output, review_payload, validation_issues, confirmed_output, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [
      documentId,
      JSON.stringify(rawProviderOutput),
      normalizedOutput == null ? null : JSON.stringify(normalizedOutput),
      derivedOutput == null ? null : JSON.stringify(derivedOutput),
      reviewPayload == null ? null : JSON.stringify(reviewPayload),
      JSON.stringify(validationIssues),
      confirmedOutput == null ? null : JSON.stringify(confirmedOutput),
    ],
  );

  return rows[0];
}

async function getSurveyResponse({ userId, certificationId }) {
  const { rows } = await query(
    `SELECT *
     FROM survey_responses
     WHERE user_id = $1 AND certification_id = $2`,
    [userId, certificationId],
  );

  return rows[0] || null;
}

async function getDocumentFixtureById(documentId) {
  const { rows } = await query(
    `SELECT *
     FROM documents
     WHERE id = $1`,
    [documentId],
  );

  return rows[0] || null;
}

async function getDocumentResultFixtureByDocumentId(documentId) {
  const { rows } = await query(
    `SELECT *
     FROM document_results
     WHERE document_id = $1`,
    [documentId],
  );

  return rows[0] || null;
}

async function getDocumentBatchFixtureById(batchId) {
  const { rows } = await query(
    `SELECT *
     FROM document_batches
     WHERE id = $1`,
    [batchId],
  );

  return rows[0] || null;
}

async function countSurveyResponses({ userId, certificationId }) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count
     FROM survey_responses
     WHERE user_id = $1 AND certification_id = $2`,
    [userId, certificationId],
  );

  return rows[0]?.count || 0;
}

function getTransportV2FromRow(row) {
  return row?.survey_data?.transport_v2 || null;
}

function getOcrLinkedVehicle(row, ocrDocumentId) {
  const vehicles = row?.survey_data?.transport_v2?.draft?.vehicles || [];
  return vehicles.find((vehicle) => vehicle?.ocr_document_id === ocrDocumentId) || null;
}

function buildMinimalPdfBuffer() {
  return Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF\n', 'utf8');
}

function buildInvalidTextBuffer() {
  return Buffer.from('not-a-real-pdf', 'utf8');
}

function authCookieForUser(user, overrides = {}) {
  const token = jwt.sign(
    {
      user_id: user.id,
      role: overrides.role || (user.administrator ? 'administrator' : 'user'),
    },
    process.env.SECRET_KEY,
    { expiresIn: overrides.expiresIn || '1h' },
  );

  return [`accessToken=${token}`];
}

function buildTransportV2Meta(certificationId, overrides = {}) {
  return {
    version: 1,
    certification_id: certificationId,
    status: 'draft',
    started_at: '2026-03-30T10:00:00.000Z',
    updated_at: '2026-03-30T10:05:00.000Z',
    submitted_at: null,
    ...overrides,
  };
}

function buildCompleteQuestionnaireFlags(overrides = {}) {
  return {
    compliance_with_vehicle_regulations: true,
    uses_navigator: true,
    uses_class_a_tires: 'some',
    eco_drive_training: 'all',
    interested_in_mobility_manager_course: false,
    interested_in_second_level_certification: true,
    ...overrides,
  };
}

function buildPassengerVehicle(overrides = {}) {
  const base = {
    vehicle_id: 'passenger-1',
    transport_mode: 'passenger',
    ocr_document_id: null,
    fields: {
      registration_year: 2020,
      euro_class: 'EURO_6',
      fuel_type: 'diesel',
      wltp_co2_g_km: 120,
      wltp_co2_g_km_alt_fuel: null,
      goods_vehicle_over_3_5_tons: null,
      occupancy_profile_code: 4,
      load_profile_code: null,
      last_revision_date: '2025-06-01',
      blue_sticker: true,
      annual_km: 10000,
    },
    field_sources: {},
    field_warnings: {},
    row_notes: null,
  };

  return mergeVehicle(base, overrides);
}

function buildGoodsVehicle(overrides = {}) {
  const base = {
    vehicle_id: 'goods-1',
    transport_mode: 'goods',
    ocr_document_id: null,
    fields: {
      registration_year: 2019,
      euro_class: 'EURO_5',
      fuel_type: 'diesel',
      wltp_co2_g_km: 280,
      wltp_co2_g_km_alt_fuel: null,
      goods_vehicle_over_3_5_tons: true,
      occupancy_profile_code: null,
      load_profile_code: 2,
      last_revision_date: '2024-03-15',
      blue_sticker: false,
      annual_km: 20000,
    },
    field_sources: {},
    field_warnings: {},
    row_notes: null,
  };

  return mergeVehicle(base, overrides);
}

function buildCompletePassengerDraft(certificationId, overrides = {}) {
  const vehicle = overrides.vehicle || buildPassengerVehicle(overrides.vehicleOverrides || {});
  return buildTransportV2Draft(certificationId, {
    ...overrides,
    vehicles: Object.prototype.hasOwnProperty.call(overrides, 'vehicles')
      ? overrides.vehicles
      : [vehicle],
  });
}

function buildCompleteGoodsDraft(certificationId, overrides = {}) {
  const vehicle = overrides.vehicle || buildGoodsVehicle(overrides.vehicleOverrides || {});
  return buildTransportV2Draft(certificationId, {
    ...overrides,
    vehicles: Object.prototype.hasOwnProperty.call(overrides, 'vehicles')
      ? overrides.vehicles
      : [vehicle],
  });
}

function buildCompleteMixedDraft(certificationId, overrides = {}) {
  const vehicles =
    overrides.vehicles ||
    [
      buildPassengerVehicle(overrides.passengerVehicleOverrides || {}),
      buildGoodsVehicle(overrides.goodsVehicleOverrides || {}),
    ];

  return buildTransportV2Draft(certificationId, {
    ...overrides,
    vehicles,
  });
}

function buildTransportV2Draft(certificationId, overrides = {}) {
  const questionnaireFlags =
    overrides.questionnaire_flags || buildCompleteQuestionnaireFlags(overrides.questionnaireFlagOverrides || {});
  const vehicles = overrides.vehicles || [];

  return {
    meta: buildTransportV2Meta(certificationId, overrides.metaOverrides || {}),
    draft: {
      questionnaire_flags: questionnaireFlags,
      vehicles,
    },
    derived: overrides.derived || {},
    results: overrides.results || {},
  };
}

function mergeVehicle(base, overrides) {
  const merged = {
    ...base,
    ...overrides,
    fields: {
      ...base.fields,
      ...(overrides.fields || {}),
    },
    field_sources: {
      ...base.field_sources,
      ...(overrides.field_sources || {}),
    },
    field_warnings: {
      ...base.field_warnings,
      ...(overrides.field_warnings || {}),
    },
  };

  if (Object.prototype.hasOwnProperty.call(overrides, 'row_notes')) {
    merged.row_notes = overrides.row_notes;
  }

  return merged;
}

module.exports = {
  TRANSPORT_CATEGORY,
  authCookieForUser,
  buildCompleteGoodsDraft,
  buildCompleteMixedDraft,
  buildCompletePassengerDraft,
  buildCompleteQuestionnaireFlags,
  buildGoodsVehicle,
  buildPassengerVehicle,
  buildTransportV2Draft,
  createDocumentBatchFixture,
  createDocumentFixture,
  createDocumentResultFixture,
  createCertificationFixture,
  createSurveyResponseFixture,
  createUserFixture,
  countSurveyResponses,
  buildInvalidTextBuffer,
  buildMinimalPdfBuffer,
  getDocumentBatchFixtureById,
  getDocumentFixtureById,
  getDocumentResultFixtureByDocumentId,
  getOcrLinkedVehicle,
  getSurveyResponse,
  getTransportV2FromRow,
  grantCertificationAccess,
};
