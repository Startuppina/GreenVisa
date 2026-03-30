'use strict';

/**
 * transportV2Validator.js
 *
 * Accetta in input:
 * - l'oggetto puro transport_v2
 *   oppure
 * - un wrapper { transport_v2: { ... } }
 *
 * Restituisce:
 * {
 *   valid: boolean,
 *   errors: Array<{ field, code, message }>,
 *   normalizedData: Object
 * }
 *
 * Uso:
 * const {
 *   validateTransportV2Draft,
 *   validateTransportV2Submit,
 * } = require('./transportV2Validator');
 *
 * const draftResult = validateTransportV2Draft(req.body.transport_v2 || req.body);
 * const submitResult = validateTransportV2Submit(req.body.transport_v2 || req.body);
 */

const CURRENT_YEAR = new Date().getFullYear();

const ENTRY_MODES = new Set(['form', 'chatbot']);
const QUESTIONNAIRE_STATUS = new Set(['draft', 'submitted']);
const ORIGINE_RIGA = new Set(['manuale', 'ocr', 'chatbot', 'mista']);
const STATO_REVISIONE = new Set(['needs_review', 'reviewed', 'confirmed']);

const PNEUMATICI_CLASSI = new Set(['tutti', 'nessuno', 'non_tutti']);
const FORMAZIONE_ECO_DRIVE = new Set(['tutti', 'nessuno', 'non_tutti']);

const TIPOLOGIA_MEZZO = new Set([
  'bus',
  'minibus',
  'car',
  'convertible',
  'scooter',
  'motorcycle',
  'goods_van',
  'goods_truck',
]);

const TIPI_PASSEGGERI = new Set([
  'bus',
  'minibus',
  'car',
  'convertible',
  'scooter',
  'motorcycle',
]);

const TIPI_MERCI = new Set([
  'goods_van',
  'goods_truck',
]);

const CLASSI_EURO = new Set([
  'EURO_1',
  'EURO_2',
  'EURO_3',
  'EURO_4',
  'EURO_5',
  'EURO_6',
  'EURO_6b',
  'EURO_6c',
  'EURO_6d',
  'EURO_6d_temp',
  'EURO_6e',
]);

const TIPI_CARBURANTE = new Set([
  'benzina',
  'diesel',
  'gpl',
  'metano',
  'metano_monovalente',
  'mild_hybrid',
  'full_hybrid',
  'plug_in_hybrid',
  'elettrico',
]);

const CARBURANTI_DUAL_FUEL = new Set(['gpl', 'metano']);

const PESO_MERCI_CLASSI = new Set([
  'sotto_3_5_tonnellate',
  'uguale_o_superiore_3_5_tonnellate',
]);

const PROFILI_PASSEGGERI = new Set([1, 2, 3, 4, 5, 6]);
const PROFILI_MERCI = new Set([1, 2, 3, 4, 5, 6]);

const PROFILO_PASSEGGERI_LABELS = {
  1: 'per_2_terzi_del_tempo_una_persona_a_bordo',
  2: 'per_il_50_percento_una_persona_a_bordo',
  3: 'oltre_2_terzi_del_tempo_almeno_2_persone',
  4: 'oltre_il_50_percento_almeno_2_persone',
  5: 'oltre_2_terzi_del_tempo_almeno_3_persone',
  6: 'oltre_il_50_percento_almeno_3_persone',
};

const PROFILO_MERCI_LABELS = {
  1: 'meno_del_10_percento_km_basso_carico',
  2: '10_30_percento_km_basso_carico',
  3: '30_50_percento_km_carico_medio',
  4: '50_60_percento_km_carico_medio_alto',
  5: '60_80_percento_km_alto_carico',
  6: 'almeno_80_percento_km_alto_carico',
};

const WARNING_CODES = new Set([
  'missing',
  'low_confidence',
  'ocr_not_found',
  'manual_check_required',
]);

const BLOCK2_REQUIRED_QUESTIONNAIRE_FLAGS = [
  'compliance_with_vehicle_regulations',
  'uses_navigator',
  'uses_class_a_tires',
  'eco_drive_training',
  'interested_in_mobility_manager_course',
  'interested_in_second_level_certification',
];

const SORGENTE_CAMPI_ALLOWED = {
  anno_immatricolazione: new Set(['manuale', 'ocr']),
  classe_euro: new Set(['manuale', 'ocr']),
  tipo_carburante: new Set(['manuale', 'ocr']),
  co2_wltp_g_km: new Set(['manuale']),
  co2_wltp_g_km_secondo_carburante: new Set(['manuale']),
  peso_merci_classe: new Set(['manuale', 'ocr']),
};

function validateTransportV2Draft(payload) {
  return runTransportV2Validation(payload, { mode: 'draft' });
}

function validateTransportV2Submit(payload) {
  return runTransportV2Validation(payload, { mode: 'submit' });
}

