const euroEmissions = [
  "Euro 0",
  "Euro 1",
  "Euro 2",
  "Euro 3",
  "Euro 4",
  "Euro 5",
  "Euro 6",
];

const fuelTypes = [
  "Benzina",
  "Diesel",
  "GPL",
  "Metano",
  "Metano (monovalente)",
  "Mild hybrid",
  "Full hybrid",
  "Plug-in hybrid",
  "Elettrico",
];

const vehicleTypes = [
  "Autobus",
  "Minibus",
  "Autovetture",
  "Autovetture Cabrio",
  "Scooter",
  "Moto",
  "Biciclette",
  "Trasporto su acqua",
  "Aerotrasporti",
];

const createInitialResult = () => ({
  registrationYear: new Date().getFullYear(),
  emissionArea: euroEmissions[0],
  fuelType: fuelTypes[0],
  lastRevision: new Date().toISOString().split("T")[0],
  kmPerYear: 0,
  timeWithPeople: 0,
  weight: 0,
  kmWithLoad: 0,
  blueTicket: false,
  vehicleType: vehicleTypes[0],
});

const normalizeResult = (payload) => {
  const base = createInitialResult();
  const source = payload?.result ?? payload ?? {};

  return {
    ...base,
    registrationYear: Number(source.registrationYear ?? base.registrationYear),
    emissionArea:
      source.emissionArea ?? source.wltpApproval ?? base.emissionArea,
    fuelType: source.fuelType ?? base.fuelType,
    lastRevision: source.lastRevision ?? base.lastRevision,
    kmPerYear: Number(source.kmPerYear ?? base.kmPerYear),
    timeWithPeople: Number(source.timeWithPeople ?? base.timeWithPeople),
    weight: Number(source.weight ?? base.weight),
    kmWithLoad: Number(source.kmWithLoad ?? base.kmWithLoad),
    blueTicket: Boolean(source.blueTicket ?? base.blueTicket),
    vehicleType: source.vehicleType ?? base.vehicleType,
  };
};

export {
  euroEmissions,
  fuelTypes,
  vehicleTypes,
  createInitialResult,
  normalizeResult,
};
