function emailCheck(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function passwordCheck(password) {
  const re =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(String(password));
}

function phoneCheck(phone) {
  const re = /^[\+]?[(]?[0-9]{3,5}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,10}$/im;
  return re.test(String(phone).toLowerCase());
}

function cfCheck(cf) {
  const cfRegex =
    /^[A-Za-z]{6}[0-9]{2}[A-Za-z]{1}[0-9]{2}[A-Za-z]{1}[0-9]{3}[A-Za-z]{1}$/;
  return cfRegex.test(cf);
}

module.exports = { emailCheck, passwordCheck, phoneCheck, cfCheck };