function validateTransportV2Block1DraftPayload(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return {
      valid: false,
      errors: [
        {
          field: 'body',
          code: 'invalid_type',
          message: 'Il body della richiesta deve essere un oggetto.',
        },
      ],
      normalizedData: null,
    };
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'meta')) {
    addError(errors, 'meta', 'forbidden', 'Il client non puo inviare il blocco meta.');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'derived')) {
    addError(errors, 'derived', 'forbidden', 'Il client non puo inviare il blocco derived.');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'results')) {
    addError(errors, 'results', 'forbidden', 'Il client non puo inviare il blocco results.');
  }

  const normalizedData = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'entry_mode')) {
    const entryMode = payload.entry_mode;

    if (isNil(entryMode)) {
      normalizedData.entry_mode = null;
    } else if (typeof entryMode === 'string') {
      const trimmedEntryMode = entryMode.trim();
      if (!trimmedEntryMode) {
        normalizedData.entry_mode = null;
      } else if (!ENTRY_MODES.has(trimmedEntryMode)) {
        addError(
          errors,
          'entry_mode',
          'invalid_enum',
          'entry_mode deve essere uno tra form, chatbot o null.',
        );
      } else {
        normalizedData.entry_mode = trimmedEntryMode;
      }
    } else {
      addError(
        errors,
        'entry_mode',
        'invalid_type',
        'entry_mode deve essere una stringa oppure null.',
      );
    }
  }

  if (!Object.prototype.hasOwnProperty.call(payload, 'draft')) {
    addError(errors, 'draft', 'required', 'Il blocco draft e obbligatorio.');
  } else if (!isPlainObject(payload.draft)) {
    addError(errors, 'draft', 'invalid_type', 'Il blocco draft deve essere un oggetto.');
  } else {
    const normalizedDraft = {};

    if (isNil(payload.draft.questionnaire_flags)) {
      normalizedDraft.questionnaire_flags = {};
    } else if (!isPlainObject(payload.draft.questionnaire_flags)) {
      addError(
        errors,
        'draft.questionnaire_flags',
        'invalid_type',
        'draft.questionnaire_flags deve essere un oggetto.',
      );
    } else {
      normalizedDraft.questionnaire_flags = deepNormalize(payload.draft.questionnaire_flags);
    }

    if (isNil(payload.draft.vehicles)) {
      normalizedDraft.vehicles = [];
    } else if (!Array.isArray(payload.draft.vehicles)) {
      addError(errors, 'draft.vehicles', 'invalid_type', 'draft.vehicles deve essere un array.');
    } else {
      normalizedDraft.vehicles = payload.draft.vehicles.map((vehicle, index) =>
        normalizeBlock1Vehicle(vehicle, index, errors),
      );
    }

    normalizedData.draft = normalizedDraft;
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedData: errors.length === 0 ? normalizedData : null,
  };
}

