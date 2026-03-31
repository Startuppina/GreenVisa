export default function TransportSubmitBar({
  isDirty,
  isSaving,
  isSubmitting,
  saveError,
  submitError,
  saveSuccessAt,
  onSave,
  onSubmit,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">Save and submit</h2>
          <p className="text-sm text-slate-600">
            Saving is manual. Submit uses the live backend validation and result calculation.
          </p>
          <div className="text-sm text-slate-700">
            Draft status: {isDirty ? 'Unsaved local changes' : 'Draft matches last saved state'}
          </div>
          {saveSuccessAt ? (
            <div className="text-sm text-emerald-700">
              Last successful save: {new Date(saveSuccessAt).toLocaleString()}
            </div>
          ) : null}
          {saveError ? <div className="text-sm text-rose-600">{saveError}</div> : null}
          {submitError ? <div className="text-sm text-rose-600">{submitError}</div> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            type="button"
            onClick={onSave}
            disabled={isSaving || isSubmitting}
          >
            {isSaving ? 'Saving...' : 'Save draft'}
          </button>
          <button
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
            onClick={onSubmit}
            disabled={isSaving || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </section>
  );
}
