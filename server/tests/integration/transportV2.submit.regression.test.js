const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  TRANSPORT_V2_ALREADY_SUBMITTED_MSG,
} = require('../../services/transportV2DraftService');
const {
  authCookieForUser,
  buildCompleteGoodsDraft,
  buildCompleteMixedDraft,
  buildCompletePassengerDraft,
  buildGoodsVehicle,
  buildPassengerVehicle,
  createCertificationFixture,
  createSurveyResponseFixture,
  createUserFixture,
  getSurveyResponse,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

async function seedAndSubmit({ user, certification, transportV2, body = {} }) {
  await createSurveyResponseFixture({
    userId: user.id,
    certificationId: certification.id,
    surveyData: {
      transport_v2: transportV2,
    },
  });

  return request(app)
    .post(`/api/transport-v2/${certification.id}/submit`)
    .set('Cookie', authCookieForUser(user))
    .send(body);
}

describe('Transport V2 submit regression cases', () => {
  it('matches the one passenger diesel golden case end-to-end', async () => {
    const user = await createUserFixture({ suffix: 'submit-reg-passenger-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-reg-passenger-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const transportV2 = buildCompletePassengerDraft(certification.id, {
      vehicle: buildPassengerVehicle({
        fields: {
          annual_km: 10000,
          fuel_type: 'diesel',
          co2_emissions_g_km: 120,
          occupancy_profile_code: 4,
        },
      }),
    });

    const response = await seedAndSubmit({ user, certification, transportV2 });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.results.co2.total_tons_per_year).toBe(1.2);
    expect(response.body.transport_v2.results.score.passenger_score).toBe(5.6);
    expect(response.body.transport_v2.results.score.goods_score).toBe(0);
    expect(response.body.transport_v2.results.score.total_score).toBe(2.8);
  });

  it('matches the one goods diesel golden case end-to-end', async () => {
    const user = await createUserFixture({ suffix: 'submit-reg-goods-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-reg-goods-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const transportV2 = buildCompleteGoodsDraft(certification.id, {
      vehicle: buildGoodsVehicle({
        fields: {
          annual_km: 20000,
          fuel_type: 'diesel',
          co2_emissions_g_km: 280,
          load_profile_code: 2,
        },
      }),
    });

    const response = await seedAndSubmit({ user, certification, transportV2 });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.results.co2.total_tons_per_year).toBe(5.6);
    expect(response.body.transport_v2.results.score.goods_score).toBe(3.2);
    expect(response.body.transport_v2.results.score.total_score).toBe(1.6);
  });

  it('matches the one GPL passenger golden case end-to-end', async () => {
    const user = await createUserFixture({ suffix: 'submit-reg-gpl-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-reg-gpl-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const transportV2 = buildCompletePassengerDraft(certification.id, {
      vehicle: buildPassengerVehicle({
        fields: {
          annual_km: 10000,
          fuel_type: 'gpl',
          co2_emissions_g_km: 100,
          wltp_co2_g_km_alt_fuel: 140,
          occupancy_profile_code: 6,
        },
      }),
    });

    const response = await seedAndSubmit({ user, certification, transportV2 });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.results.co2.total_tons_per_year).toBe(1.2);
    expect(response.body.transport_v2.results.score.passenger_score).toBe(6);
    expect(response.body.transport_v2.results.score.total_score).toBe(3);
  });

  it('preserves the mixed-fleet section breakdown and final totals', async () => {
    const user = await createUserFixture({ suffix: 'submit-reg-mixed-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-reg-mixed-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const transportV2 = buildCompleteMixedDraft(certification.id, {
      passengerVehicleOverrides: {
        fields: {
          annual_km: 10000,
          fuel_type: 'diesel',
          co2_emissions_g_km: 100,
          occupancy_profile_code: 4,
        },
      },
      goodsVehicleOverrides: {
        fields: {
          annual_km: 20000,
          fuel_type: 'gpl',
          co2_emissions_g_km: 100,
          wltp_co2_g_km_alt_fuel: 140,
          load_profile_code: 3,
        },
      },
    });

    const response = await seedAndSubmit({ user, certification, transportV2 });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.results.sections.passenger).toEqual({
      vehicle_count: 1,
      score: 6.6,
      co2_tons_per_year: 1,
    });
    expect(response.body.transport_v2.results.sections.goods).toEqual({
      vehicle_count: 1,
      score: 6.5,
      co2_tons_per_year: 2.4,
    });
    expect(response.body.transport_v2.results.score.total_score).toBe(6.55);
    expect(response.body.transport_v2.results.co2.total_tons_per_year).toBe(3.4);
  });

  it('locks the goods threshold overlap at exactly 50 g/km to class B end-to-end', async () => {
    const user = await createUserFixture({ suffix: 'submit-reg-overlap-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-reg-overlap-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const transportV2 = buildCompleteGoodsDraft(certification.id, {
      vehicle: buildGoodsVehicle({
        fields: {
          annual_km: 10000,
          fuel_type: 'diesel',
          co2_emissions_g_km: 50,
          load_profile_code: 6,
        },
      }),
    });

    const response = await seedAndSubmit({ user, certification, transportV2 });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.results.score.goods_score).toBe(9);
    expect(response.body.transport_v2.results.score.total_score).toBe(4.5);
    expect(response.body.transport_v2.results.co2.total_tons_per_year).toBe(0.5);
  });

  it('reads from the stored draft and ignores injected client results, derived, and summary fields', async () => {
    const user = await createUserFixture({ suffix: 'submit-reg-malicious-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-reg-malicious-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const transportV2 = buildCompletePassengerDraft(certification.id);
    const response = await seedAndSubmit({
      user,
      certification,
      transportV2,
      body: {
        derived: { hacked: true },
        results: { hacked: true },
        total_score: 999,
        co2emissions: 999,
        completed: true,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.derived.hacked).toBeUndefined();
    expect(response.body.transport_v2.results.hacked).toBeUndefined();

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(Number(row.total_score)).not.toBe(999);
    expect(Number(row.co2emissions)).not.toBe(999);
    expect(row.completed).toBe(true);
  });

  it('rejects a second submit after the questionnaire is already submitted', async () => {
    const user = await createUserFixture({ suffix: 'submit-reg-repeat-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-reg-repeat-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const transportV2 = buildCompletePassengerDraft(certification.id);
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: transportV2,
      },
    });

    const first = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user));
    const second = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user));

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(second.body.msg).toBe(TRANSPORT_V2_ALREADY_SUBMITTED_MSG);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2.meta.status).toBe('submitted');
    expect(row.survey_data.transport_v2.results.co2).toEqual(first.body.transport_v2.results.co2);
  });

  it('does not allow draft changes or a second submit after the first successful submit', async () => {
    const user = await createUserFixture({ suffix: 'submit-reg-recompute-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-reg-recompute-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const transportV2 = buildCompletePassengerDraft(certification.id);
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: transportV2,
      },
    });

    const first = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user));

    const updateResponse = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          ...transportV2.draft,
          vehicles: [
            buildPassengerVehicle({
              fields: {
                ...transportV2.draft.vehicles[0].fields,
                annual_km: 20000,
              },
            }),
          ],
        },
      });

    expect(first.status).toBe(200);
    expect(updateResponse.status).toBe(409);
    expect(updateResponse.body.msg).toBe(TRANSPORT_V2_ALREADY_SUBMITTED_MSG);

    const second = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user));

    expect(second.status).toBe(409);
    expect(second.body.msg).toBe(TRANSPORT_V2_ALREADY_SUBMITTED_MSG);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2.results.co2.total_tons_per_year).toBe(
      first.body.transport_v2.results.co2.total_tons_per_year,
    );
  });
});