function validateTransportV2Block2SubmitPayload(payload) {
  const errors = [];
  const transportV2 = unwrapTransportV2Input(payload);

  if (!isPlainObject(transportV2)) {
    return {
      valid: false,
      errors: [
        {
          field: 'transport_v2',
          code: 'invalid_type',
          message: 'Il payload transport_v2 deve essere un oggetto.',
        },
      ],
      normalizedData: null,
    };
  }

  const normalizedData = deepNormalize(transportV2);

  if (!isPlainObject(normalizedData.draft)) {
    addError(errors, 'draft', 'required', 'Il blocco draft e obbligatorio.');
  } else {
    validateBlock2QuestionnaireFlags(normalizedData.draft.questionnaire_flags, errors);
    validateBlock2Vehicles(normalizedData.draft.vehicles, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedData: errors.length === 0 ? normalizedData : null,
  };
}

function runTransportV2Validation(payload, { mode }) {
  const errors = [];
  const unwrapped = unwrapTransportV2Input(payload);

  if (!isPlainObject(unwrapped)) {
    return {
      valid: false,
      errors: [
        {
          field: 'transport_v2',
          code: 'invalid_type',
          message: 'Il payload transport_v2 deve essere un oggetto.',
        },
      ],
      normalizedData: null,
    };
  }

  const data = deepNormalize(unwrapped);

  // Metadati
  validateMeta(data, errors, mode);

  // Questionario
  validateQuestionario(data, errors, mode);

  // Veicoli
  validateVeicoli(data, errors, mode);

  // Derived/results non vengono validati qui: sono di competenza backend al submit.
  // Per compatibilità non li rimuoviamo, ma non ci affidiamo mai ai loro valori in input.

  // Normalizzazioni finali submit
  if (mode === 'submit' && isPlainObject(data.meta)) {
    data.meta.stato_questionario = 'submitted';
    if (!data.meta.submitted_at) {
      data.meta.submitted_at = new Date().toISOString();
    }
    if (!data.meta.updated_at) {
      data.meta.updated_at = new Date().toISOString();
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedData: data,
  };
}

function validateMeta(data, errors, mode) {
  const field = 'meta';

  if (!isPlainObject(data.meta)) {
    addError(errors, field, 'required', 'Il blocco meta è obbligatorio e deve essere un oggetto.');
    return;
  }

  const meta = data.meta;

  coerceInteger(meta, 'versione_schema', `${field}.versione_schema`, errors, {
    required: true,
    min: 1,
  });

  coerceInteger(meta, 'certification_id', `${field}.certification_id`, errors, {
    required: true,
    min: 1,
  });

  coerceEnum(meta, 'entry_mode', `${field}.entry_mode`, errors, ENTRY_MODES, {
    required: true,
  });

  if (mode === 'draft' && isNil(meta.stato_questionario)) {
    meta.stato_questionario = 'draft';
  }

  coerceEnum(meta, 'stato_questionario', `${field}.stato_questionario`, errors, QUESTIONNAIRE_STATUS, {
    required: true,
  });

  validateDateTimeString(meta, 'started_at', `${field}.started_at`, errors, {
    required: false,
  });

  validateDateTimeString(meta, 'updated_at', `${field}.updated_at`, errors, {
    required: false,
  });

  validateDateTimeString(meta, 'submitted_at', `${field}.submitted_at`, errors, {
    required: false,
    nullable: true,
  });

  if (mode === 'draft' && meta.stato_questionario === 'submitted') {
    addError(
      errors,
      `${field}.stato_questionario`,
      'invalid_enum',
      'Un draft non dovrebbe avere stato_questionario = submitted.'
    );
  }
}

function validateQuestionario(data, errors, mode) {
  const field = 'questionario';

  if (!isPlainObject(data.questionario)) {
    addError(errors, field, 'required', 'Il blocco questionario è obbligatorio e deve essere un oggetto.');
    return;
  }

  const q = data.questionario;
  const required = mode === 'submit';

  coerceBoolean(q, 'rispetto_norme_mezzi', `${field}.rispetto_norme_mezzi`, errors, { required });
  coerceBoolean(q, 'uso_navigatore', `${field}.uso_navigatore`, errors, { required });

  coerceEnum(q, 'pneumatici_classe_a', `${field}.pneumatici_classe_a`, errors, PNEUMATICI_CLASSI, {
    required,
  });

  coerceEnum(q, 'formazione_eco_drive', `${field}.formazione_eco_drive`, errors, FORMAZIONE_ECO_DRIVE, {
    required,
  });

  coerceBoolean(q, 'interesse_mobility_manager', `${field}.interesse_mobility_manager`, errors, {
    required,
  });

  coerceBoolean(
    q,
    'interesse_certificazione_secondo_livello',
    `${field}.interesse_certificazione_secondo_livello`,
    errors,
    { required }
  );

  const extraField = `${field}.mezzi_extra_non_stradali`;
  if (!isNil(q.mezzi_extra_non_stradali) || required) {
    if (!isPlainObject(q.mezzi_extra_non_stradali)) {
      addError(
        errors,
        extraField,
        'required',
        'Il blocco mezzi_extra_non_stradali è obbligatorio e deve essere un oggetto.'
      );
    } else {
      coerceInteger(q.mezzi_extra_non_stradali, 'biciclette', `${extraField}.biciclette`, errors, {
        required,
        min: 0,
        max: 100000,
      });

      coerceInteger(q.mezzi_extra_non_stradali, 'trasporto_acqua', `${extraField}.trasporto_acqua`, errors, {
        required,
        min: 0,
        max: 100000,
      });

      coerceInteger(q.mezzi_extra_non_stradali, 'aerotrasporti', `${extraField}.aerotrasporti`, errors, {
        required,
        min: 0,
        max: 100000,
      });
    }
  }
}

function validateVeicoli(data, errors, mode) {
  const field = 'veicoli';

  if (!Array.isArray(data.veicoli)) {
    addError(errors, field, 'required', 'Il blocco veicoli è obbligatorio e deve essere un array.');
    return;
  }

  if (mode === 'submit' && data.veicoli.length < 1) {
    addError(errors, field, 'required', 'Per il submit è richiesto almeno un veicolo stradale.');
  }

  data.veicoli.forEach((vehicle, index) => {
    validateVehicle(vehicle, `${field}[${index}]`, errors, mode);
  });
}

function validateVehicle(vehicle, basePath, errors, mode) {
  if (!isPlainObject(vehicle)) {
    addError(errors, basePath, 'invalid_type', 'Ogni veicolo deve essere un oggetto.');
    return;
  }

  coerceNonEmptyString(vehicle, 'vehicle_id', `${basePath}.vehicle_id`, errors, { required: true });

  const tipologia = coerceEnum(
    vehicle,
    'tipologia_mezzo',
    `${basePath}.tipologia_mezzo`,
    errors,
    TIPOLOGIA_MEZZO,
    { required: true }
  );

  coerceEnum(vehicle, 'origine_riga', `${basePath}.origine_riga`, errors, ORIGINE_RIGA, {
    required: true,
  });

  const statoRevisione = coerceEnum(
    vehicle,
    'stato_revisione',
    `${basePath}.stato_revisione`,
    errors,
    STATO_REVISIONE,
    { required: true }
  );

  if (mode === 'submit' && statoRevisione === 'needs_review') {
    addError(
      errors,
      `${basePath}.stato_revisione`,
      'invalid_enum',
      'Non è possibile inviare in submit una riga con stato_revisione = needs_review.'
    );
  }

  coerceInteger(vehicle, 'ocr_document_id', `${basePath}.ocr_document_id`, errors, {
    required: false,
    nullable: true,
    min: 1,
  });

  if (!isPlainObject(vehicle.campi)) {
    addError(errors, `${basePath}.campi`, 'required', 'Il blocco campi del veicolo è obbligatorio.');
    return;
  }

  const campi = vehicle.campi;
  const isMerci = TIPI_MERCI.has(tipologia);
  const isPasseggeri = TIPI_PASSEGGERI.has(tipologia);

  // Campi base
  const annoImmatricolazione = coerceInteger(
    campi,
    'anno_immatricolazione',
    `${basePath}.campi.anno_immatricolazione`,
    errors,
    {
      required: mode === 'submit',
      nullable: mode === 'draft',
      min: 1950,
      max: CURRENT_YEAR,
    }
  );

  const classeEuro = coerceEnum(
    campi,
    'classe_euro',
    `${basePath}.campi.classe_euro`,
    errors,
    CLASSI_EURO,
    {
      required: mode === 'submit',
      nullable: mode === 'draft',
    }
  );

  const tipoCarburante = coerceEnum(
    campi,
    'tipo_carburante',
    `${basePath}.campi.tipo_carburante`,
    errors,
    TIPI_CARBURANTE,
    {
      required: mode === 'submit',
      nullable: mode === 'draft',
    }
  );

  let co2wltp = coerceInteger(
    campi,
    'co2_wltp_g_km',
    `${basePath}.campi.co2_wltp_g_km`,
    errors,
    {
      required: false,
      nullable: true,
      min: 0,
      max: 2000,
    }
  );

  let co2wltpSecondo = coerceInteger(
    campi,
    'co2_wltp_g_km_secondo_carburante',
    `${basePath}.campi.co2_wltp_g_km_secondo_carburante`,
    errors,
    {
      required: false,
      nullable: true,
      min: 0,
      max: 2000,
    }
  );

  const pesoMerciClasse = coerceEnum(
    campi,
    'peso_merci_classe',
    `${basePath}.campi.peso_merci_classe`,
    errors,
    PESO_MERCI_CLASSI,
    {
      required: false,
      nullable: true,
    }
  );

  const profiloPasseggeri = coerceInteger(
    campi,
    'profilo_occupazione_passeggeri',
    `${basePath}.campi.profilo_occupazione_passeggeri`,
    errors,
    {
      required: false,
      nullable: true,
      min: 1,
      max: 6,
    }
  );

  const profiloMerci = coerceInteger(
    campi,
    'profilo_carico_merci',
    `${basePath}.campi.profilo_carico_merci`,
    errors,
    {
      required: false,
      nullable: true,
      min: 1,
      max: 6,
    }
  );

  validateProfileLabel(
    campi,
    'profilo_occupazione_passeggeri_label',
    `${basePath}.campi.profilo_occupazione_passeggeri_label`,
    errors,
    profiloPasseggeri,
    PROFILO_PASSEGGERI_LABELS
  );

  validateProfileLabel(
    campi,
    'profilo_carico_merci_label',
    `${basePath}.campi.profilo_carico_merci_label`,
    errors,
    profiloMerci,
    PROFILO_MERCI_LABELS
  );

  const dataUltimaRevisione = validateDateOnly(
    campi,
    'data_ultima_revisione',
    `${basePath}.campi.data_ultima_revisione`,
    errors,
    {
      required: mode === 'submit',
      nullable: mode === 'draft',
      forbidFuture: mode === 'submit',
    }
  );

  const bollinoBlu = coerceBoolean(
    campi,
    'bollino_blu',
    `${basePath}.campi.bollino_blu`,
    errors,
    {
      required: mode === 'submit',
      nullable: mode === 'draft',
    }
  );

  const kmAnnui = coerceInteger(
    campi,
    'km_annui',
    `${basePath}.campi.km_annui`,
    errors,
    {
      required: mode === 'submit',
      nullable: mode === 'draft',
      min: mode === 'submit' ? 1 : 0,
      max: 1000000,
    }
  );

  // Coerenza tipologia
  if (isPasseggeri) {
    if (!isNil(campi.peso_merci_classe)) {
      addError(
        errors,
        `${basePath}.campi.peso_merci_classe`,
        'forbidden_for_vehicle_type',
        'peso_merci_classe non è ammesso per mezzi passeggeri.'
      );
    }

    if (!isNil(campi.profilo_carico_merci)) {
      addError(
        errors,
        `${basePath}.campi.profilo_carico_merci`,
        'forbidden_for_vehicle_type',
        'profilo_carico_merci non è ammesso per mezzi passeggeri.'
      );
    }

    if (mode === 'submit' && isNil(campi.profilo_occupazione_passeggeri)) {
      addError(
        errors,
        `${basePath}.campi.profilo_occupazione_passeggeri`,
        'required_for_vehicle_type',
        'profilo_occupazione_passeggeri è obbligatorio per mezzi passeggeri.'
      );
    }
  }

  if (isMerci) {
    if (!isNil(campi.profilo_occupazione_passeggeri)) {
      addError(
        errors,
        `${basePath}.campi.profilo_occupazione_passeggeri`,
        'forbidden_for_vehicle_type',
        'profilo_occupazione_passeggeri non è ammesso per mezzi merci.'
      );
    }

    if (mode === 'submit' && isNil(campi.peso_merci_classe)) {
      addError(
        errors,
        `${basePath}.campi.peso_merci_classe`,
        'required_for_vehicle_type',
        'peso_merci_classe è obbligatorio per mezzi merci.'
      );
    }

    if (mode === 'submit' && isNil(campi.profilo_carico_merci)) {
      addError(
        errors,
        `${basePath}.campi.profilo_carico_merci`,
        'required_for_vehicle_type',
        'profilo_carico_merci è obbligatorio per mezzi merci.'
      );
    }
  }

  // Coerenza carburante
  if (tipoCarburante === 'elettrico') {
    if (mode === 'submit' && isNil(campi.co2_wltp_g_km)) {
      campi.co2_wltp_g_km = 0;
      co2wltp = 0;
    }
  } else if (mode === 'submit') {
    if (isNil(campi.co2_wltp_g_km)) {
      addError(
        errors,
        `${basePath}.campi.co2_wltp_g_km`,
        'required_for_fuel_type',
        'co2_wltp_g_km è obbligatorio per il submit salvo veicoli elettrici.'
      );
    }
  }

  if (CARBURANTI_DUAL_FUEL.has(tipoCarburante)) {
    if (mode === 'submit' && isNil(campi.co2_wltp_g_km_secondo_carburante)) {
      addError(
        errors,
        `${basePath}.campi.co2_wltp_g_km_secondo_carburante`,
        'required_for_fuel_type',
        'Il secondo valore CO2 WLTP è obbligatorio per GPL o Metano.'
      );
    }
  } else if (!isNil(campi.co2_wltp_g_km_secondo_carburante)) {
    addError(
      errors,
      `${basePath}.campi.co2_wltp_g_km_secondo_carburante`,
      'must_be_null',
      'co2_wltp_g_km_secondo_carburante deve essere nullo salvo carburanti GPL o Metano.'
    );
  }

  // Sorgente campi
  validateSorgenteCampi(vehicle, basePath, errors);

  // Warning campi
  validateWarningCampi(vehicle, basePath, errors);
}

function validateSorgenteCampi(vehicle, basePath, errors) {
  if (isNil(vehicle.sorgente_campi)) return;

  if (!isPlainObject(vehicle.sorgente_campi)) {
    addError(
      errors,
      `${basePath}.sorgente_campi`,
      'invalid_type',
      'sorgente_campi deve essere un oggetto.'
    );
    return;
  }

  for (const [key, value] of Object.entries(vehicle.sorgente_campi)) {
    const allowed = SORGENTE_CAMPI_ALLOWED[key];
    if (!allowed) {
      addError(
        errors,
        `${basePath}.sorgente_campi.${key}`,
        'invalid_enum',
        `La chiave ${key} non è ammessa in sorgente_campi.`
      );
      continue;
    }

    if (typeof value !== 'string' || !allowed.has(value)) {
      addError(
        errors,
        `${basePath}.sorgente_campi.${key}`,
        'invalid_enum',
        `Valore non valido per sorgente_campi.${key}.`
      );
    }
  }
}

function validateWarningCampi(vehicle, basePath, errors) {
  if (isNil(vehicle.warning_campi)) return;

  if (!isPlainObject(vehicle.warning_campi)) {
    addError(
      errors,
      `${basePath}.warning_campi`,
      'invalid_type',
      'warning_campi deve essere un oggetto.'
    );
    return;
  }

  for (const [key, value] of Object.entries(vehicle.warning_campi)) {
    if (!Array.isArray(value)) {
      addError(
        errors,
        `${basePath}.warning_campi.${key}`,
        'invalid_type',
        'Ogni warning_campi.<campo> deve essere un array.'
      );
      continue;
    }

    value.forEach((warning, idx) => {
      if (typeof warning !== 'string' || !WARNING_CODES.has(warning)) {
        addError(
          errors,
          `${basePath}.warning_campi.${key}[${idx}]`,
          'invalid_enum',
          `Warning non valido: ${String(warning)}.`
        );
      }
    });
  }
}

function validateProfileLabel(container, key, fieldPath, errors, profileCode, labelsMap) {
  if (isNil(container[key])) {
    if (!isNil(profileCode) && labelsMap[profileCode]) {
      container[key] = labelsMap[profileCode];
    }
    return;
  }

  if (typeof container[key] !== 'string') {
    addError(errors, fieldPath, 'invalid_type', 'La label del profilo deve essere una stringa.');
    return;
  }

  if (!Object.values(labelsMap).includes(container[key])) {
    addError(errors, fieldPath, 'invalid_enum', 'La label del profilo non è valida.');
    return;
  }

  if (!isNil(profileCode) && labelsMap[profileCode] !== container[key]) {
    addError(
      errors,
      fieldPath,
      'invalid_enum',
      'La label del profilo non corrisponde al codice profilo selezionato.'
    );
  }
}

function coerceNonEmptyString(obj, key, fieldPath, errors, { required = false } = {}) {
  let value = obj[key];

  if (isNil(value)) {
    if (required) {
      addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    }
    return null;
  }

  if (typeof value !== 'string') {
    addError(errors, fieldPath, 'invalid_type', 'Il campo deve essere una stringa.');
    return null;
  }

  value = value.trim();
  if (!value) {
    if (required) {
      addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    }
    obj[key] = null;
    return null;
  }

  obj[key] = value;
  return value;
}

function coerceEnum(obj, key, fieldPath, errors, enumSet, options = {}) {
  const { required = false, nullable = false } = options;
  let value = obj[key];

  if (isNil(value)) {
    if (required) addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    obj[key] = null;
    return null;
  }

  if (typeof value === 'string') {
    value = value.trim();
    if (!value) {
      if (required) addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
      obj[key] = null;
      return null;
    }
  }

  if (!enumSet.has(value)) {
    addError(errors, fieldPath, 'invalid_enum', `Valore non valido: ${String(value)}.`);
    return null;
  }

  obj[key] = value;
  return value;
}

function coerceBoolean(obj, key, fieldPath, errors, options = {}) {
  const { required = false, nullable = false } = options;
  let value = obj[key];

  if (isNil(value)) {
    if (required) addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    obj[key] = null;
    return null;
  }

  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true') value = true;
    else if (lower === 'false') value = false;
  }

  if (typeof value !== 'boolean') {
    addError(errors, fieldPath, 'invalid_type', 'Il campo deve essere boolean.');
    return null;
  }

  obj[key] = value;
  return value;
}

function coerceInteger(obj, key, fieldPath, errors, options = {}) {
  const {
    required = false,
    nullable = false,
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
  } = options;

  let value = obj[key];

  if (isNil(value)) {
    if (required) addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    obj[key] = null;
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      if (required) addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
      obj[key] = null;
      return null;
    }
    if (/^-?\d+$/.test(trimmed)) {
      value = Number(trimmed);
    }
  }

  if (!Number.isInteger(value)) {
    addError(errors, fieldPath, 'invalid_type', 'Il campo deve essere un intero.');
    return null;
  }

  if (value < min || value > max) {
    addError(
      errors,
      fieldPath,
      'out_of_range',
      `Il valore deve essere compreso tra ${min} e ${max}.`
    );
    return null;
  }

  obj[key] = value;
  return value;
}

