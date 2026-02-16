const validate = require('validate-vat');

const emailCheck = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const passwordCheck = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(String(password));
};

const phoneCheck = (phone) => {
  const re = /^[\+]?[(]?[0-9]{3,5}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,10}$/im;
  return re.test(String(phone).toLowerCase());
};

const vatCheck = async (vatNumber) => {
  try {
    if (!vatNumber || vatNumber.length < 3) {
      return false;
    }

    const pivaRegex = /^[A-Z]{2}[0-9]{11}$/;
    if (!pivaRegex.test(vatNumber)) {
      return false;
    }

    const countryCode = vatNumber.slice(0, 2).toUpperCase();
    const number = vatNumber.slice(2);

    const validationInfo = await new Promise((resolve, reject) => {
      validate(countryCode, number, (err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });

    return { valid: validationInfo.valid, companyName: validationInfo.name, address: validationInfo.address };
  } catch (error) {
    console.error('Errore durante la verifica della partita IVA:', error);
    return false;
  }
};

const cfCheck = (cf) => {
  const cfRegex = /^[A-Za-z]{6}[0-9]{2}[A-Za-z]{1}[0-9]{2}[A-Za-z]{1}[0-9]{3}[A-Za-z]{1}$/;
  return cfRegex.test(cf);
};

module.exports = {
  emailCheck,
  passwordCheck,
  phoneCheck,
  vatCheck,
  cfCheck,
};
