const fs = require('fs');
const path = require('path');

const guidanceDir = path.join(__dirname, '..', 'guidance');

const cache = {};

function getGuidanceText(questionnaireType) {
  if (cache[questionnaireType]) {
    return cache[questionnaireType];
  }

  const filePath = path.join(guidanceDir, `${questionnaireType}.txt`);

  if (!fs.existsSync(filePath)) {
    return '';
  }

  const text = fs.readFileSync(filePath, 'utf-8');
  cache[questionnaireType] = text;
  return text;
}

module.exports = { getGuidanceText };
