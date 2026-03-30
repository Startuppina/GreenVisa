const FUEL_TYPES = ['Benzina', 'Diesel', 'GPL', 'Metano', 'Ibrido', 'Elettrico'];
const EURO_CLASSES = ['Euro 3', 'Euro 4', 'Euro 5', 'Euro 6', 'Euro 6d'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomConfidence(min = 0.40, max = 1.0) {
  return +(min + Math.random() * (max - min)).toFixed(2);
}

function randomYear() {
  return String(2008 + Math.floor(Math.random() * 18));
}

let entitySeq = 0;

export function generateMockExtraction(documentId, fileName) {
  const entityCount = Math.random() < 0.65 ? 1 : Math.random() < 0.6 ? 2 : 3;
  const entities = [];

  for (let i = 0; i < entityCount; i++) {
    entitySeq++;
    entities.push({
      entityId: `veh_${entitySeq}`,
      entityType: 'vehicle',
      displayName: `Veicolo ${entitySeq}`,
      fields: [
        { key: 'registration_year', label: 'Anno immatricolazione', value: randomYear(), confidence: randomConfidence(0.65, 1.0), required: false },
        { key: 'fuel_type', label: 'Tipo carburante', value: pick(FUEL_TYPES), confidence: randomConfidence(0.40, 1.0), required: false },
        { key: 'euro_class', label: 'Classe Euro', value: pick(EURO_CLASSES), confidence: randomConfidence(0.40, 0.96), required: false },
        { key: 'vehicle_mass_kg', label: 'Massa veicolo (kg)', value: String(1500 + Math.floor(Math.random() * 4500)), confidence: randomConfidence(0.60, 1.0), required: false },
        { key: 'wltp_homologation', label: 'Omologazione WLTP', value: Math.random() > 0.3 ? 'Sì' : 'No', confidence: randomConfidence(0.45, 0.95), required: false },
      ],
    });
  }

  return {
    documentId,
    fileName,
    status: 'needs_review',
    entities,
  };
}

export function resetEntitySequence() {
  entitySeq = 0;
}
