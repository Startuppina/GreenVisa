const BlueTicketToggle = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-2 col-span-1">
      <label className="text-sm font-medium text-slate-700">Bollino blu</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange((prev) => !prev)}
          className={[
            "select-none rounded-md px-4 py-2 text-sm font-semibold text-white text-center shadow-sm",
            "outline-none focus:ring-4 focus:ring-emerald-100",
            value
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-rose-600 hover:bg-rose-700",
          ].join(" ")}
        >
          {value ? "Si" : "No"}
        </button>
        <span className="text-sm text-slate-600">Clicca per cambiare</span>
      </div>
    </div>
  );
};

export default BlueTicketToggle;
