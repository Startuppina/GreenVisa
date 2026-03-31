const YES_VALUE = 'Item 1';
const NO_VALUE = 'Item 2';

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isSpaCategory(category) {
  if (typeof category !== 'string') {
    return false;
  }

  const normalized = category.trim().toLowerCase();
  return normalized === 'certificazione spa e resorts' || normalized === 'certificazione spa e resort';
}

function sanitizeWellnessSurveyData(rawSurveyData) {
  if (!isPlainObject(rawSurveyData)) {
    return rawSurveyData;
  }

  const sanitizedData = { ...rawSurveyData };

  // Q1 non e piu una domanda fattuale e non deve influenzare salvataggio/scoring.
  delete sanitizedData.question1;

  if (sanitizedData.question3 === NO_VALUE) {
    delete sanitizedData.question33;
  }

  if (sanitizedData.wellness_has_food_service === NO_VALUE) {
    delete sanitizedData.question11;
    delete sanitizedData.question34;
  }

  if (sanitizedData.wellness_has_dishwasher === NO_VALUE) {
    delete sanitizedData.question22;
    delete sanitizedData.question28;
  }

  if (sanitizedData.wellness_has_washing_machine === NO_VALUE) {
    delete sanitizedData.question29;
  }

  if (sanitizedData.wellness_has_cabins === NO_VALUE) {
    delete sanitizedData.question24;
  }

  return sanitizedData;
}

module.exports = {
  isSpaCategory,
  sanitizeWellnessSurveyData,
  YES_VALUE,
  NO_VALUE,
};
