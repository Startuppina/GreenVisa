import {
  COVERAGE_OPTIONS,
  getFirstFieldError,
  QUESTIONNAIRE_FLAG_FIELDS,
  YES_NO_OPTIONS,
} from '../utils/validation.js';

function BooleanField({ field, value, onChange, error }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div>
        <div className="font-medium text-slate-900">{field.label}</div>
      </div>
      <div className="flex flex-wrap gap-3">
        {YES_NO_OPTIONS.map((option) => {
          const checked =
            (option.value === 'true' && value === true) || (option.value === 'false' && value === false);

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                checked
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <input
                className="h-4 w-4"
                type="radio"
                name={field.key}
                checked={checked}
                onChange={() => onChange(option.value === 'true')}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

function CoverageField({ field, value, onChange, error }) {
  return (
    <label className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div>
        <div className="font-medium text-slate-900">{field.label}</div>
      </div>
      <select
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select an option</option>
        {COVERAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}

export default function QuestionnaireFlagsSection({ questionnaireFlags, fieldErrors, onChange }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Questionnaire flags</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {QUESTIONNAIRE_FLAG_FIELDS.map((field) => {
          const error = getFirstFieldError(fieldErrors, `draft.questionnaire_flags.${field.key}`);

          if (field.type === 'coverage') {
            return (
              <CoverageField
                key={field.key}
                field={field}
                value={questionnaireFlags?.[field.key]}
                error={error}
                onChange={(value) => onChange(field.key, value)}
              />
            );
          }

          return (
            <BooleanField
              key={field.key}
              field={field}
              value={questionnaireFlags?.[field.key]}
              error={error}
              onChange={(value) => onChange(field.key, value)}
            />
          );
        })}
      </div>
    </section>
  );
}
