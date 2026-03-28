const PLATES = ['AB123CD', 'EF456GH', 'IJ789KL', 'MN012OP', 'QR345ST', 'UV678WX', 'YZ901AB', 'BC234DE', 'FG567HI'];
const FUEL_TYPES = ['Benzina', 'Diesel', 'GPL', 'Metano', 'Ibrido', 'Elettrico'];
const EURO_CLASSES = ['Euro 3', 'Euro 4', 'Euro 5', 'Euro 6', 'Euro 6d'];
const BRANDS = ['Fiat', 'Alfa Romeo', 'Lancia', 'Iveco', 'Volkswagen', 'Mercedes-Benz', 'BMW', 'Renault'];
const MODELS = ['Panda', 'Punto', '500', 'Ducato', 'Daily', 'Giulia', 'Stelvio', 'Transporter', 'Sprinter'];

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
        { key: 'plate', label: 'Targa', value: pick(PLATES), confidence: randomConfidence(0.70, 1.0), required: true },
        { key: 'brand', label: 'Marca', value: pick(BRANDS), confidence: randomConfidence(0.55, 1.0), required: true },
        { key: 'model', label: 'Modello', value: pick(MODELS), confidence: randomConfidence(0.50, 0.98), required: true },
        { key: 'registrationYear', label: 'Anno immatricolazione', value: randomYear(), confidence: randomConfidence(0.65, 1.0), required: true },
        { key: 'fuelType', label: 'Tipo carburante', value: pick(FUEL_TYPES), confidence: randomConfidence(0.40, 1.0), required: true },
        { key: 'euroClass', label: 'Classe Euro', value: pick(EURO_CLASSES), confidence: randomConfidence(0.40, 0.96), required: true },
        { key: 'power', label: 'Potenza (kW)', value: String(40 + Math.floor(Math.random() * 220)), confidence: randomConfidence(0.60, 1.0), required: false },
        { key: 'wltpHomologation', label: 'Omologazione WLTP', value: Math.random() > 0.3 ? 'Sì' : 'No', confidence: randomConfidence(0.45, 0.95), required: false },
      ],
    });
  }

  return {
    documentId,
    fileName,
    status: 'completed',
    entities,
  };
}

export function resetEntitySequence() {
  entitySeq = 0;
}
