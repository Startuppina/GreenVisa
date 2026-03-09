const { emailCheck, passwordCheck, phoneCheck } = require("./regexValidator");

class RegistrationBody {
  constructor(
    username,
    company_name,
    email,
    confirmEmail,
    password,
    phone,
    company_website,
    pec,
    vat,
    noCompanyEmail,
    legal_headquarter,
  ) {
    this.username = username;
    this.company_name = company_name;
    this.email = email;
    this.confirmEmail = confirmEmail;
    this.password = password;
    this.phone = phone;
    this.company_website = company_website;
    this.pec = pec;
    this.vat = vat;
    this.noCompanyEmail = noCompanyEmail;
    this.legal_headquarter = legal_headquarter;
  }

  areFieldsFilled() {
    return (
      this.username &&
      this.company_name &&
      this.email &&
      this.confirmEmail &&
      this.password &&
      this.phone &&
      this.company_website &&
      this.pec &&
      this.vat &&
      this.noCompanyEmail &&
      this.legal_headquarter
    );
  }

  validateFields(res) {
    if (!this.validate()) {
      return res.status(400).json({ msg: "Per favore compila tutti i campi" });
    }

    if (!passwordCheck(this.password)) {
      return res.status(400).json({
        msg: "Password non corretta. Segui le info per ottenere una password sicura",
      });
    }

    if (this.email !== this.confirmEmail) {
      return res.status(400).json({ msg: "Le email non corrispondono" });
    }

    if (!emailCheck(this.email)) {
      return res.status(400).json({ msg: "Email non valida" });
    }

    if (!emailCheck(this.pec)) {
      return res.status(400).json({ msg: "PEC non valida" });
    }

    if (!phoneCheck(this.phone)) {
      return res.status(400).json({ msg: "Numero di telefono non valido" });
    }
  }
}

module.exports = { RegistrationBody };
