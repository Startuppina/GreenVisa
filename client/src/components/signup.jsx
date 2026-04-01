import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import axios from 'axios';
import MessagePopUp from './messagePopUp';
import PassInfo from './passInfo';
import { debounce } from 'lodash';

const normalizeVat = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const FIELD_REQUIRED_MESSAGE = 'Campo obbligatorio';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signup = () => {
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passInfo, setPassInfo] = useState(false);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');
    const [vatValidationMessage, setVatValidationMessage] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false); // Gestisci il checkbox dei termini
    const [company_name, setCompany_name] = useState('');
    const [legal_headquarter, setLegalHeadquarter] = useState('');
    const [company_website, setCompanyWebsite] = useState('');
    const [pec, setPec] = useState('');
    const [vat, setVat] = useState('');
    const [isValid, setIsValid] = useState(null); // Gestisci lo stato della validazione della partita iva
    const [isCheckingVat, setIsCheckingVat] = useState(false);
    const [noCompanyEmail, setNoCompanyEmail] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const navigate = useNavigate();

    const clearFieldErrors = (...keys) => {
        setFieldErrors((prevErrors) => {
            const nextErrors = { ...prevErrors };
            keys.forEach((key) => {
                delete nextErrors[key];
            });
            return nextErrors;
        });
    };

    const getFieldClassName = (fieldKey, textClass = 'text-gray-900') =>
        `bg-gray-50 border ${fieldErrors[fieldKey] ? 'border-rose-500' : 'border-gray-300'} ${textClass} sm:text-sm rounded-lg block w-full p-2.5`;

    const getMissingFieldsErrors = () => {
        const missingErrors = {};
        if (!username.trim()) missingErrors.username = FIELD_REQUIRED_MESSAGE;
        if (!phone.trim()) missingErrors.phone = FIELD_REQUIRED_MESSAGE;
        if (!password.trim()) missingErrors.password = FIELD_REQUIRED_MESSAGE;
        if (!confirmPassword.trim()) missingErrors.confirmPassword = FIELD_REQUIRED_MESSAGE;
        if (!company_name.trim()) missingErrors.company_name = FIELD_REQUIRED_MESSAGE;
        if (!legal_headquarter.trim()) missingErrors.legal_headquarter = FIELD_REQUIRED_MESSAGE;
        if (!pec.trim()) missingErrors.pec = FIELD_REQUIRED_MESSAGE;
        if (!company_website.trim()) missingErrors.company_website = FIELD_REQUIRED_MESSAGE;
        if (!noCompanyEmail && !email.trim()) missingErrors.email = FIELD_REQUIRED_MESSAGE;
        if (!noCompanyEmail && !confirmEmail.trim()) missingErrors.confirmEmail = FIELD_REQUIRED_MESSAGE;
        if (!normalizeVat(vat)) missingErrors.vat = FIELD_REQUIRED_MESSAGE;
        return missingErrors;
    };

    const mapServerMessageToFieldErrors = (message) => {
        const msg = String(message || '').toLowerCase();

        if (!msg) return {};
        if (msg.includes('riempi tutti i campi') || msg.includes('compilare tutti i campi')) {
            return getMissingFieldsErrors();
        }
        if (msg.includes('password non corretta')) {
            return { password: message };
        }
        if (msg.includes('email non valida')) {
            return { email: message, confirmEmail: message };
        }
        if (msg.includes('le email non corrispondono')) {
            return { email: message, confirmEmail: message };
        }
        if (msg.includes('pec non valida')) {
            return { pec: message };
        }
        if (msg.includes('numero di telefono non valido')) {
            return { phone: message };
        }
        if (msg.includes('partita iva')) {
            return { vat: message };
        }
        if (msg.includes('email già in uso')) {
            return { email: message };
        }
        return {};
    };

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        clearFieldErrors('username');
    };
    const handleCompanyNameChange = (e) => {
        setCompany_name(e.target.value);
        clearFieldErrors('company_name');
    };
    const handleLegalHeadquarterChange = (e) => {
        setLegalHeadquarter(e.target.value);
        clearFieldErrors('legal_headquarter');
    };
    const handlePhoneChange = (value) => {
        setPhone(value);
        clearFieldErrors('phone');
    };
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        clearFieldErrors('email');
    };
    const handleConfirmEmailChange = (e) => {
        setConfirmEmail(e.target.value);
        clearFieldErrors('confirmEmail');
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        clearFieldErrors('password');
    };
    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        clearFieldErrors('confirmPassword');
    };
    const handleTermsChange = (e) => {
        setAcceptedTerms(e.target.checked);
        clearFieldErrors('acceptedTerms');
    };
    const handleCompanyWebsiteChange = (e) => {
        setCompanyWebsite(e.target.value);
        clearFieldErrors('company_website');
    };
    const handlePecChange = (e) => {
        setPec(e.target.value);
        clearFieldErrors('pec');
    };
    const handleVatChange = (e) => {
        const value = normalizeVat(e.target.value);
        setVat(value);
        clearFieldErrors('vat');
        if (!value) {
            checkVat.cancel();
            setIsValid(null);
            setIsCheckingVat(false);
            setVatValidationMessage('');
            setCompany_name('');
            setLegalHeadquarter('');
            return;
        }

        setIsCheckingVat(true);
        checkVat(value);
    }
    const handleNoCompanyEmailChange = (e) => {
        setNoCompanyEmail(e.target.checked);
        clearFieldErrors('noCompanyEmail', 'email', 'confirmEmail');
    };
    const toggleShowPassword = () => setShowPassword(!showPassword);
    const togglePassInfo = () => setPassInfo(!passInfo);

    const validateVatNumber = useCallback(async (value) => {
        const normalizedVat = normalizeVat(value);

        if (!normalizedVat) {
            setIsValid(null);
            setIsCheckingVat(false);
            setVatValidationMessage('');
            setCompany_name('');
            setLegalHeadquarter('');
            return null;
        }

        if (normalizedVat.length < 13) {
            setIsValid(null);
            setIsCheckingVat(false);
            setVatValidationMessage('');
            setCompany_name('');
            setLegalHeadquarter('');
            return null;
        }

        try {
            const response = await axios.post(`/api/check-vat`, { vatNumber: normalizedVat });
            setIsValid(response.data.success);
            setVatValidationMessage('');
            setCompany_name(response.data.companyName || '');
            setLegalHeadquarter(response.data.address || '');
            setVat(response.data.vatNumber || normalizedVat);
            return response.data.success;
        } catch (error) {
            console.error('Errore controllo partita IVA:', error);
            setVatValidationMessage(error.response?.data?.msg || 'Errore durante la verifica della partita IVA');
            setIsValid(false);
            setCompany_name('');
            setLegalHeadquarter('');
            return false;
        } finally {
            setIsCheckingVat(false);
        }
    }, []);

    const checkVat = useCallback(
        debounce((value) => {
            void validateVatNumber(value);
        }, 500),
        [validateVatNumber]
    );

    useEffect(() => {
        return () => {
            checkVat.cancel();
        };
    }, [checkVat]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        const missingFieldErrors = getMissingFieldsErrors();
        if (Object.keys(missingFieldErrors).length > 0) {
            setFieldErrors(missingFieldErrors);
            setMessagePopup('Per favore riempi tutti i campi');
            setButtonPopup(true);
            return;
        }

        const resolvedEmail = noCompanyEmail ? (email.trim() || pec.trim()) : email.trim();
        const resolvedConfirmEmail = noCompanyEmail ? (confirmEmail.trim() || resolvedEmail) : confirmEmail.trim();

        if (!EMAIL_REGEX.test(resolvedEmail)) {
            setFieldErrors({ email: 'Email non valida' });
            setMessagePopup('Email non valida');
            setButtonPopup(true);
            return;
        }

        if (!EMAIL_REGEX.test(resolvedConfirmEmail)) {
            setFieldErrors({ confirmEmail: 'Email non valida' });
            setMessagePopup('Email non valida');
            setButtonPopup(true);
            return;
        }

        if (resolvedEmail !== resolvedConfirmEmail) {
            setFieldErrors({ email: 'Le email non corrispondono', confirmEmail: 'Le email non corrispondono' });
            setMessagePopup('Le email non corrispondono');
            setButtonPopup(true);
            return;
        }

        if (password !== confirmPassword) {
            setFieldErrors({ password: 'Le password non corrispondono', confirmPassword: 'Le password non corrispondono' });
            setMessagePopup('Le password non corrispondono');
            setButtonPopup(true);
            return;
        }

        if (!acceptedTerms) {
            setFieldErrors({ acceptedTerms: 'Devi accettare i termini e le condizioni' });
            setMessagePopup('Devi accettare i termini e le condizioni');
            setButtonPopup(true);
            return;
        }

        checkVat.cancel();
        setIsCheckingVat(true);
        const normalizedVat = normalizeVat(vat);
        const vatValidationResult = await validateVatNumber(normalizedVat);

        if (vatValidationResult !== true) {
            setMessagePopup(vatValidationMessage || 'La partita iva non è valida');
            setButtonPopup(true);
            return;
        }

        const formData = {
            username,
            company_name,
            email: resolvedEmail,
            confirmEmail: resolvedConfirmEmail,
            password,
            phone,
            company_website,
            pec,
            vat: normalizedVat,
            noCompanyEmail,
            legal_headquarter,
        };

        try {
            const response = await axios.post(`/api/signup`, formData, {
                withCredentials: true,
            });

            if (response.status === 200) {
                //reset fields
                // setUsername('');
                // setCompany_name('');
                // setPhone('');
                // setEmail('');
                // setConfirmEmail('');
                // setPassword('');
                // setConfirmPassword('');
                // setAcceptedTerms(false);
                // setCompanyWebsite('');
                // setPec('');
                // setVat('');

                navigate('/VerifyAccount');


            }

        } catch (error) {
            const backendMessage = error.response?.data?.msg || error.message;
            const backendFieldErrors = mapServerMessageToFieldErrors(backendMessage);
            if (Object.keys(backendFieldErrors).length > 0) {
                setFieldErrors((prevErrors) => ({ ...prevErrors, ...backendFieldErrors }));
            }
            setMessagePopup(backendMessage);
            setButtonPopup(true);
        }
    };

    const closePassInfo = () => {
        setPassInfo(false);
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 py-8 md:py-12 px-4 overflow-y-auto">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>

            {passInfo && <PassInfo onClose={closePassInfo} />}

            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="text-sm font-semibold text-[#2d7044] hover:underline">
                        Torna alla home
                    </Link>
                    <Link to="/login" className="text-sm text-slate-600 hover:text-[#2d7044] hover:underline">
                        Hai gia un account? Accedi
                    </Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-6 md:px-10">
                        <div className="mb-4 flex justify-center">
                            <img src="/img/logo.png" alt="logo" className="w-[150px] md:w-[180px]" />
                        </div>
                        <h1 className="text-center text-2xl font-bold text-[#2d7044] md:text-3xl">
                            Crea il tuo account
                        </h1>
                        <p className="mt-2 text-center text-sm text-slate-600">
                            Completa i campi per registrare il profilo aziendale.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6 md:px-10 md:py-8">
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">Informazioni del referente</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-6">
                        <div className="w-full">
                            <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">Nome e cognome del referente</label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                value={username}
                                onChange={handleUsernameChange}
                                className={getFieldClassName('username')}
                            />
                            {fieldErrors.username ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.username}</p> : null}
                        </div>

                        <div className="w-full">
                            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">Telefono</label>
                            <PhoneInput
                                country={'it'}
                                value={phone}
                                onChange={handlePhoneChange}
                                buttonClass="w-[45px] p-2 bg-gray-50"
                                dropdownClass="w-full p-2 bg-gray-50"
                                inputStyle={{
                                    width: '100%',
                                    height: '42px',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    border: `1px solid ${fieldErrors.phone ? '#f43f5e' : '#d1d5db'}`,
                                }}
                                preferredCountries={['it']}
                            />
                            {fieldErrors.phone ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.phone}</p> : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-8">
                        <div className="w-full">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                                    <svg
                                        className="cursor-pointer ml-2"
                                        onClick={togglePassInfo}
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-600">Mostra password</span>
                                    <input
                                        type="checkbox"
                                        name="showPassword"
                                        id="showPassword"
                                        onClick={toggleShowPassword}
                                        className="cursor-pointer"
                                    />
                                </div>
                            </div>

                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                value={password}
                                onChange={handlePasswordChange}
                                className={getFieldClassName('password')}
                            />
                            {fieldErrors.password ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.password}</p> : null}
                        </div>

                        <div className="w-full">
                            <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-slate-700">Conferma password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirm"
                                id="confirm"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                className={getFieldClassName('confirmPassword')}
                            />
                            {fieldErrors.confirmPassword ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.confirmPassword}</p> : null}
                        </div>
                    </div>

                    <h2 className="mb-4 text-lg font-semibold text-slate-800">Informazioni aziendali</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-6">
                        <div className="w-full">
                            <label htmlFor="vat" className="mb-2 block text-sm font-medium text-slate-700">Partita IVA (formato: codice paese + numero)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="vat"
                                    id="vat"
                                    value={vat}
                                    onChange={handleVatChange}
                                    placeholder="Inserisci la partita IVA"
                                className={`bg-gray-50 border ${fieldErrors.vat ? 'border-rose-500' : isValid === true ? 'border-green-500' : isValid === false ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 pr-20`} // <- spazio a destra
                                />
                                {(isCheckingVat || isValid !== null) && (
                                    <span
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${isCheckingVat ? 'text-gray-500' : isValid ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {isCheckingVat ? 'Verifica...' : isValid ? 'Valida' : 'Non valida'}
                                    </span>
                                )}
                            </div>
                            {fieldErrors.vat ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.vat}</p> : null}
                        </div>

                        <div className="w-full">
                            <label htmlFor="company_name" className="mb-2 block text-sm font-medium text-slate-700">Ragione sociale</label>
                            <input
                                type="text"
                                name="company_name"
                                id="company_name"
                                value={company_name}
                                onChange={handleCompanyNameChange}
                                className={getFieldClassName('company_name', 'text-gray-400')}
                                readOnly={isValid === true && Boolean(company_name)}
                            />
                            {fieldErrors.company_name ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.company_name}</p> : null}
                        </div>

                        <div className="w-full">
                            <label htmlFor="company_name" className="mb-2 block text-sm font-medium text-slate-700">Sede legale</label>
                            <input
                                type="text"
                                name="legal_headquarter"
                                id="legal_headquarter"
                                value={legal_headquarter}
                                onChange={handleLegalHeadquarterChange}
                                className={getFieldClassName('legal_headquarter', 'text-gray-400')}
                                readOnly={isValid === true && Boolean(legal_headquarter)}
                            />
                            {fieldErrors.legal_headquarter ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.legal_headquarter}</p> : null}
                        </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-6">

                        <div className="w-full">
                            <label htmlFor="pec" className="mb-2 block text-sm font-medium text-slate-700">PEC</label>
                            <input
                                type="text"
                                name="pec"
                                id="pec"
                                value={pec}
                                onChange={handlePecChange}
                                className={getFieldClassName('pec')}
                            />
                            {fieldErrors.pec ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.pec}</p> : null}
                        </div>

                        <div className="w-full">
                            <label htmlFor="company_website" className="mb-2 block text-sm font-medium text-slate-700">Sito web aziendale</label>
                            <input
                                type="text"
                                name="company_website"
                                id="company_website"
                                value={company_website}
                                onChange={handleCompanyWebsiteChange}
                                className={getFieldClassName('company_website')}
                            />
                            {fieldErrors.company_website ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.company_website}</p> : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-6">
                        {!noCompanyEmail ? (
                            <>
                                <div className="w-full">
                                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email aziendale</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        className={getFieldClassName('email')}
                                    />
                                    {fieldErrors.email ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.email}</p> : null}
                                </div>

                                <div className="w-full">
                                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Conferma email aziendale</label>
                                    <input
                                        type="email"
                                        name="email_confirm"
                                        id="email_confirm"
                                        value={confirmEmail}
                                        onChange={handleConfirmEmailChange}
                                        className={getFieldClassName('confirmEmail')}
                                    />
                                    {fieldErrors.confirmEmail ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.confirmEmail}</p> : null}
                                </div>
                            </>
                        ) : (
                            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                Hai indicato che non hai email aziendale: useremo la PEC come email per la registrazione.
                            </div>
                        )}
                    </div>

                    <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div className="flex items-start w-full">
                                <div className="h-5">
                                    <input
                                        id="noCompanyEmail"
                                        aria-describedby="noCompanyEmail"
                                        type="checkbox"
                                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                                        checked={noCompanyEmail}
                                        onChange={handleNoCompanyEmailChange}
                                    />
                                </div>

                                <div className="ml-3">
                                    <label htmlFor="noCompanyEmail" className="text-sm text-slate-700">
                                        Non ho una email aziendale
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-start w-full">
                                <div className="h-5">
                                    <input
                                        id="terms"
                                        aria-describedby="terms"
                                        type="checkbox"
                                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                                        checked={acceptedTerms}
                                        onChange={handleTermsChange}
                                    />
                                </div>

                                <div className="ml-3">
                                    <label htmlFor="terms" className="text-sm text-slate-700">
                                        Accetto i{" "}
                                        <a className="text-[#2d7044] hover:underline" href="#">
                                            Termini e Condizioni
                                        </a>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    {fieldErrors.acceptedTerms ? <p className="-mt-3 mb-4 text-sm text-rose-600">{fieldErrors.acceptedTerms}</p> : null}

                    <div className="mt-6 flex flex-col items-center gap-3">
                        <input
                            type="submit"
                            value="Registrati"
                            className="w-full rounded-lg bg-[#2d7044] px-4 py-2.5 text-base font-bold text-white transition-colors duration-300 hover:bg-[#255d39] md:w-[260px]"
                        />
                        <p className="text-sm text-slate-600">
                            Hai gia un account?{" "}
                            <Link to="/login" className="font-semibold text-[#2d7044] hover:underline">
                                Accedi
                            </Link>
                        </p>
                    </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
