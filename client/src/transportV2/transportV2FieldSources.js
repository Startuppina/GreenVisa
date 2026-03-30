function hasFieldValueChanged(previousValue, nextValue) {
  return !Object.is(previousValue, nextValue);
}

function getNextFieldSource(previousSource, didValueChange) {
  if (!previousSource) {
    return { source: 'user' };
  }

  if (previousSource.source === 'user') {
    return previousSource;
  }

  if (previousSource.source === 'mixed') {
    return previousSource;
  }

  if (previousSource.source === 'ocr' || previousSource.source === 'ocr_derived') {
    if (!didValueChange) {
      return previousSource;
    }

    return {
      ...previousSource,
      source: 'mixed',
    };
  }

  return { ...previousSource, source: 'user' };
}

export function applyUserFieldEdit(vehicle, fieldKey, nextValue) {
  const previousValue = vehicle?.fields?.[fieldKey] ?? null;
  const previousSource = vehicle?.field_sources?.[fieldKey];
  const didValueChange = hasFieldValueChanged(previousValue, nextValue);

  const nextFieldSources = {
    ...(vehicle?.field_sources || {}),
    [fieldKey]: getNextFieldSource(previousSource, didValueChange),
  };

  const nextFieldWarnings = { ...(vehicle?.field_warnings || {}) };
  if (didValueChange) {
    delete nextFieldWarnings[fieldKey];
  }

  return {
    ...vehicle,
    fields: {
      ...(vehicle?.fields || {}),
      [fieldKey]: nextValue,
    },
    field_sources: nextFieldSources,
    field_warnings: nextFieldWarnings,
  };
}
