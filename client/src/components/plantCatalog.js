export const FUEL_UNIT_MAP = {
  "Gas Naturale (Metano)": "Sm³",
  GPL: "mc",
  Gasolio: "mc",
  Benzina: "lt",
  Idrogeno: "Smc",
  "Olio combustibile": "t",
  Pellet: "t",
  "Cippato di legna": "t",
  Biogas: "Sm³",
  "Energia termica": "kWh",
  "Elettricità": "kWh",
};

export const THERMAL_SYSTEM_TYPES = [
  "Riscaldamento",
  "Raffrescamento",
  "Acqua calda sanitaria",
  "Altra produzione termica",
];

export const PLANT_TYPE_OPTIONS = ["Centralizzato", "Autonomo"];

export const GENERATOR_OPTIONS = {
  "Riscaldamento": {
    Centralizzato: [
      "Caldaia tradizionale",
      "Caldaia condensazione",
      "Pompa di calore idronica",
      "Ibrido (Caldaia e Pompa di Calore)",
      "Cogeneratore o Trigenerazione con Motore endotermico",
      "Cogeneratore o Trigenerazione con Microturbina",
      "Cogeneratore o Trigenerazione con Fuel Cell",
      "Teleriscaldamento",
      "Bolitore elettrico",
      "Altro",
    ],
    Autonomo: [
      "Caldaia tradizionale",
      "Caldaia condensazione",
      "Pompa di calore idronica",
      "Split",
      "Ibrido (Caldaia e Pompa di Calore)",
      "Bolitore elettrico",
      "Altro",
    ],
  },
  "Raffrescamento": {
    Centralizzato: ["Pompa di calore idronica", "Altro"],
    Autonomo: ["Pompa di calore idronica", "Split", "Altro"],
  },
  "Acqua calda sanitaria": {
    Centralizzato: [
      "Caldaia tradizionale",
      "Caldaia condensazione",
      "Pompa di calore idronica",
      "Ibrido (Caldaia e Pompa di Calore)",
      "Cogeneratore o Trigenerazione con Motore endotermico",
      "Cogeneratore o Trigenerazione con Microturbina",
      "Cogeneratore o Trigenerazione con Fuel Cell",
      "Teleriscaldamento",
      "Bolitore elettrico",
      "Altro",
    ],
    Autonomo: [
      "Caldaia tradizionale",
      "Caldaia condensazione",
      "Pompa di calore idronica",
      "Ibrido (Caldaia e Pompa di Calore)",
      "Bolitore elettrico",
      "Altro",
    ],
  },
  "Altra produzione termica": {
    Centralizzato: [
      "Caldaia tradizionale",
      "Caldaia condensazione",
      "Pompa di calore idronica",
      "Ibrido (Caldaia e Pompa di Calore)",
      "Cogeneratore o Trigenerazione con Motore endotermico",
      "Cogeneratore o Trigenerazione con Microturbina",
      "Cogeneratore o Trigenerazione con Fuel Cell",
      "Teleriscaldamento",
      "Bolitore elettrico",
      "Altro",
    ],
    Autonomo: [
      "Caldaia tradizionale",
      "Caldaia condensazione",
      "Pompa di calore idronica",
      "Ibrido (Caldaia e Pompa di Calore)",
      "Bolitore elettrico",
      "Altro",
    ],
  },
};

export const PLANT_SELECTOR_OPTIONS = [
  { id: "Riscaldamento", label: "Riscaldamento", kind: "plant" },
  { id: "Raffrescamento", label: "Raffrescamento", kind: "plant" },
  { id: "Acqua calda sanitaria", label: "Prod. acqua calda sanitaria", kind: "plant" },
  { id: "Altra produzione termica", label: "Altra produzione termica", kind: "plant" },
  { id: "Ventilazione meccanica", label: "Ventilazione meccanica", kind: "plant" },
  { id: "Illuminazione", label: "Illuminazione", kind: "plant" },
  { id: "Solare termico", label: "Impianti solari termici", kind: "solar" },
  { id: "Fotovoltaico", label: "Impianti fotovoltaici", kind: "photo" },
];

export function getFuelUnit(fuelType) {
  return FUEL_UNIT_MAP[fuelType] || "";
}

export function getGeneratorOptions(systemType, plantType) {
  return GENERATOR_OPTIONS[systemType]?.[plantType] || [];
}

export function plantRequiresFuel(systemType) {
  return THERMAL_SYSTEM_TYPES.includes(systemType);
}

export function plantSupportsGasLeak(systemType) {
  return THERMAL_SYSTEM_TYPES.includes(systemType);
}