function validateDateOnly(obj, key, fieldPath, errors, options = {}) {
  const {
    required = false,
    nullable = false,
    forbidFuture = false,
  } = options;

  let value = obj[key];

  if (isNil(value)) {
    if (required) addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    obj[key] = null;
    return null;
  }

  if (typeof value !== 'string') {
    addError(errors, fieldPath, 'invalid_type', 'La data deve essere una stringa in formato YYYY-MM-DD.');
    return null;
  }

  value = value.trim();
  if (!value) {
    if (required) addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    obj[key] = null;
    return null;
  }

  if (!isValidISODate(value)) {
    addError(errors, fieldPath, 'invalid_date', 'La data deve essere valida e in formato YYYY-MM-DD.');
    return null;
  }

  if (forbidFuture && isFutureISODate(value)) {
    addError(errors, fieldPath, 'future_date_not_allowed', 'La data non può essere futura.');
    return null;
  }

  obj[key] = value;
  return value;
}

function validateDateTimeString(obj, key, fieldPath, errors, options = {}) {
  const { required = false, nullable = false } = options;
  let value = obj[key];

  if (isNil(value)) {
    if (required) addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    obj[key] = null;
    return null;
  }

  if (typeof value !== 'string') {
    addError(errors, fieldPath, 'invalid_type', 'Il campo deve essere una stringa date-time ISO.');
    return null;
  }

  value = value.trim();
  if (!value) {
    if (required) addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    obj[key] = null;
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    addError(errors, fieldPath, 'invalid_date', 'Timestamp non valido.');
    return null;
  }

  obj[key] = value;
  return value;
}

