import {
  COVERAGE_OPTIONS,
  getFirstFieldError,
  QUESTIONNAIRE_FLAG_FIELDS,
} from "../utils/validation.js";
import YesNoSwitch from "./YesNoSwitch.jsx";

function BooleanField({ field, value, onChange, error, disabled }) {
  const labelId = `q-flag-${field.key}-label`;

  return (
    <div className="flex min-h-full flex-col gap-3">
      <div id={labelId} className="text-sm font-medium leading-snug text-slate-900">
        {field.label}
      </div>
      <YesNoSwitch
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-labelledby={labelId}
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

function CoverageField({ field, value, onChange, error, disabled }) {
  const selectId = `q-flag-${field.key}-select`;

  return (
    <div className="flex min-h-full flex-col gap-3">
      <label
        htmlFor={selectId}
        className="text-sm font-medium leading-snug text-slate-900"
      >
        {field.label}
      </label>
      <select
        id={selectId}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Seleziona un’opzione</option>
        {COVERAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

export default function QuestionnaireFlagsSection({
  questionnaireFlags,
  fieldErrors,
  onChange,
  readOnly,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
      <header className="mb-8 max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Domande generali sul trasporto
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Rispondi a queste voci prima di compilare l’elenco veicoli: servono al calcolo del punteggio e
          descrivono politiche aziendali (pneumatici, formazione, strumenti di guida, ecc.).
        </p>
      </header>

      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {QUESTIONNAIRE_FLAG_FIELDS.map((field) => {
          const error = getFirstFieldError(
            fieldErrors,
            `draft.questionnaire_flags.${field.key}`,
          );

          if (field.type === "coverage") {
            return (
              <CoverageField
                key={field.key}
                field={field}
                value={questionnaireFlags?.[field.key]}
                error={error}
                disabled={readOnly}
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
              disabled={readOnly}
              onChange={(value) => onChange(field.key, value)}
            />
          );
        })}
      </div>
    </section>
  );
}
