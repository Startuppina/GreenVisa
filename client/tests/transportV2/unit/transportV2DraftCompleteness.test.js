import { describe, expect, it } from 'vitest';
import {
  getMissingQuestionnaireFlags,
  getTransportV2DraftCompleteness,
  getVehicleCompletenessIssues,
} from '../../../src/transportV2/transportV2DraftCompleteness.js';
import { TRANSPORT_V2_FLAG_FIELDS } from '../../../src/transportV2/transportV2Model.js';
import {
  makeCompleteDraftFixture,
  makeFreshDraftFixture,
  makeManualVehicleRow,
  makeTransportV2Fixture,
} from '../../helpers/transportV2Fixtures.js';

describe('getMissingQuestionnaireFlags', () => {
  it('returns all keys when flags object is empty', () => {
    const missing = getMissingQuestionnaireFlags({});
    expect(missing).toHaveLength(TRANSPORT_V2_FLAG_FIELDS.length);
  });
});

describe('getTransportV2DraftCompleteness', () => {
  it('is incomplete when questionnaire flags are missing', () => {
    const result = getTransportV2DraftCompleteness(
      makeTransportV2Fixture({
        draft: {
          questionnaire_flags: { uses_navigator: true },
          vehicles: [makeManualVehicleRow()],
        },
      }),
    );
    expect(result.questionnaire.isComplete).toBe(false);
    expect(result.isComplete).toBe(false);
  });

  it('is incomplete with zero vehicles', () => {
    const result = getTransportV2DraftCompleteness(
      makeTransportV2Fixture({
        draft: {
          questionnaire_flags: {
            compliance_with_vehicle_regulations: true,
            uses_navigator: true,
            uses_class_a_tires: true,
            eco_drive_training: true,
            interested_in_mobility_manager_course: true,
            interested_in_second_level_certification: true,
          },
          vehicles: [],
        },
      }),
    );
    expect(result.vehicles.hasAtLeastOneVehicle).toBe(false);
    expect(result.isComplete).toBe(false);
  });

  it('passenger row missing occupancy_profile_code is incomplete', () => {
    const row = makeManualVehicleRow({
      fields: {
        ...makeManualVehicleRow().fields,
        occupancy_profile_code: null,
      },
    });
    const issue = getVehicleCompletenessIssues(row, 0);
    expect(issue.isComplete).toBe(false);
    expect(issue.missingFields).toContain('occupancy_profile_code');
  });

  it('goods row missing load_profile_code is incomplete', () => {
    const row = makeManualVehicleRow({
      transport_mode: 'goods',
      fields: {
        ...makeManualVehicleRow().fields,
        occupancy_profile_code: null,
        load_profile_code: null,
        goods_vehicle_over_3_5_tons: true,
      },
    });
    const issue = getVehicleCompletenessIssues(row, 0);
    expect(issue.missingFields).toContain('load_profile_code');
  });

  it('goods row missing goods_vehicle_over_3_5_tons is incomplete', () => {
    const row = makeManualVehicleRow({
      transport_mode: 'goods',
      fields: {
        ...makeManualVehicleRow().fields,
        occupancy_profile_code: null,
        load_profile_code: 3,
        goods_vehicle_over_3_5_tons: null,
      },
    });
    const issue = getVehicleCompletenessIssues(row, 0);
    expect(issue.missingFields).toContain('goods_vehicle_over_3_5_tons');
  });

  it('reports forbidden-field mismatch for passenger with load_profile_code set', () => {
    const row = makeManualVehicleRow({
      fields: {
        ...makeManualVehicleRow().fields,
        load_profile_code: 2,
      },
    });
    const issue = getVehicleCompletenessIssues(row, 0);
    expect(issue.invalidFields).toContain('load_profile_code');
    expect(issue.messages.some((m) => m.includes('Profilo merci'))).toBe(true);
  });

  it('reports forbidden-field mismatch for goods with occupancy_profile_code set', () => {
    const row = makeManualVehicleRow({
      transport_mode: 'goods',
      fields: {
        ...makeManualVehicleRow().fields,
        occupancy_profile_code: 2,
        load_profile_code: 3,
        goods_vehicle_over_3_5_tons: true,
      },
    });
    const issue = getVehicleCompletenessIssues(row, 0);
    expect(issue.invalidFields).toContain('occupancy_profile_code');
    expect(issue.messages.some((m) => m.includes('Profilo passeggeri'))).toBe(true);
  });

  it('fully complete draft is complete', () => {
    const result = getTransportV2DraftCompleteness(makeCompleteDraftFixture());
    expect(result.isComplete).toBe(true);
    expect(result.questionnaire.isComplete).toBe(true);
    expect(result.vehicles.isComplete).toBe(true);
  });

  it('treats boolean false as present, not missing', () => {
    const row = makeManualVehicleRow({
      fields: {
        ...makeManualVehicleRow().fields,
        wltp_homologation: false,
        blue_sticker: false,
      },
    });
    const issue = getVehicleCompletenessIssues(row, 0);
    expect(issue.missingFields).not.toContain('wltp_homologation');
    expect(issue.missingFields).not.toContain('blue_sticker');
  });

  it('treats null, undefined, and empty string as missing', () => {
    const fields = { ...makeManualVehicleRow().fields, euro_class: '', fuel_type: null };
    delete fields.last_revision_date;
    const row = { ...makeManualVehicleRow(), fields };
    const issue = getVehicleCompletenessIssues(row, 0);
    expect(issue.missingFields).toContain('euro_class');
    expect(issue.missingFields).toContain('fuel_type');
    expect(issue.missingFields).toContain('last_revision_date');
  });
});

describe('fresh draft fixture', () => {
  it('is incomplete (smoke)', () => {
    const result = getTransportV2DraftCompleteness(makeFreshDraftFixture());
    expect(result.isComplete).toBe(false);
  });
});
