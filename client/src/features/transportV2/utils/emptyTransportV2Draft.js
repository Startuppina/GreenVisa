export default function createEmptyTransportV2Draft(certificationId = null) {
  return {
    meta: {
      version: 1,
      certification_id: certificationId ? Number(certificationId) : null,
      status: 'draft',
      started_at: null,
      updated_at: null,
      submitted_at: null,
    },
    draft: {
      questionnaire_flags: {},
      vehicles: [],
    },
    derived: {},
    results: {},
  };
}
