import PropTypes from 'prop-types';

export default function TransportV2DevToolbar({
  isSaving,
  transportV2,
  storageKey,
  onResetDraft,
  onSeedEmptyDraft,
  onSeedPassengerOcrDraft,
  onSeedGoodsOcrDraft,
  onSeedCompleteishDraft,
  onSeedSubmittedDraft,
  onToggleSubmittedState,
}) {
  const isSubmitted = transportV2?.meta?.status === 'submitted';

  return (
    <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Transport V2 dev sandbox</h2>
            <span className="rounded-full bg-cyan-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-900">
              Dev only
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-slate-700">
            Draft locale persistito in <code>{storageKey}</code>. Nessuna chiamata backend,
            nessun ordine, nessun entitlement: questa pagina serve solo a riusare il form reale in
            isolamento.
          </p>
        </div>

        <div className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Stato sandbox:</span>{' '}
            {isSubmitted ? 'submitted / sola lettura' : 'draft / modificabile'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <ToolbarButton onClick={onResetDraft} disabled={isSaving}>
          Reset draft
        </ToolbarButton>
        <ToolbarButton onClick={onSeedEmptyDraft} disabled={isSaving}>
          Seed empty draft
        </ToolbarButton>
        <ToolbarButton onClick={onSeedPassengerOcrDraft} disabled={isSaving}>
          Seed passenger OCR
        </ToolbarButton>
        <ToolbarButton onClick={onSeedGoodsOcrDraft} disabled={isSaving}>
          Seed goods OCR
        </ToolbarButton>
        <ToolbarButton onClick={onSeedCompleteishDraft} disabled={isSaving}>
          Seed near-complete draft
        </ToolbarButton>
        <ToolbarButton onClick={onSeedSubmittedDraft} disabled={isSaving}>
          Seed submitted draft
        </ToolbarButton>
        <ToolbarButton onClick={onToggleSubmittedState} disabled={isSaving}>
          {isSubmitted ? 'Set draft editable' : 'Toggle submitted/read-only'}
        </ToolbarButton>
      </div>
    </section>
  );
}

function ToolbarButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

TransportV2DevToolbar.propTypes = {
  isSaving: PropTypes.bool.isRequired,
  transportV2: PropTypes.shape({
    meta: PropTypes.shape({
      status: PropTypes.string,
    }),
  }),
  storageKey: PropTypes.string.isRequired,
  onResetDraft: PropTypes.func.isRequired,
  onSeedEmptyDraft: PropTypes.func.isRequired,
  onSeedPassengerOcrDraft: PropTypes.func.isRequired,
  onSeedGoodsOcrDraft: PropTypes.func.isRequired,
  onSeedCompleteishDraft: PropTypes.func.isRequired,
  onSeedSubmittedDraft: PropTypes.func.isRequired,
  onToggleSubmittedState: PropTypes.func.isRequired,
};

TransportV2DevToolbar.defaultProps = {
  transportV2: null,
};

ToolbarButton.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};
