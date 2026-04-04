/**
 * Interruttore singolo Sì/No: un tap alterna (non impostato → Sì → No → Sì…).
 */
export default function YesNoSwitch({
  value,
  onChange,
  disabled,
  id,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
}) {
  const isYes = value === true;
  const isNo = value === false;
  const unset = !isYes && !isNo;

  const handleClick = () => {
    if (disabled) {
      return;
    }
    if (unset) {
      onChange(true);
      return;
    }
    onChange(!value);
  };

  const knobAlign = unset ? "justify-center" : isYes ? "justify-end" : "justify-start";

  const trackClass = [
    "flex h-9 w-[5.25rem] items-center rounded-full p-1 transition-colors",
    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
    isYes
      ? "bg-emerald-500/25 ring-2 ring-inset ring-emerald-500/50"
      : isNo
        ? "bg-slate-300/90 ring-2 ring-inset ring-slate-400/40"
        : "border-2 border-dashed border-slate-300 bg-slate-50",
  ].join(" ");

  const caption = unset ? "Da impostare" : isYes ? "Sì" : "No";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={unset ? "mixed" : isYes}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        disabled={disabled}
        className={`${trackClass} ${knobAlign}`}
        onClick={handleClick}
      >
        <span className="pointer-events-none h-7 w-7 shrink-0 rounded-full bg-white shadow-md ring-1 ring-slate-200/80" />
      </button>
      <span
        className={`min-w-[5.5rem] text-sm font-medium ${
          unset ? "text-slate-500" : "text-slate-800"
        }`}
      >
        {caption}
      </span>
    </div>
  );
}