function unwrapTransportV2Input(payload) {
  if (isPlainObject(payload) && isPlainObject(payload.transport_v2)) {
    return payload.transport_v2;
  }
  return payload;
}

function deepNormalize(value) {
  if (Array.isArray(value)) {
    return value.map(deepNormalize);
  }

  if (isPlainObject(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepNormalize(v);
    }
    return out;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNil(value) {
  return value === undefined || value === null;
}

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isFutureISODate(value) {
  const [yearStr, monthStr, dayStr] = value.split('-');
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return date.getTime() > todayUTC.getTime();
}

function addError(errors, field, code, message) {
  errors.push({ field, code, message });
}

function normalizeBlock1Vehicle(vehicle, index, errors) {
  const fieldPath = `draft.vehicles[${index}]`;

  if (!isPlainObject(vehicle)) {
    addError(errors, fieldPath, 'invalid_type', 'Ogni veicolo deve essere un oggetto.');
    return null;
  }

  const normalizedVehicle = deepNormalize(vehicle);

  if (!isNil(normalizedVehicle.transport_mode) && typeof normalizedVehicle.transport_mode === 'string') {
    normalizedVehicle.transport_mode = normalizedVehicle.transport_mode.trim();
  }

  if (
    !isNil(normalizedVehicle.transport_mode) &&
    !['goods', 'passenger'].includes(normalizedVehicle.transport_mode)
  ) {
    addError(
      errors,
      `${fieldPath}.transport_mode`,
      'invalid_enum',
      'transport_mode deve essere goods, passenger oppure null.',
    );
  }

  if (
    !isNil(normalizedVehicle.ocr_document_id) &&
    !Number.isInteger(normalizedVehicle.ocr_document_id) &&
    !(
      typeof normalizedVehicle.ocr_document_id === 'string' &&
      /^\d+$/.test(normalizedVehicle.ocr_document_id.trim())
    )
  ) {
    addError(
      errors,
      `${fieldPath}.ocr_document_id`,
      'invalid_type',
      'ocr_document_id deve essere un intero positivo oppure null.',
    );
  }

  if (!isNil(normalizedVehicle.fields) && !isPlainObject(normalizedVehicle.fields)) {
    addError(errors, `${fieldPath}.fields`, 'invalid_type', 'fields deve essere un oggetto.');
  }

  if (!isNil(normalizedVehicle.field_sources) && !isPlainObject(normalizedVehicle.field_sources)) {
    addError(
      errors,
      `${fieldPath}.field_sources`,
      'invalid_type',
      'field_sources deve essere un oggetto.',
    );
  }

  if (!isNil(normalizedVehicle.field_warnings) && !isPlainObject(normalizedVehicle.field_warnings)) {
    addError(
      errors,
      `${fieldPath}.field_warnings`,
      'invalid_type',
      'field_warnings deve essere un oggetto.',
    );
  }

  if (!isNil(normalizedVehicle.row_notes) && typeof normalizedVehicle.row_notes !== 'string') {
    addError(
      errors,
      `${fieldPath}.row_notes`,
      'invalid_type',
      'row_notes deve essere una stringa oppure null.',
    );
  }

  if (!isNil(normalizedVehicle.vehicle_id) && typeof normalizedVehicle.vehicle_id !== 'string') {
    addError(
      errors,
      `${fieldPath}.vehicle_id`,
      'invalid_type',
      'vehicle_id deve essere una stringa.',
    );
  }

  return normalizedVehicle;
}

function validateBlock2QuestionnaireFlags(questionnaireFlags, errors) {
  const fieldPath = 'draft.questionnaire_flags';

  if (!isPlainObject(questionnaireFlags)) {
    addError(errors, fieldPath, 'required', 'draft.questionnaire_flags deve essere un oggetto.');
    return;
  }

  BLOCK2_REQUIRED_QUESTIONNAIRE_FLAGS.forEach((key) => {
    if (isNil(questionnaireFlags[key])) {
      addError(
        errors,
        `${fieldPath}.${key}`,
        'required',
        `Il campo ${key} e obbligatorio per il submit.`,
      );
    }
  });
}

function validateBlock2Vehicles(vehicles, errors) {
  const fieldPath = 'draft.vehicles';

  if (!Array.isArray(vehicles)) {
    addError(errors, fieldPath, 'required', 'draft.vehicles deve essere un array.');
    return;
  }

  if (vehicles.length < 1) {
    addError(errors, fieldPath, 'required', 'Per il submit e richiesto almeno un veicolo.');
    return;
  }

  vehicles.forEach((vehicle, index) => {
    validateBlock2Vehicle(vehicle, index, errors);
  });
}

function validateBlock2Vehicle(vehicle, index, errors) {
  const fieldPath = `draft.vehicles[${index}]`;

  if (!isPlainObject(vehicle)) {
    addError(errors, fieldPath, 'invalid_type', 'Ogni veicolo deve essere un oggetto.');
    return;
  }

  if (!isNonEmptyString(vehicle.vehicle_id)) {
    addError(errors, `${fieldPath}.vehicle_id`, 'required', 'vehicle_id e obbligatorio.');
  }

  if (!['passenger', 'goods'].includes(vehicle.transport_mode)) {
    addError(
      errors,
      `${fieldPath}.transport_mode`,
      'invalid_enum',
      'transport_mode deve essere passenger oppure goods.',
    );
  }

  if (!isPlainObject(vehicle.fields)) {
    addError(errors, `${fieldPath}.fields`, 'required', 'fields e obbligatorio.');
    return;
  }

  const fields = vehicle.fields;
  validateIntegerField(fields.registration_year, `${fieldPath}.fields.registration_year`, errors, {
    required: true,
    min: 1900,
    max: CURRENT_YEAR,
  });
  validateRequiredString(fields.euro_class, `${fieldPath}.fields.euro_class`, errors);
  validateRequiredString(fields.fuel_type, `${fieldPath}.fields.fuel_type`, errors);
  validateBooleanField(fields.wltp_homologation, `${fieldPath}.fields.wltp_homologation`, errors, {
    required: true,
  });
  validateIntegerField(fields.wltp_co2_g_km, `${fieldPath}.fields.wltp_co2_g_km`, errors, {
    required: true,
    min: 0,
  });
  validateDateOnlyField(fields.last_revision_date, `${fieldPath}.fields.last_revision_date`, errors, {
    required: true,
  });
  validateBooleanField(fields.blue_sticker, `${fieldPath}.fields.blue_sticker`, errors, {
    required: true,
  });
  validateIntegerField(fields.annual_km, `${fieldPath}.fields.annual_km`, errors, {
    required: true,
    min: 0,
  });

  const normalizedFuelType = normalizeFuelTypeForSubmit(fields.fuel_type);
  if (normalizedFuelType === 'gpl' || normalizedFuelType === 'metano') {
    validateIntegerField(
      fields.wltp_co2_g_km_alt_fuel,
      `${fieldPath}.fields.wltp_co2_g_km_alt_fuel`,
      errors,
      {
        required: true,
        min: 0,
      },
    );
  } else if (!isNil(fields.wltp_co2_g_km_alt_fuel)) {
    validateIntegerField(
      fields.wltp_co2_g_km_alt_fuel,
      `${fieldPath}.fields.wltp_co2_g_km_alt_fuel`,
      errors,
      {
        required: false,
        min: 0,
      },
    );
  }

  if (vehicle.transport_mode === 'passenger') {
    validateIntegerField(
      fields.occupancy_profile_code,
      `${fieldPath}.fields.occupancy_profile_code`,
      errors,
      {
        required: true,
        min: 1,
        max: 6,
      },
    );

    if (!isNil(fields.load_profile_code)) {
      addError(
        errors,
        `${fieldPath}.fields.load_profile_code`,
        'forbidden_for_transport_mode',
        'load_profile_code non e ammesso per transport_mode = passenger.',
      );
    }
  }

  if (vehicle.transport_mode === 'goods') {
    validateIntegerField(
      fields.load_profile_code,
      `${fieldPath}.fields.load_profile_code`,
      errors,
      {
        required: true,
        min: 1,
        max: 6,
      },
    );

    if (!isNil(fields.occupancy_profile_code)) {
      addError(
        errors,
        `${fieldPath}.fields.occupancy_profile_code`,
        'forbidden_for_transport_mode',
        'occupancy_profile_code non e ammesso per transport_mode = goods.',
      );
    }

    if (
      typeof fields.goods_vehicle_over_3_5_tons !== 'boolean' &&
      typeof fields.goods_vehicle_over_2_5_tons !== 'boolean'
    ) {
      addError(
        errors,
        `${fieldPath}.fields.goods_vehicle_over_3_5_tons`,
        'required',
        'goods_vehicle_over_3_5_tons e obbligatorio per transport_mode = goods.',
      );
    }
  }
}

function validateRequiredString(value, fieldPath, errors) {
  if (!isNonEmptyString(value)) {
    addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
  }
}

function validateBooleanField(value, fieldPath, errors, { required = false } = {}) {
  if (isNil(value)) {
    if (required) {
      addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    }
    return;
  }

  if (typeof value !== 'boolean') {
    addError(errors, fieldPath, 'invalid_type', 'Il campo deve essere boolean.');
  }
}

function validateIntegerField(value, fieldPath, errors, options = {}) {
  const { required = false, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;

  if (isNil(value)) {
    if (required) {
      addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    }
    return;
  }

  let normalizedValue = value;
  if (typeof normalizedValue === 'string' && /^-?\d+$/.test(normalizedValue.trim())) {
    normalizedValue = Number.parseInt(normalizedValue.trim(), 10);
  }

  if (!Number.isInteger(normalizedValue)) {
    addError(errors, fieldPath, 'invalid_type', 'Il campo deve essere un intero.');
    return;
  }

  if (normalizedValue < min || normalizedValue > max) {
    addError(
      errors,
      fieldPath,
      'out_of_range',
      `Il valore deve essere compreso tra ${min} e ${max}.`,
    );
  }
}

function validateDateOnlyField(value, fieldPath, errors, { required = false } = {}) {
  if (isNil(value)) {
    if (required) {
      addError(errors, fieldPath, 'required', 'Campo obbligatorio.');
    }
    return;
  }

  if (typeof value !== 'string' || !isValidISODate(value.trim())) {
    addError(errors, fieldPath, 'invalid_date', 'La data deve essere valida e in formato YYYY-MM-DD.');
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeFuelTypeForSubmit(value) {
  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().toLowerCase();
}

module.exports = {
  validateTransportV2Draft,
  validateTransportV2Submit,
  validateTransportV2Block1DraftPayload,
  validateTransportV2Block2SubmitPayload,
};