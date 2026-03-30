const emissionClassesPeopleTransport = [
  { class: 'A', minEmissions: 0, maxEmissions: 0, maxScore: 100 },
  { class: 'B', minEmissions: 1, maxEmissions: 50, maxScore: 90 },
  { class: 'C', minEmissions: 51, maxEmissions: 80, maxScore: 80 },
  { class: 'D', minEmissions: 81, maxEmissions: 100, maxScore: 70 },
  { class: 'E', minEmissions: 101, maxEmissions: 130, maxScore: 60 },
  { class: 'F', minEmissions: 131, maxEmissions: 160, maxScore: 50 },
  { class: 'G', minEmissions: 161, maxEmissions: 200, maxScore: 40 },
  { class: 'H', minEmissions: 201, maxEmissions: 250, maxScore: 30 },
  { class: 'I', minEmissions: 251, maxEmissions: 300, maxScore: 20 },
  { class: 'J', minEmissions: 301, maxEmissions: Infinity, maxScore: 10 },
];

const emissionClassesFreightTransport = [
  { class: 'A', minEmissions: 0, maxEmissions: 0, maxScore: 100 },
  { class: 'B', minEmissions: 1, maxEmissions: 50, maxScore: 90 },
  { class: 'C', minEmissions: 50, maxEmissions: 100, maxScore: 80 },
  { class: 'D', minEmissions: 101, maxEmissions: 150, maxScore: 70 },
  { class: 'E', minEmissions: 151, maxEmissions: 200, maxScore: 60 },
  { class: 'F', minEmissions: 201, maxEmissions: 250, maxScore: 50 },
  { class: 'G', minEmissions: 251, maxEmissions: 300, maxScore: 40 },
  { class: 'H', minEmissions: 301, maxEmissions: 400, maxScore: 30 },
  { class: 'I', minEmissions: 401, maxEmissions: 500, maxScore: 20 },
  { class: 'J', minEmissions: 501, maxEmissions: Infinity, maxScore: 10 },
];

const penalities = {
  1: 9,
  2: 8,
  3: 5,
  4: 4,
  5: 2,
  6: 0,
};

module.exports = {
  emissionClassesPeopleTransport,
  emissionClassesFreightTransport,
  penalities,
};
