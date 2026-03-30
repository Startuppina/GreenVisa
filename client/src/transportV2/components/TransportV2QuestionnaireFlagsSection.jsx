import {
  BOOLEAN_SELECT_OPTIONS,
  TRANSPORT_V2_FLAG_FIELDS,
  booleanToSelectValue,
  parseBooleanSelectValue,
} from '../transportV2Model';

const inputClassName =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50';

export default function TransportV2QuestionnaireFlagsSection({
  questionnaireFlags,
  disabled,
  onChangeFlag,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Questionnaire flags</h2>
        <p className="mt-1 text-sm text-slate-600">
          Sezione minima per la gestione del draft condiviso. I valori vengono salvati tramite
          autosave e restano allineati con il backend.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TRANSPORT_V2_FLAG_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-medium text-slate-800">{field.label}</span>
            <select
              className={inputClassName}
              value={booleanToSelectValue(questionnaireFlags?.[field.key])}
              disabled={disabled}
              onChange={(event) => onChangeFlag(field.key, parseBooleanSelectValue(event.target.value))}
            >
              {BOOLEAN_SELECT_OPTIONS.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}
